'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  Target,
  TrendingUp
} from 'lucide-react';
import { NewScanForm, type NewScanData } from '@/components/Forms';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';
import Link from 'next/link';
import { useTier } from '@/lib/tier';

type ScanFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
type UserTier = 'free' | 'professional' | 'partner';

interface ScheduledScan {
  id: string;
  name: string;
  brandOrKeyword: string;
  domain?: string;
  description?: string;
  enabled: boolean;
  frequency: ScanFrequency;
  hour?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  lastRun?: string;
  nextRun: string;
  lastStatus?: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  executions?: ScanExecution[];
}

interface ScanExecution {
  id: string;
  scheduledScanId: string;
  status: string;
  startTime: string;
  endTime?: string;
  error?: string;
  analysisId?: string;
}

interface TierLimits {
  maxScheduledScans: number;
  allowedFrequencies: string[];
  currentCount: number;
  canCreateMore: boolean;
}

export default function AutomationPage() {
  const [scans, setScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);

  // Use tier from context (connected to tier switcher)
  const { tier, isProfessionalOrHigher, isPartner } = useTier();
  const userTier = tier as UserTier;

  // Fetch scans from API
  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/automation/scans?userId=demo-user');
      const data = await response.json();
      if (data.success) {
        setScans(data.scans);
        // Note: tier is now from context, not from API
        if (data.limits) {
          setTierLimits(data.limits);
        }
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse analysis metadata from description
  const getAnalysisInfo = (scan: ScheduledScan) => {
    try {
      if (scan.description) {
        const info = JSON.parse(scan.description);
        return {
          type: info.analysisType || 'brand_positioning',
          brandGroundTruthId: info.brandGroundTruthId
        };
      }
    } catch {
      // Not JSON, return default
    }
    return { type: 'brand_positioning', brandGroundTruthId: null };
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      brand_positioning: 'Brand Positioning',
      ai_visibility: 'AI Visibility',
      seo_analysis: 'SEO Analysis'
    };
    return labels[type] || type;
  };

  const getAnalysisTypeIcon = (type: string) => {
    if (type === 'brand_positioning') return Target;
    if (type === 'ai_visibility') return TrendingUp;
    return Target;
  };

  const toggleScan = async (id: string) => {
    const scan = scans.find(s => s.id === id);
    if (!scan) return;

    try {
      const response = await fetch(`/api/automation/scans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !scan.enabled })
      });

      if (response.ok) {
        setScans(scans.map(s =>
          s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
      }
    } catch (error) {
      console.error('Error toggling scan:', error);
    }
  };

  const formatNextRun = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  };

  const getFrequencyDisplay = (frequency: ScanFrequency) => {
    const map = {
      hourly: 'Every hour',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      custom: 'Custom schedule'
    };
    return map[frequency];
  };

  const getScanExecutions = (scan: ScheduledScan) => {
    return scan.executions?.slice(0, 5) || [];
  };

  const handleCreateScan = async (scanData: NewScanData) => {
    try {
      const response = await fetch('/api/automation/scans?userId=demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanData)
      });

      if (response.ok) {
        await fetchScans(); // Refresh the scan list
        setShowNewScanModal(false);
      } else {
        throw new Error('Failed to create scan');
      }
    } catch (error) {
      console.error('Error creating scan:', error);
      throw error;
    }
  };

  // Get tier badge styling
  const getTierBadge = (tier: UserTier) => {
    const styles: Record<UserTier, string> = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      partner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return styles[tier];
  };

  const getTierName = (tier: UserTier) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading automation scans...</p>
        </div>
      </div>
    );
  }

  // Free tier - show upgrade prompt
  if (!isProfessionalOrHigher()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Automation is a Premium Feature
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
              Upgrade to Professional or Partner tier to schedule automated brand positioning checks
              and receive regular updates on how AI models represent your brand.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Professional Tier */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Professional
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Perfect for Growing Brands
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Up to 5 scheduled scans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Weekly and monthly frequencies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Priority support
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upgrade to Professional
              </button>
            </div>

            {/* Partner Tier */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Partner
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                For Agencies & Enterprises
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Unlimited scheduled scans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Daily, weekly, and monthly frequencies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Dedicated support
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Upgrade to Partner
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/hallucination-detector"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Run a free analysis first
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                Automation Dashboard
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierBadge(userTier)}`}>
                {getTierName(userTier)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Schedule and manage automated brand positioning checks
            </p>
            {tierLimits && tierLimits.maxScheduledScans !== -1 && (
              <p className="text-sm text-gray-500 mt-1">
                {tierLimits.currentCount} / {tierLimits.maxScheduledScans} scheduled scans used
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/hallucination-detector"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Target className="w-5 h-5 mr-2" />
              Brand Positioning Tool
            </Link>
            {tierLimits?.canCreateMore && (
              <button
                onClick={() => setShowNewScanModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Scheduled Scan
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview - Evidence-Based Design */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Active Scans - Primary Metric */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Scans</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {scans.filter(s => s.enabled).length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {scans.length}</span>
              </div>
            </div>
          </div>

          {/* Total Runs - Gray (Secondary Data) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Runs</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {scans.reduce((sum, s) => sum + s.totalRuns, 0)}
              </span>
            </div>
          </div>

          {/* Success Rate - Semantic Color (Green if good) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Success Rate</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: (() => {
                      const rate = Math.round(
                        (scans.reduce((sum, s) => sum + s.successfulRuns, 0) /
                          Math.max(scans.reduce((sum, s) => sum + s.totalRuns, 0), 1)) * 100
                      );
                      return rate >= 90 ? SEMANTIC_COLORS.positive :
                             rate >= 70 ? SEMANTIC_COLORS.warning :
                             SEMANTIC_COLORS.critical;
                    })()
                  }}
                >
                  {Math.round(
                    (scans.reduce((sum, s) => sum + s.successfulRuns, 0) /
                      Math.max(scans.reduce((sum, s) => sum + s.totalRuns, 0), 1)) * 100
                  ) || 0}%
                </span>
                {(() => {
                  const rate = Math.round(
                    (scans.reduce((sum, s) => sum + s.successfulRuns, 0) /
                      Math.max(scans.reduce((sum, s) => sum + s.totalRuns, 0), 1)) * 100
                  );
                  return rate >= 90 ? <CheckCircle2 className="w-5 h-5" style={{color: SEMANTIC_COLORS.positive}} /> :
                         rate >= 70 ? <AlertTriangle className="w-5 h-5" style={{color: SEMANTIC_COLORS.warning}} /> :
                         <XCircle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />;
                })()}
              </div>
            </div>
          </div>

          {/* Failed Runs - Only red if > 0 (Actionable Data) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed Runs</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: scans.reduce((sum, s) => sum + s.failedRuns, 0) > 0
                      ? SEMANTIC_COLORS.critical
                      : SEMANTIC_COLORS.muted
                  }}
                >
                  {scans.reduce((sum, s) => sum + s.failedRuns, 0)}
                </span>
                {scans.reduce((sum, s) => sum + s.failedRuns, 0) > 0 && (
                  <AlertTriangle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Scans List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scheduled Scans
            </h2>
          </div>

          {scans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No scheduled scans yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Schedule your first automated brand positioning check to receive regular updates on how AI models represent your brand.
              </p>
              <Link
                href="/hallucination-detector"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Target className="w-5 h-5 mr-2" />
                Go to Brand Positioning Tool
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Run an analysis first, then click "Schedule" to automate it
              </p>
            </div>
          ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {scans.map(scan => {
              const analysisInfo = getAnalysisInfo(scan);
              const AnalysisIcon = getAnalysisTypeIcon(analysisInfo.type);

              return (
              <div key={scan.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleScan(scan.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        scan.enabled
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                    >
                      {scan.enabled ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{scan.name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <AnalysisIcon className="w-3 h-3" />
                          {getAnalysisTypeLabel(analysisInfo.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Brand: <span className="font-medium">{scan.brandOrKeyword}</span>
                        {scan.domain && (
                          <span className="ml-2 text-gray-500">({scan.domain})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {getFrequencyDisplay(scan.frequency)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4" />
                        Next run: {formatNextRun(scan.nextRun)}
                      </div>
                    </div>

                    {scan.lastStatus && (
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scan.lastStatus === 'success'
                            ? 'bg-green-100 text-green-700'
                            : scan.lastStatus === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {scan.lastStatus}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setExpandedScan(expandedScan === scan.id ? null : scan.id)
                      }
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {expandedScan === scan.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Execution History */}
                {expandedScan === scan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Executions</h4>
                    <div className="space-y-2">
                      {getScanExecutions(scan).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No executions yet</p>
                      ) : (
                        getScanExecutions(scan).map(exec => (
                          <div
                            key={exec.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              {exec.status === 'completed' && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {exec.status === 'failed' && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {exec.status === 'running' && (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {new Date(exec.startTime).toLocaleString()}
                                </p>
                                {exec.error && (
                                  <p className="text-xs text-red-600">{exec.error}</p>
                                )}
                              </div>
                            </div>
                            {exec.analysisId && (
                              <a
                                href={`/results/${exec.analysisId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300"
                              >
                                View Results →
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Runs</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{scan.totalRuns}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Successful</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">{scan.successfulRuns}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">{scan.failedRuns}</p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                About Automated Scans
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Scheduled scans run automatically at the configured time</li>
                <li>• Each scan creates a full analysis report accessible in your dashboard</li>
                <li>• Failed scans are automatically retried with exponential backoff</li>
                <li>• You'll receive email notifications for completed scans (configure in Alerts)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* New Scan Modal */}
      <NewScanForm
        isOpen={showNewScanModal}
        onClose={() => setShowNewScanModal(false)}
        onSubmit={handleCreateScan}
      />
    </div>
  );
}
