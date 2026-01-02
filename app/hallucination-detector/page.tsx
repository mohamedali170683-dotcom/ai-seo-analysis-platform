'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, Loader2, Globe, Sparkles, Edit3, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Eye, Target, Bot, TrendingUp, TrendingDown, Minus, RefreshCw, Trash2, ExternalLink, FileText, Lightbulb, BarChart3, Users, Download, Plus, X } from 'lucide-react';
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

interface Citation {
  url: string;
  title: string;
  snippet?: string;
  sourceType?: string;
}

interface PositioningResponse {
  aspect: string;
  question: string;
  expectedAnswer: string;
  llmAnswer: string;
  alignment: 'aligned' | 'partially_aligned' | 'misaligned';
  explanation: string;
  recommendation?: string;
  citations?: Citation[];
}

interface ContentRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  targetPlatforms: string[];
}

interface SourceAnalysis {
  totalSources: number;
  byType: Record<string, { count: number; percentage: number; urls: string[] }>;
  insights: string[];
}

interface ScanResult {
  id: string;
  scanDate: string;
  status: string;
  alignmentScore: number;
  llmResults: LLMPositioningResult[];
  sourceAnalysis?: SourceAnalysis;
  recommendations?: ContentRecommendation[];
}

interface CompetitorComparison {
  competitor: string;
  positioning: {
    primary: string;
    pricePoint: string;
    targetAudience: string;
    keyAttributes: string[];
  };
  llmPerception: {
    chatgpt: string;
    gemini: string;
    perplexity: string;
    claude: string;
  };
  comparisonInsights: string[];
  differentiationOpportunities: string[];
}

interface CompetitorAnalysis {
  brandName: string;
  competitors: CompetitorComparison[];
  overallInsights: string[];
  generatedAt: string;
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
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [expandedLLM, setExpandedLLM] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'sources' | 'recommendations' | 'trends' | 'competitors'>('analysis');

  // Edit positioning mode
  const [isEditingPositioning, setIsEditingPositioning] = useState(false);
  const [editPositioning, setEditPositioning] = useState<BrandPositioning | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Competitor comparison
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [isComparingCompetitors, setIsComparingCompetitors] = useState(false);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);

  // Export
  const [isExporting, setIsExporting] = useState(false);

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

  // Select brand and fetch full data including scan results
  const selectBrand = async (analysis: PositioningAnalysis) => {
    setSelectedAnalysis(analysis);
    setLastScanResult(null); // Clear previous scan result
    setIsEditingPositioning(false);
    setExpandedLLM(null);

    // Fetch full data with LLM results
    try {
      const response = await fetch(`/api/brand-positioning/${analysis.id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setSelectedAnalysis(data.data);
      }
    } catch (error) {
      console.error('Error fetching brand details:', error);
    }
  };

  // Delete brand
  const deleteBrand = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/brand-positioning/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        // Clear selection if deleted brand was selected
        if (selectedAnalysis?.id === id) {
          setSelectedAnalysis(null);
          setLastScanResult(null);
        }
        // Refresh list
        await fetchAnalyses();
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
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

  // Competitor comparison functions
  const addCompetitorField = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, '']);
    }
  };

  const removeCompetitorField = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const runCompetitorComparison = async () => {
    if (!selectedAnalysis) return;
    const validCompetitors = competitors.filter(c => c.trim());
    if (validCompetitors.length === 0) return;

    setIsComparingCompetitors(true);
    try {
      const response = await fetch('/api/brand-positioning/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: selectedAnalysis.brandName,
          competitors: validCompetitors,
          positioning: selectedAnalysis.positioning
        })
      });

      const data = await response.json();
      if (data.success) {
        setCompetitorAnalysis(data.data);
        setShowCompetitorModal(false);
        setActiveTab('analysis'); // Switch to analysis tab to show results
      }
    } catch (error) {
      console.error('Error comparing competitors:', error);
    } finally {
      setIsComparingCompetitors(false);
    }
  };

  // Export functions
  const exportReport = async (format: 'json' | 'html' = 'html') => {
    if (!selectedAnalysis) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/brand-positioning/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: selectedAnalysis.id,
          format
        })
      });

      if (format === 'html') {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedAnalysis.brandName}-brand-report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedAnalysis.brandName}-brand-report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setIsExporting(false);
    }
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
                className={`p-4 border rounded-md transition-colors relative ${
                  selectedAnalysis?.id === analysis.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Delete confirmation overlay */}
                {showDeleteConfirm === analysis.id && (
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-md p-4 flex flex-col items-center justify-center z-10">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center">
                      Delete &quot;{analysis.brandName}&quot;?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteBrand(analysis.id)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div onClick={() => selectBrand(analysis)} className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg dark:text-gray-100">{analysis.brandName}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(analysis.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Delete brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompetitorModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Compare Competitors
                </button>
                <button
                  onClick={() => exportReport('html')}
                  disabled={isExporting || !latestScan}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </button>
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

            {/* Tab Navigation - Always visible */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('competitors')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'competitors'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Competitors
              </button>
              {latestScan && (
                <>
                  <button
                    onClick={() => setActiveTab('sources')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'sources'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Sources
                  </button>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'recommendations'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 inline mr-2" />
                    Recommendations
                  </button>
                  <button
                    onClick={() => setActiveTab('trends')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'trends'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Trends
                  </button>
                </>
              )}
            </div>

            {/* Competitors Tab - Always available */}
            {activeTab === 'competitors' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Competitor Analysis
                  </h3>
                  <button
                    onClick={() => setShowCompetitorModal(true)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Competitors
                  </button>
                </div>

                {competitorAnalysis ? (
                  <>
                    {/* Overall Insights */}
                    {competitorAnalysis.overallInsights.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Competitive Insights</h4>
                        <ul className="space-y-2">
                          {competitorAnalysis.overallInsights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                              <span className="text-purple-500">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Competitor Cards */}
                    <div className="space-y-4">
                      {competitorAnalysis.competitors.map((comp, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-700 p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{comp.competitor}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                                {comp.positioning.primary}
                              </span>
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                                {comp.positioning.pricePoint}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Comparison Insights */}
                            {comp.comparisonInsights.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comparison</h5>
                                <ul className="space-y-1">
                                  {comp.comparisonInsights.map((insight, iIdx) => (
                                    <li key={iIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                      <span className="text-gray-400">-</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Differentiation Opportunities */}
                            {comp.differentiationOpportunities.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Differentiation Opportunities</h5>
                                <ul className="space-y-1">
                                  {comp.differentiationOpportunities.map((opp, oIdx) => (
                                    <li key={oIdx} className="text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
                                      <Lightbulb className="w-4 h-4 mt-0.5" />
                                      {opp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* LLM Perceptions */}
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How LLMs Describe {comp.competitor}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(comp.llmPerception).map(([llm, perception]) => (
                                  <div key={llm} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 uppercase text-xs">{llm}</span>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">{perception.slice(0, 150)}...</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="mb-2">No competitor analysis yet</p>
                    <p className="text-sm mb-4">Click &quot;Add Competitors&quot; to compare your brand positioning against competitors</p>
                    <button
                      onClick={() => setShowCompetitorModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Competitors
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab Content */}
            {activeTab === 'analysis' && latestScan ? (
              <>
                {/* Reliability Note */}
                <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      <strong>Reliable Results:</strong> All LLMs are queried with low temperature (0.1) for consistent, reproducible responses.
                      Scores should remain stable across multiple checks.
                    </span>
                  </p>
                </div>

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

                {/* Detailed Comparison */}
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

                              {/* Citations/Sources Section */}
                              {response.citations && response.citations.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Sources ({response.citations.length})
                                  </span>
                                  <div className="mt-2 space-y-1">
                                    {response.citations.map((citation, citIndex) => (
                                      <a
                                        key={citIndex}
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                                        title={citation.url}
                                      >
                                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded mr-2">
                                          {citation.sourceType || 'website'}
                                        </span>
                                        {citation.title || new URL(citation.url).hostname}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Per-response Recommendation */}
                              {response.recommendation && (
                                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" />
                                    Recommendation
                                  </span>
                                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{response.recommendation}</p>
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
            ) : activeTab === 'analysis' ? (
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
            ) : null}

            {/* Sources Tab */}
            {activeTab === 'sources' && lastScanResult?.sourceAnalysis && (
                  <div className="space-y-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Source Analysis
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({lastScanResult.sourceAnalysis.totalSources} sources found)
                      </span>
                    </h3>

                    {/* Source Insights */}
                    {lastScanResult.sourceAnalysis.insights.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Key Insights
                        </h4>
                        <ul className="space-y-2">
                          {lastScanResult.sourceAnalysis.insights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                              <span className="text-amber-500">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Source Distribution Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(lastScanResult.sourceAnalysis.byType).map(([type, data]) => (
                        <div key={type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                            {type.replace('_', ' ')}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {data.count}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {data.percentage}% of sources
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Complete Source List by Type */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">All Sources (Full Transparency)</h4>
                      {Object.entries(lastScanResult.sourceAnalysis.byType).map(([type, data]) => (
                        data.urls && data.urls.length > 0 && (
                          <div key={type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                type === 'wikipedia' ? 'bg-blue-500' :
                                type === 'news' ? 'bg-green-500' :
                                type === 'social_media' ? 'bg-purple-500' :
                                type === 'reddit' ? 'bg-orange-500' :
                                type === 'review' ? 'bg-yellow-500' :
                                type === 'official' ? 'bg-teal-500' :
                                'bg-gray-500'
                              }`} />
                              {type.replace('_', ' ')} ({data.count})
                            </h5>
                            <ul className="space-y-2">
                              {data.urls.map((url: string, urlIdx: number) => (
                                <li key={urlIdx} className="flex items-start gap-2">
                                  <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                  >
                                    {url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources Tab - No Data */}
                {activeTab === 'sources' && !lastScanResult?.sourceAnalysis && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p>Run a new alignment check to see source analysis</p>
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && lastScanResult?.recommendations && lastScanResult.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Content Recommendations
                    </h3>

                    {lastScanResult.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-4 ${
                          rec.priority === 'high'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : rec.priority === 'medium'
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  rec.priority === 'high'
                                    ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                    : rec.priority === 'medium'
                                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                                    : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                }`}
                              >
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{rec.type.replace('_', ' ')}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{rec.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rec.targetPlatforms.map((platform, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations Tab - No Data */}
                {activeTab === 'recommendations' && (!lastScanResult?.recommendations || lastScanResult.recommendations.length === 0) && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Lightbulb className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p>Run a new alignment check to get personalized recommendations</p>
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div className="space-y-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Historical Trends
                    </h3>

                    {selectedAnalysis?.scans && selectedAnalysis.scans.length > 1 ? (
                      <>
                        {/* Trend Chart - Simple bar representation */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Alignment Score Over Time</h4>
                          <div className="flex items-end gap-2 h-40">
                            {selectedAnalysis.scans.slice(0, 10).reverse().map((scan, idx) => (
                              <div key={scan.id} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full rounded-t"
                                  style={{
                                    height: `${scan.alignmentScore}%`,
                                    backgroundColor: getScoreColor(scan.alignmentScore)
                                  }}
                                />
                                <span className="text-xs text-gray-500 mt-1">{new Date(scan.scanDate).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Scan History Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Overall</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">ChatGPT</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Gemini</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Perplexity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Claude</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {selectedAnalysis.scans.map((scan) => (
                                <tr key={scan.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(scan.scanDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span
                                      className="font-medium"
                                      style={{ color: getScoreColor(scan.alignmentScore) }}
                                    >
                                      {scan.alignmentScore}%
                                    </span>
                                  </td>
                                  {scan.llmResults?.map((result) => (
                                    <td key={result.llm} className="px-4 py-2">
                                      <span
                                        className="text-sm"
                                        style={{ color: getScoreColor(result.alignmentScore) }}
                                      >
                                        {result.alignmentScore}%
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <p className="mb-2">Not enough data for trend analysis</p>
                        <p className="text-sm">Run multiple alignment checks over time to see trends</p>
                      </div>
                    )}
                  </div>
                )}
          </div>
        )}

        {/* Competitor Comparison Modal */}
        {showCompetitorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Compare with Competitors
                </h3>
                <button
                  onClick={() => setShowCompetitorModal(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter competitor brand names to see how they&apos;re positioned compared to {selectedAnalysis?.brandName}.
              </p>

              <div className="space-y-3 mb-4">
                {competitors.map((competitor, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={competitor}
                      onChange={(e) => updateCompetitor(index, e.target.value)}
                      placeholder={`Competitor ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    {competitors.length > 1 && (
                      <button
                        onClick={() => removeCompetitorField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {competitors.length < 5 && (
                  <button
                    onClick={addCompetitorField}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add another competitor
                  </button>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCompetitorModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={runCompetitorComparison}
                  disabled={isComparingCompetitors || !competitors.some(c => c.trim())}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isComparingCompetitors ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Compare
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
