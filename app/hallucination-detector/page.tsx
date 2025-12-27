'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';

interface GroundTruth {
  id: string;
  companyName: string;
  foundedYear?: number;
  headquarters?: string;
  ceo?: string;
  employeeCount?: number;
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

export default function HallucinationDetectorPage() {
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [selectedGroundTruth, setSelectedGroundTruth] = useState<GroundTruth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    foundedYear: '',
    headquarters: '',
    ceo: '',
    employeeCount: '',
    industry: '',
    websiteUrl: ''
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

  const handleCreateGroundTruth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ground-truth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
          headquarters: formData.headquarters || undefined,
          ceo: formData.ceo || undefined,
          employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
          industry: formData.industry || undefined,
          websiteUrl: formData.websiteUrl || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchGroundTruths();
        setShowCreateForm(false);
        setFormData({
          companyName: '',
          foundedYear: '',
          headquarters: '',
          ceo: '',
          employeeCount: '',
          industry: '',
          websiteUrl: ''
        });
      }
    } catch (error) {
      console.error('Error creating ground truth:', error);
    }
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
        const updatedGT = groundTruths.find(gt => gt.id === groundTruthId);
        if (updatedGT) {
          const detailResponse = await fetch(`/api/ground-truth/${groundTruthId}`);
          const detailData = await detailResponse.json();
          if (detailData.success) {
            setSelectedGroundTruth(detailData.data);
          }
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
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const latestDetection = selectedGroundTruth?.hallucinationDetections?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Misinformation & Hallucination Detector
          </h1>
          <p className="mt-2 text-gray-600">
            Detect factual errors, outdated information, and competitor confusion in LLM responses
          </p>
        </div>

        {/* Brand Selection & Create */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Brands</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Brand
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateGroundTruth} className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headquarters
                  </label>
                  <input
                    type="text"
                    value={formData.headquarters}
                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEO
                  </label>
                  <input
                    type="text"
                    value={formData.ceo}
                    onChange={(e) => setFormData({ ...formData, ceo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Count
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Brand
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Brand List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groundTruths.map((gt) => (
              <div
                key={gt.id}
                onClick={() => setSelectedGroundTruth(gt)}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedGroundTruth?.id === gt.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-lg">{gt.companyName}</h3>
                {gt.foundedYear && (
                  <p className="text-sm text-gray-600">Founded: {gt.foundedYear}</p>
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
            <div className="text-center py-8 text-gray-500">
              No brands added yet. Click &quot;Add Brand&quot; to get started.
            </div>
          )}
        </div>

        {/* Selected Brand Details */}
        {selectedGroundTruth && (
          <>
            {/* Accuracy Dashboard */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Brand Accuracy Report</h2>
                <button
                  onClick={() => runScan(selectedGroundTruth.id)}
                  disabled={isScanning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isScanning ? 'Scanning...' : '🔍 Run New Scan'}
                </button>
              </div>

              {latestDetection ? (
                <>
                  {/* Overall Score */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Accuracy</span>
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
                        <span className="text-xs font-medium text-gray-500">{latestDetection.riskLevel} Risk</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hallucinations Found</span>
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
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommendations</span>
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
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">LLMs Tested</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">2</span>
                        <span className="text-xs text-gray-500">ChatGPT, Gemini</span>
                      </div>
                    </div>
                  </div>

                  {/* Hallucinations List */}
                  {latestDetection.hallucinations && latestDetection.hallucinations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Detected Hallucinations</h3>
                      <div className="space-y-3">
                        {latestDetection.hallucinations.map((h) => (
                          <div key={h.id} className="p-4 border border-gray-200 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: (() => {
                                      switch (h.severity) {
                                        case 'CRITICAL': return '#fee2e2'; // red-100
                                        case 'HIGH': return '#fed7aa'; // orange-200
                                        case 'MEDIUM': return '#fef3c7'; // yellow-100
                                        case 'LOW': return '#dbeafe'; // blue-100
                                        default: return '#f3f4f6'; // gray-100
                                      }
                                    })(),
                                    color: (() => {
                                      switch (h.severity) {
                                        case 'CRITICAL': return SEMANTIC_COLORS.critical;
                                        case 'HIGH': return '#ea580c'; // orange-600
                                        case 'MEDIUM': return SEMANTIC_COLORS.warning;
                                        case 'LOW': return '#2563eb'; // blue-600
                                        default: return '#4b5563'; // gray-600
                                      }
                                    })()
                                  }}
                                >
                                  {h.severity}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {h.llm.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {h.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm mb-2">
                              <strong>Query:</strong> {h.query}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-red-600 font-medium">Claimed:</span>
                                <div className="mt-1 p-2 bg-red-50 rounded">
                                  {h.claimedFact}
                                </div>
                              </div>
                              <div>
                                <span className="text-green-600 font-medium">Actual:</span>
                                <div className="mt-1 p-2 bg-green-50 rounded">
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
                      <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                      <div className="space-y-3">
                        {latestDetection.recommendations.map((r) => (
                          <div key={r.id} className="p-4 border border-gray-200 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{r.title}</h4>
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: (() => {
                                    switch (r.priority) {
                                      case 'critical': return '#fee2e2'; // red-100
                                      case 'high': return '#fed7aa'; // orange-200
                                      case 'medium': return '#fef3c7'; // yellow-100
                                      default: return '#dbeafe'; // blue-100
                                    }
                                  })(),
                                  color: (() => {
                                    switch (r.priority) {
                                      case 'critical': return SEMANTIC_COLORS.critical;
                                      case 'high': return '#ea580c'; // orange-600
                                      case 'medium': return SEMANTIC_COLORS.warning;
                                      default: return '#2563eb'; // blue-600
                                    }
                                  })()
                                }}
                              >
                                {r.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                            <div className="text-xs text-gray-500">
                              Affected LLMs: {r.affectedLLMs.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No scans run yet. Click &quot;Run New Scan&quot; to start detecting hallucinations.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
