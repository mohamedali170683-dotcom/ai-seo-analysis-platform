'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, Loader2, Globe, BookOpen, Sparkles, Edit3, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';

interface GroundTruth {
  id: string;
  companyName: string;
  foundedYear?: number;
  headquarters?: string;
  ceo?: string;
  employeeCount?: number;
  industry?: string;
  description?: string;
  websiteUrl?: string;
  products: Product[];
  competitorDifferentiators: CompetitorDifferentiator[];
  hallucinationDetections: HallucinationDetection[];
}

interface Product {
  id: string;
  name: string;
  launchYear?: number;
  currentlyAvailable: boolean;
}

interface CompetitorDifferentiator {
  id: string;
  competitor: string;
  theirFeature: string;
  ourEquivalent?: string;
  commonlyConfused: boolean;
}

interface HallucinationDetection {
  id: string;
  scanDate: string;
  status: string;
  overallAccuracy?: number;
  adjustedAccuracy?: number;
  riskLevel?: string;
  hallucinations: Hallucination[];
  recommendations: Recommendation[];
}

interface Hallucination {
  id: string;
  llm: string;
  query: string;
  claimedFact: string;
  actualFact: string;
  category: string;
  severity: string;
  status: string;
}

interface Recommendation {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  affectedLLMs: string[];
  status: string;
}

interface FetchedBrandData {
  companyName: string;
  description?: string;
  foundedYear?: number;
  headquarters?: string;
  ceo?: string;
  employeeCount?: number;
  industry?: string;
  websiteUrl?: string;
  positioning?: {
    primary: string;
    secondary?: string[];
    pricePoint?: string;
    keyAttributes?: string[];
    suggestedDescription?: string;
  };
  sources: Array<{
    type: 'wikipedia' | 'website' | 'inferred';
    field: string;
    confidence: number;
  }>;
  confidence: {
    overall: number;
    wikipedia: number;
    website: number;
  };
}

type FormStep = 'search' | 'review' | 'manual';

// FAQ Data
const faqItems = [
  {
    question: "How does the auto-fetch feature work?",
    answer: "When you enter a brand name or website URL, we automatically search Wikipedia and the company's website to gather verified information. We extract data from Wikipedia's infobox (company facts table) and parse structured data (JSON-LD, meta tags) from the website. This gives you a head start instead of manually entering everything."
  },
  {
    question: "What is Brand Positioning and how is it detected?",
    answer: "Brand positioning describes how a brand differentiates itself in the market. We analyze text from Wikipedia and the company website to detect positioning signals like 'premium', 'innovative', 'affordable', 'sustainable', etc. We also identify price points (budget, mid-range, premium, luxury) and key brand attributes. This helps the detector understand what claims should be accurate about your brand."
  },
  {
    question: "Why might some fields not be fetched automatically?",
    answer: "Not all companies have complete Wikipedia pages, and website structured data varies. Some reasons fields might be missing: 1) The Wikipedia page doesn't have an infobox, 2) The information is formatted differently than expected, 3) The website doesn't use standard meta tags or JSON-LD schema. You can always add or edit this information manually."
  },
  {
    question: "What does the confidence score mean?",
    answer: "The confidence score (shown as a percentage) indicates how reliable the fetched data is. Higher scores mean data was found from multiple authoritative sources. Wikipedia data typically has 85-95% confidence, while structured data from official websites has 90-100% confidence. Lower scores suggest you should verify the information before saving."
  },
  {
    question: "How does the hallucination detection scan work?",
    answer: "After you save your brand's ground truth data, you can run a scan. The system asks AI models (ChatGPT, Gemini) questions about your brand and compares their answers against your verified data. Any discrepancies—like wrong founding dates, incorrect CEO names, or fabricated features—are flagged as hallucinations with severity ratings."
  },
  {
    question: "What should I do when hallucinations are detected?",
    answer: "Each hallucination comes with recommendations. For critical issues (like wrong safety claims), you may need to update your public content to be clearer. For minor issues (outdated info), ensure your latest data is published online. The goal is to help AI models learn correct information about your brand over time."
  },
  {
    question: "Can I edit the auto-fetched information?",
    answer: "Yes! All auto-fetched data is fully editable before you save. The fetched data is just a starting point—you should review and correct any inaccuracies. The small labels under each field show where the data came from (Wikipedia or website), so you know which sources to verify."
  }
];

export default function HallucinationDetectorPage() {
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [selectedGroundTruth, setSelectedGroundTruth] = useState<GroundTruth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // New state for auto-fetch flow
  const [formStep, setFormStep] = useState<FormStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedData, setFetchedData] = useState<FetchedBrandData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    foundedYear: '',
    headquarters: '',
    ceo: '',
    employeeCount: '',
    industry: '',
    websiteUrl: '',
    description: '',
    positioning: '',
    pricePoint: ''
  });

  useEffect(() => {
    fetchGroundTruths();
  }, []);

  const fetchGroundTruths = async () => {
    try {
      const response = await fetch('/api/ground-truth');
      const data = await response.json();
      if (data.success) {
        setGroundTruths(data.data);
        if (data.data.length > 0 && !selectedGroundTruth) {
          setSelectedGroundTruth(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching ground truths:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchBrandData = async () => {
    if (!searchQuery.trim()) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/brand-data/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandNameOrUrl: searchQuery.trim() })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setFetchedData(data.data);
        // Pre-fill form with fetched data
        setFormData({
          companyName: data.data.companyName || searchQuery,
          foundedYear: data.data.foundedYear?.toString() || '',
          headquarters: data.data.headquarters || '',
          ceo: data.data.ceo || '',
          employeeCount: data.data.employeeCount?.toString() || '',
          industry: data.data.industry || '',
          websiteUrl: data.data.websiteUrl || '',
          description: data.data.description || '',
          positioning: data.data.positioning?.primary || '',
          pricePoint: data.data.positioning?.pricePoint || ''
        });
        setFormStep('review');
      } else {
        setFetchError(data.error || 'Failed to fetch brand data. Try entering information manually.');
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
      setFetchError('Failed to fetch brand data. Please try again or enter manually.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreateGroundTruth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const payload = {
        companyName: formData.companyName,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        headquarters: formData.headquarters || undefined,
        ceo: formData.ceo || undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        industry: formData.industry || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        description: formData.description || undefined
      };

      console.log('Saving brand with payload:', payload);

      const response = await fetch('/api/ground-truth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (data.success) {
        setSaveSuccess(true);
        await fetchGroundTruths();
        // Select the newly created brand
        if (data.data?.id) {
          const newBrand = { ...data.data, hallucinationDetections: [], products: [], competitorDifferentiators: [] };
          setSelectedGroundTruth(newBrand);
        }
        // Reset form after short delay to show success message
        setTimeout(() => {
          resetForm();
        }, 1500);
      } else {
        setSaveError(data.error || 'Failed to save brand. Please try again.');
      }
    } catch (error) {
      console.error('Error creating ground truth:', error);
      setSaveError('Failed to save brand. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setFormStep('search');
    setSearchQuery('');
    setFetchedData(null);
    setFetchError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setFormData({
      companyName: '',
      foundedYear: '',
      headquarters: '',
      ceo: '',
      employeeCount: '',
      industry: '',
      websiteUrl: '',
      description: '',
      positioning: '',
      pricePoint: ''
    });
  };

  const runScan = async (groundTruthId: string) => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/hallucination-detection/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groundTruthId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchGroundTruths();
        // Refresh selected ground truth
        const detailResponse = await fetch(`/api/ground-truth/${groundTruthId}`);
        const detailData = await detailResponse.json();
        if (detailData.success) {
          setSelectedGroundTruth(detailData.data);
        }
      }
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:border-gray-700';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'wikipedia': return <BookOpen className="w-3 h-3" />;
      case 'website': return <Globe className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const latestDetection = selectedGroundTruth?.hallucinationDetections?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Misinformation & Hallucination Detector
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Detect factual errors, outdated information, and competitor confusion in LLM responses
              </p>
            </div>
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span>How it works</span>
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        {showFaq && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                Frequently Asked Questions
              </h2>
              <button
                onClick={() => setShowFaq(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brand Selection & Create */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold dark:text-gray-100">Your Brands</h2>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (!showCreateForm) {
                  setFormStep('search');
                  setSaveError(null);
                  setSaveSuccess(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Brand
            </button>
          </div>

          {/* Create Form - New Multi-Step Flow */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              {/* Step 1: Search/Fetch */}
              {formStep === 'search' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Add New Brand
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enter a brand name or website URL to automatically fetch company information from Wikipedia and their website.
                      We&apos;ll extract details like founding year, headquarters, CEO, employee count, industry, and detect the brand&apos;s market positioning.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isFetching && handleFetchBrandData()}
                        placeholder="e.g., Apple, Tesla, Microsoft, or https://company.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <button
                      onClick={handleFetchBrandData}
                      disabled={isFetching || !searchQuery.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 min-w-[140px] justify-center"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Fetch Info
                        </>
                      )}
                    </button>
                  </div>

                  {fetchError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                      {fetchError}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>or</span>
                    <button
                      onClick={() => setFormStep('manual')}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      enter information manually
                    </button>
                  </div>

                  {/* Quick info about what gets fetched */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>What we fetch:</strong> Company name, founding year, headquarters, CEO, employee count, industry, website, description, and brand positioning (premium, innovative, affordable, etc.)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Review Fetched Data */}
              {formStep === 'review' && fetchedData && (
                <form onSubmit={handleCreateGroundTruth} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Review & Edit Brand Information
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`${getConfidenceColor(fetchedData.confidence.overall)}`}>
                          {Math.round(fetchedData.confidence.overall * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      We found the following information. Please review and edit as needed before saving.
                      Fields marked with a source label were automatically fetched.
                    </p>
                  </div>

                  {/* Success/Error Messages */}
                  {saveSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Brand saved successfully!
                    </div>
                  )}
                  {saveError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {saveError}
                    </div>
                  )}

                  {/* Data Sources */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {fetchedData.confidence.wikipedia > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                        <BookOpen className="w-3 h-3" />
                        Wikipedia
                      </span>
                    )}
                    {fetchedData.confidence.website > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                        <Globe className="w-3 h-3" />
                        Website
                      </span>
                    )}
                  </div>

                  {/* Brand Positioning Card */}
                  {fetchedData.positioning && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-purple-900 dark:text-purple-100">Detected Brand Positioning</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-600 text-white rounded text-sm">
                          {fetchedData.positioning.primary.replace(/-/g, ' ')}
                        </span>
                        {fetchedData.positioning.secondary?.map((pos, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded text-sm">
                            {pos.replace(/-/g, ' ')}
                          </span>
                        ))}
                        {fetchedData.positioning.pricePoint && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm">
                            {fetchedData.positioning.pricePoint}
                          </span>
                        )}
                      </div>
                      {fetchedData.positioning.keyAttributes && fetchedData.positioning.keyAttributes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {fetchedData.positioning.keyAttributes.map((attr, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 rounded text-xs">
                              {attr}
                            </span>
                          ))}
                        </div>
                      )}
                      {fetchedData.positioning.suggestedDescription && (
                        <p className="mt-2 text-sm text-purple-800 dark:text-purple-200 italic">
                          &quot;{fetchedData.positioning.suggestedDescription}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md pr-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <Edit3 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {fetchedData.sources.find(s => s.field === 'companyName') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'companyName')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'companyName')?.type}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Founded Year
                      </label>
                      <input
                        type="number"
                        value={formData.foundedYear}
                        onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                      {fetchedData.sources.find(s => s.field === 'foundedYear') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'foundedYear')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'foundedYear')?.type}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Headquarters
                      </label>
                      <input
                        type="text"
                        value={formData.headquarters}
                        onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                        placeholder="e.g., Cupertino, California, USA"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      {fetchedData.sources.find(s => s.field === 'headquarters') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'headquarters')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'headquarters')?.type}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CEO
                      </label>
                      <input
                        type="text"
                        value={formData.ceo}
                        onChange={(e) => setFormData({ ...formData, ceo: e.target.value })}
                        placeholder="e.g., Tim Cook"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      {fetchedData.sources.find(s => s.field === 'ceo') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'ceo')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'ceo')?.type}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employee Count
                      </label>
                      <input
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        placeholder="e.g., 164000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                      {fetchedData.sources.find(s => s.field === 'employeeCount') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'employeeCount')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'employeeCount')?.type}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Consumer electronics, Software"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      {fetchedData.sources.find(s => s.field === 'industry') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'industry')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'industry')?.type}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://www.example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Brief description of the company..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      {fetchedData.sources.find(s => s.field === 'description') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          {getSourceIcon(fetchedData.sources.find(s => s.field === 'description')?.type || '')}
                          from {fetchedData.sources.find(s => s.field === 'description')?.type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving || !formData.companyName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 min-w-[120px] justify-center"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Brand'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep('search')}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Manual Entry Mode */}
              {formStep === 'manual' && (
                <form onSubmit={handleCreateGroundTruth} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Enter Brand Information Manually
                    </h3>
                  </div>

                  {/* Success/Error Messages */}
                  {saveSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Brand saved successfully!
                    </div>
                  )}
                  {saveError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {saveError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Founded Year
                      </label>
                      <input
                        type="number"
                        value={formData.foundedYear}
                        onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Headquarters
                      </label>
                      <input
                        type="text"
                        value={formData.headquarters}
                        onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CEO
                      </label>
                      <input
                        type="text"
                        value={formData.ceo}
                        onChange={(e) => setFormData({ ...formData, ceo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employee Count
                      </label>
                      <input
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving || !formData.companyName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 min-w-[120px] justify-center"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Create Brand'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep('search')}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Back to Search
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Brand List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groundTruths.map((gt) => (
              <div
                key={gt.id}
                onClick={() => setSelectedGroundTruth(gt)}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedGroundTruth?.id === gt.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h3 className="font-semibold text-lg dark:text-gray-100">{gt.companyName}</h3>
                {gt.foundedYear && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Founded: {gt.foundedYear}</p>
                )}
                {gt.industry && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{gt.industry}</p>
                )}
                {gt.hallucinationDetections?.length > 0 && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${getRiskColor(
                      gt.hallucinationDetections[0].riskLevel
                    )}`}>
                      {gt.hallucinationDetections[0].riskLevel || 'No scans'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {groundTruths.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No brands added yet. Click &quot;Add Brand&quot; to get started.
            </div>
          )}
        </div>

        {/* Selected Brand Details */}
        {selectedGroundTruth && (
          <>
            {/* Accuracy Dashboard */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold dark:text-gray-100">Brand Accuracy Report</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedGroundTruth.companyName}
                    {selectedGroundTruth.industry && ` • ${selectedGroundTruth.industry}`}
                  </p>
                </div>
                <button
                  onClick={() => runScan(selectedGroundTruth.id)}
                  disabled={isScanning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    'Run New Scan'
                  )}
                </button>
              </div>

              {latestDetection ? (
                <>
                  {/* Overall Score */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Overall Accuracy</span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-3xl font-bold"
                            style={{
                              color: (() => {
                                const accuracy = latestDetection.adjustedAccuracy || 0;
                                return accuracy >= 90 ? SEMANTIC_COLORS.positive :
                                       accuracy >= 70 ? SEMANTIC_COLORS.warning :
                                       SEMANTIC_COLORS.critical;
                              })()
                            }}
                          >
                            {latestDetection.adjustedAccuracy}%
                          </span>
                          {(() => {
                            const accuracy = latestDetection.adjustedAccuracy || 0;
                            return accuracy >= 90 ? <CheckCircle2 className="w-5 h-5" style={{color: SEMANTIC_COLORS.positive}} /> :
                                   accuracy >= 70 ? <AlertTriangle className="w-5 h-5" style={{color: SEMANTIC_COLORS.warning}} /> :
                                   <XCircle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />;
                          })()}
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{latestDetection.riskLevel} Risk</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hallucinations Found</span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-3xl font-bold"
                            style={{
                              color: (latestDetection.hallucinations?.length || 0) > 0
                                ? SEMANTIC_COLORS.critical
                                : SEMANTIC_COLORS.muted
                            }}
                          >
                            {latestDetection.hallucinations?.length || 0}
                          </span>
                          {(latestDetection.hallucinations?.length || 0) > 0 && (
                            <XCircle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recommendations</span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-3xl font-bold"
                            style={{
                              color: (latestDetection.recommendations?.length || 0) > 0
                                ? SEMANTIC_COLORS.warning
                                : SEMANTIC_COLORS.muted
                            }}
                          >
                            {latestDetection.recommendations?.length || 0}
                          </span>
                          {(latestDetection.recommendations?.length || 0) > 0 && (
                            <AlertTriangle className="w-5 h-5" style={{color: SEMANTIC_COLORS.warning}} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">LLMs Tested</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">2</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">ChatGPT, Gemini</span>
                      </div>
                    </div>
                  </div>

                  {/* Hallucinations List */}
                  {latestDetection.hallucinations && latestDetection.hallucinations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Detected Hallucinations</h3>
                      <div className="space-y-3">
                        {latestDetection.hallucinations.map((h) => (
                          <div key={h.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: (() => {
                                      switch (h.severity) {
                                        case 'CRITICAL': return '#fee2e2';
                                        case 'HIGH': return '#fed7aa';
                                        case 'MEDIUM': return '#fef3c7';
                                        case 'LOW': return '#dbeafe';
                                        default: return '#f3f4f6';
                                      }
                                    })(),
                                    color: (() => {
                                      switch (h.severity) {
                                        case 'CRITICAL': return SEMANTIC_COLORS.critical;
                                        case 'HIGH': return '#ea580c';
                                        case 'MEDIUM': return SEMANTIC_COLORS.warning;
                                        case 'LOW': return '#2563eb';
                                        default: return '#4b5563';
                                      }
                                    })()
                                  }}
                                >
                                  {h.severity}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {h.llm.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {h.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm mb-2 dark:text-gray-300">
                              <strong>Query:</strong> {h.query}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-red-600 dark:text-red-400 font-medium">Claimed:</span>
                                <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded dark:text-gray-200">
                                  {h.claimedFact}
                                </div>
                              </div>
                              <div>
                                <span className="text-green-600 dark:text-green-400 font-medium">Actual:</span>
                                <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded dark:text-gray-200">
                                  {h.actualFact}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {latestDetection.recommendations && latestDetection.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Recommendations</h3>
                      <div className="space-y-3">
                        {latestDetection.recommendations.map((r) => (
                          <div key={r.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium dark:text-gray-100">{r.title}</h4>
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: (() => {
                                    switch (r.priority) {
                                      case 'critical': return '#fee2e2';
                                      case 'high': return '#fed7aa';
                                      case 'medium': return '#fef3c7';
                                      default: return '#dbeafe';
                                    }
                                  })(),
                                  color: (() => {
                                    switch (r.priority) {
                                      case 'critical': return SEMANTIC_COLORS.critical;
                                      case 'high': return '#ea580c';
                                      case 'medium': return SEMANTIC_COLORS.warning;
                                      default: return '#2563eb';
                                    }
                                  })()
                                }}
                              >
                                {r.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{r.description}</p>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Affected LLMs: {r.affectedLLMs.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-4">No scans run yet. Click &quot;Run New Scan&quot; to start detecting hallucinations.</p>
                  <p className="text-sm">The scan will query AI models about your brand and compare responses against your verified data.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
