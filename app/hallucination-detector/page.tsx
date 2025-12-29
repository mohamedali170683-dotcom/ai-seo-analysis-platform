'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, Loader2, Globe, Sparkles, Edit3, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Eye, Target, Bot, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';

// Brand positioning types
interface BrandPositioning {
  primary: string;
  secondary: string[];
  targetAudience: string;
  pricePoint: string;
  keyAttributes: string[];
  brandPromise: string;
  tone: string[];
}

interface PositioningAnalysis {
  id: string;
  brandName: string;
  domain: string;
  positioning: BrandPositioning;
  createdAt: string;
  scans: PositioningScan[];
}

interface PositioningScan {
  id: string;
  scanDate: string;
  status: string;
  alignmentScore: number;
  llmResults: LLMPositioningResult[];
}

interface LLMPositioningResult {
  llm: string;
  model: string;
  alignmentScore: number;
  responses: PositioningResponse[];
}

interface PositioningResponse {
  aspect: string;
  question: string;
  expectedAnswer: string;
  llmAnswer: string;
  alignment: 'aligned' | 'partially_aligned' | 'misaligned';
  explanation: string;
}

// Positioning options
const POSITIONING_OPTIONS = [
  'premium', 'luxury', 'affordable', 'value', 'innovative', 'traditional',
  'sustainable', 'eco-friendly', 'tech-forward', 'customer-centric',
  'quality-focused', 'disruptive', 'professional', 'enterprise',
  'lifestyle', 'health-conscious', 'performance', 'reliable'
];

const PRICE_POINTS = ['budget', 'value', 'mid-range', 'premium', 'luxury'];

const TONE_OPTIONS = [
  'professional', 'friendly', 'authoritative', 'playful', 'sophisticated',
  'innovative', 'trustworthy', 'bold', 'minimalist', 'warm'
];

// FAQ Data
const faqItems = [
  {
    question: "What is Brand Positioning Alignment?",
    answer: "Brand Positioning Alignment checks if AI models (like ChatGPT and Gemini) describe your brand the same way you position it on your website and marketing materials. For example, if you position yourself as a 'premium, innovative' brand, we verify that LLMs don't describe you as 'budget' or 'traditional'."
  },
  {
    question: "How do we extract your brand positioning?",
    answer: "We analyze your website's homepage, about page, and meta descriptions to understand how you describe your brand. We look for positioning signals like price points (luxury, affordable), attributes (innovative, sustainable), target audience, and brand tone. You can then adjust these before running the analysis."
  },
  {
    question: "What questions do we ask the LLMs?",
    answer: "We ask questions like 'How would you describe [brand]'s market positioning?', 'Is [brand] a premium or budget brand?', 'What is [brand]'s target audience?', 'What are [brand]'s key differentiators?'. These questions test if the LLM's perception matches your intended positioning."
  },
  {
    question: "What does the alignment score mean?",
    answer: "The alignment score (0-100%) shows how well LLMs represent your brand positioning. 90%+ means excellent alignment. 70-89% means mostly aligned with some gaps. Below 70% indicates significant misalignment that could affect how customers perceive your brand through AI interactions."
  },
  {
    question: "Why does brand positioning alignment matter?",
    answer: "As more customers use AI assistants to research products and make decisions, how LLMs describe your brand directly impacts perception and sales. If ChatGPT tells users you're a 'budget brand' when you position as 'premium', you may lose high-value customers who trust that AI recommendation."
  }
];

export default function HallucinationDetectorPage() {
  const [analyses, setAnalyses] = useState<PositioningAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PositioningAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Form states
  const [brandName, setBrandName] = useState('');
  const [domain, setDomain] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formStep, setFormStep] = useState<'input' | 'positioning'>('input');

  // Positioning form
  const [positioning, setPositioning] = useState<BrandPositioning>({
    primary: '',
    secondary: [],
    targetAudience: '',
    pricePoint: '',
    keyAttributes: [],
    brandPromise: '',
    tone: []
  });

  // Scan results
  const [lastScanResult, setLastScanResult] = useState<PositioningScan | null>(null);
  const [expandedLLM, setExpandedLLM] = useState<string | null>(null);

  // Edit positioning mode
  const [isEditingPositioning, setIsEditingPositioning] = useState(false);
  const [editPositioning, setEditPositioning] = useState<BrandPositioning | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/brand-positioning');
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.data || []);
        if (data.data?.length > 0 && !selectedAnalysis) {
          setSelectedAnalysis(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchPositioning = async () => {
    if (!brandName.trim() || !domain.trim()) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      // Normalize domain
      let normalizedDomain = domain.trim();
      if (!normalizedDomain.startsWith('http')) {
        normalizedDomain = `https://${normalizedDomain}`;
      }

      const response = await fetch('/api/brand-positioning/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brandName.trim(), domain: normalizedDomain })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setPositioning({
          primary: data.data.positioning?.primary || '',
          secondary: data.data.positioning?.secondary || [],
          targetAudience: data.data.positioning?.targetAudience || '',
          pricePoint: data.data.positioning?.pricePoint || '',
          keyAttributes: data.data.positioning?.keyAttributes || [],
          brandPromise: data.data.positioning?.brandPromise || '',
          tone: data.data.positioning?.tone || []
        });
        setFormStep('positioning');
      } else {
        setFetchError(data.error || 'Could not fetch positioning. Please enter manually.');
        // Still move to positioning step with empty form
        setFormStep('positioning');
      }
    } catch (error) {
      console.error('Error fetching positioning:', error);
      setFetchError('Failed to fetch. Please enter positioning manually.');
      setFormStep('positioning');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!brandName.trim() || !positioning.primary) {
      setSaveError('Please enter brand name and at least a primary positioning');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/brand-positioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          domain: domain.trim(),
          positioning
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        await fetchAnalyses();
        if (data.data?.id) {
          setSelectedAnalysis(data.data);
        }
        setTimeout(() => {
          resetForm();
        }, 1500);
      } else {
        setSaveError(data.error || 'Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      setSaveError('Failed to save. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setFormStep('input');
    setBrandName('');
    setDomain('');
    setPositioning({
      primary: '',
      secondary: [],
      targetAudience: '',
      pricePoint: '',
      keyAttributes: [],
      brandPromise: '',
      tone: []
    });
    setFetchError(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const runPositioningScan = async (analysisId: string) => {
    setIsScanning(true);
    setLastScanResult(null);

    try {
      const response = await fetch('/api/brand-positioning/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId })
      });

      const data = await response.json();
      if (data.success && data.data) {
        setLastScanResult(data.data);
        await fetchAnalyses();
        // Refresh selected analysis
        const updated = await fetch(`/api/brand-positioning/${analysisId}`);
        const updatedData = await updated.json();
        if (updatedData.success) {
          setSelectedAnalysis(updatedData.data);
        }
      }
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSecondary = (value: string) => {
    setPositioning(prev => ({
      ...prev,
      secondary: prev.secondary.includes(value)
        ? prev.secondary.filter(s => s !== value)
        : [...prev.secondary, value]
    }));
  };

  const toggleTone = (value: string) => {
    setPositioning(prev => ({
      ...prev,
      tone: prev.tone.includes(value)
        ? prev.tone.filter(t => t !== value)
        : [...prev.tone, value]
    }));
  };

  const toggleAttribute = (value: string) => {
    setPositioning(prev => ({
      ...prev,
      keyAttributes: prev.keyAttributes.includes(value)
        ? prev.keyAttributes.filter(a => a !== value)
        : [...prev.keyAttributes, value]
    }));
  };

  // Edit positioning functions
  const startEditPositioning = () => {
    if (selectedAnalysis?.positioning) {
      setEditPositioning({ ...selectedAnalysis.positioning });
      setIsEditingPositioning(true);
    }
  };

  const cancelEditPositioning = () => {
    setEditPositioning(null);
    setIsEditingPositioning(false);
  };

  const toggleEditSecondary = (value: string) => {
    if (!editPositioning) return;
    setEditPositioning(prev => prev ? ({
      ...prev,
      secondary: prev.secondary.includes(value)
        ? prev.secondary.filter(s => s !== value)
        : [...prev.secondary, value]
    }) : null);
  };

  const toggleEditTone = (value: string) => {
    if (!editPositioning) return;
    setEditPositioning(prev => prev ? ({
      ...prev,
      tone: prev.tone.includes(value)
        ? prev.tone.filter(t => t !== value)
        : [...prev.tone, value]
    }) : null);
  };

  const saveEditPositioning = async () => {
    if (!selectedAnalysis || !editPositioning) return;

    setIsSavingEdit(true);
    try {
      const response = await fetch('/api/brand-positioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAnalysis.id,
          brandName: selectedAnalysis.brandName,
          domain: selectedAnalysis.domain,
          positioning: editPositioning
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the analysis data
        await fetchAnalyses();
        // Update selected analysis with new positioning
        setSelectedAnalysis(prev => prev ? {
          ...prev,
          positioning: editPositioning
        } : null);
        setIsEditingPositioning(false);
        setEditPositioning(null);
      }
    } catch (error) {
      console.error('Error saving positioning:', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'aligned': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'partially_aligned': return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'misaligned': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'aligned': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'partially_aligned': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'misaligned': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return SEMANTIC_COLORS.positive;
    if (score >= 70) return SEMANTIC_COLORS.warning;
    return SEMANTIC_COLORS.critical;
  };

  const latestScan = selectedAnalysis?.scans?.[0] || lastScanResult;

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
                Brand Positioning Alignment
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Check if AI models portray your brand the way you position it
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
                if (showCreateForm) {
                  // Closing the form
                  setShowCreateForm(false);
                } else {
                  // Opening the form - reset first, then show
                  setFormStep('input');
                  setBrandName('');
                  setDomain('');
                  setPositioning({
                    primary: '',
                    secondary: [],
                    targetAudience: '',
                    pricePoint: '',
                    keyAttributes: [],
                    brandPromise: '',
                    tone: []
                  });
                  setFetchError(null);
                  setSaveError(null);
                  setSaveSuccess(false);
                  setShowCreateForm(true);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : '+ Add Brand'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              {/* Step 1: Brand Name & Domain */}
              {formStep === 'input' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Add Your Brand
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enter your brand name and website domain. We&apos;ll analyze your website to understand how you position your brand.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g., Apple, Nike, Tesla"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website Domain *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          placeholder="e.g., apple.com"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {fetchError && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-400 text-sm">
                      {fetchError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleFetchPositioning}
                      disabled={isFetching || !brandName.trim() || !domain.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Website...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Fetch Brand Positioning
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setFormStep('positioning')}
                      disabled={!brandName.trim()}
                      className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Skip & Enter Manually
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>What we analyze:</strong> Your homepage, about page, meta descriptions, and key messaging to understand your brand positioning, target audience, price point, and brand tone.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Review & Edit Positioning */}
              {formStep === 'positioning' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Define Your Brand Positioning
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        for {brandName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Review and adjust how you want your brand to be perceived. This is what we&apos;ll check against LLM descriptions.
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

                  {/* Primary Positioning */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Positioning *
                    </label>
                    <select
                      value={positioning.primary}
                      onChange={(e) => setPositioning({ ...positioning, primary: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select primary positioning...</option>
                      {POSITIONING_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Positioning */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary Positioning (select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POSITIONING_OPTIONS.filter(opt => opt !== positioning.primary).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleSecondary(opt)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            positioning.secondary.includes(opt)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                          }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Point */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Point
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_POINTS.map(pp => (
                        <button
                          key={pp}
                          type="button"
                          onClick={() => setPositioning({ ...positioning, pricePoint: pp })}
                          className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                            positioning.pricePoint === pp
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                          }`}
                        >
                          {pp.charAt(0).toUpperCase() + pp.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={positioning.targetAudience}
                      onChange={(e) => setPositioning({ ...positioning, targetAudience: e.target.value })}
                      placeholder="e.g., Young professionals aged 25-40, tech-savvy consumers"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Brand Promise */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand Promise / Value Proposition
                    </label>
                    <textarea
                      value={positioning.brandPromise}
                      onChange={(e) => setPositioning({ ...positioning, brandPromise: e.target.value })}
                      placeholder="e.g., We deliver innovative technology that simplifies your life"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Brand Tone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand Tone / Voice
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TONE_OPTIONS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTone(t)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            positioning.tone.includes(t)
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-400'
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSaveAnalysis}
                      disabled={isSaving || !positioning.primary}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          Save Brand Positioning
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setFormStep('input')}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Back
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Brand List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => setSelectedAnalysis(analysis)}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedAnalysis?.id === analysis.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h3 className="font-semibold text-lg dark:text-gray-100">{analysis.brandName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.domain}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                    {analysis.positioning?.primary}
                  </span>
                  {analysis.positioning?.pricePoint && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                      {analysis.positioning.pricePoint}
                    </span>
                  )}
                </div>
                {analysis.scans?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm" style={{ color: getScoreColor(analysis.scans[0].alignmentScore) }}>
                      {analysis.scans[0].alignmentScore}% alignment
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {analyses.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No brands added yet. Click &quot;Add Brand&quot; to get started.
            </div>
          )}
        </div>

        {/* Selected Brand Analysis */}
        {selectedAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold dark:text-gray-100">
                  Positioning Alignment Report
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedAnalysis.brandName} • {selectedAnalysis.domain}
                </p>
              </div>
              <button
                onClick={() => runPositioningScan(selectedAnalysis.id)}
                disabled={isScanning}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning LLMs...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Run Alignment Check
                  </>
                )}
              </button>
            </div>

            {/* Your Defined Positioning */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Your Brand Positioning
                </h3>
                {!isEditingPositioning && (
                  <button
                    onClick={startEditPositioning}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingPositioning && editPositioning ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Primary Positioning */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Primary *</label>
                    <select
                      value={editPositioning.primary}
                      onChange={(e) => setEditPositioning({ ...editPositioning, primary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="">Select...</option>
                      {POSITIONING_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Positioning */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Secondary</label>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITIONING_OPTIONS.filter(opt => opt !== editPositioning.primary).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleEditSecondary(opt)}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${
                            editPositioning.secondary.includes(opt)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                          }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Point */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Price Point</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRICE_POINTS.map(pp => (
                        <button
                          key={pp}
                          type="button"
                          onClick={() => setEditPositioning({ ...editPositioning, pricePoint: pp })}
                          className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                            editPositioning.pricePoint === pp
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                          }`}
                        >
                          {pp.charAt(0).toUpperCase() + pp.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={editPositioning.targetAudience}
                      onChange={(e) => setEditPositioning({ ...editPositioning, targetAudience: e.target.value })}
                      placeholder="e.g., Young professionals aged 25-40"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  {/* Brand Promise */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Brand Promise</label>
                    <input
                      type="text"
                      value={editPositioning.brandPromise}
                      onChange={(e) => setEditPositioning({ ...editPositioning, brandPromise: e.target.value })}
                      placeholder="Your value proposition"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TONE_OPTIONS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleEditTone(t)}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${
                            editPositioning.tone.includes(t)
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-400'
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEditPositioning}
                      disabled={isSavingEdit || !editPositioning.primary}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {isSavingEdit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={cancelEditPositioning}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    After saving, click &quot;Run Alignment Check&quot; to re-test with your updated positioning.
                  </p>
                </div>
              ) : (
                /* Display Mode */
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Primary</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedAnalysis.positioning?.primary}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Price Point</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedAnalysis.positioning?.pricePoint || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Target Audience</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAnalysis.positioning?.targetAudience || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Tone</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {selectedAnalysis.positioning?.tone?.join(', ') || 'Not set'}
                      </p>
                    </div>
                  </div>
                  {selectedAnalysis.positioning?.secondary && selectedAnalysis.positioning.secondary.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Secondary Attributes</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {selectedAnalysis.positioning.secondary.join(', ')}
                      </p>
                    </div>
                  )}
                  {selectedAnalysis.positioning?.brandPromise && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Brand Promise</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAnalysis.positioning.brandPromise}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {latestScan ? (
              <>
                {/* Overall Alignment Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Overall Alignment
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-3xl font-bold"
                          style={{ color: getScoreColor(latestScan.alignmentScore) }}
                        >
                          {latestScan.alignmentScore}%
                        </span>
                        {latestScan.alignmentScore >= 90 ? (
                          <CheckCircle2 className="w-5 h-5" style={{ color: SEMANTIC_COLORS.positive }} />
                        ) : latestScan.alignmentScore >= 70 ? (
                          <AlertTriangle className="w-5 h-5" style={{ color: SEMANTIC_COLORS.warning }} />
                        ) : (
                          <XCircle className="w-5 h-5" style={{ color: SEMANTIC_COLORS.critical }} />
                        )}
                      </div>
                    </div>
                  </div>
                  {latestScan.llmResults?.map((result) => (
                    <div key={result.llm} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {result.llm.toUpperCase()}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-3xl font-bold"
                            style={{ color: getScoreColor(result.alignmentScore) }}
                          >
                            {result.alignmentScore}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{result.model}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* LLM Results Detail */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Detailed Comparison
                  </h3>

                  {latestScan.llmResults?.map((result) => (
                    <div key={result.llm} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedLLM(expandedLLM === result.llm ? null : result.llm)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{result.llm.toUpperCase()}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({result.model})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className="text-lg font-bold"
                            style={{ color: getScoreColor(result.alignmentScore) }}
                          >
                            {result.alignmentScore}% aligned
                          </span>
                          {expandedLLM === result.llm ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {expandedLLM === result.llm && (
                        <div className="p-4 space-y-4">
                          {result.responses?.map((response, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border ${getAlignmentColor(response.alignment)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getAlignmentIcon(response.alignment)}
                                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                    {response.aspect.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  response.alignment === 'aligned' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                                  response.alignment === 'partially_aligned' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                }`}>
                                  {response.alignment.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div className="mb-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  <strong>Question:</strong> {response.question}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Your Positioning</span>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{response.expectedAnswer}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">LLM Says</span>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{response.llmAnswer}</p>
                                </div>
                              </div>

                              {response.explanation && (
                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                                  {response.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                  <Target className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
                </div>
                <p className="mb-4 text-lg font-medium">No alignment checks run yet</p>
                <p className="text-sm mb-6">
                  Click &quot;Run Alignment Check&quot; to see how LLMs describe your brand compared to your positioning.
                </p>
                <div className="text-left max-w-md mx-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">What we&apos;ll check:</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                      <span>Ask LLMs about your brand&apos;s positioning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-purple-500 mt-0.5" />
                      <span>Compare their answers to your defined positioning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Calculate alignment score for each aspect</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
