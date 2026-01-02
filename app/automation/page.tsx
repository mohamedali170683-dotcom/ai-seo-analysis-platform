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

  const handleDeleteScan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled scan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/automation/scans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setScans(scans.filter(s => s.id !== id));
      } else {
        throw new Error('Failed to delete scan');
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
      alert('Failed to delete scan. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Modern Card Style */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Automation Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Schedule automated AI visibility checks
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getTierBadge(userTier)}`}>
                {getTierName(userTier)} Tier
              </span>
              {tierLimits && tierLimits.maxScheduledScans !== -1 && (
                <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
                  {tierLimits.currentCount}/{tierLimits.maxScheduledScans} scans
                </span>
              )}
              {tierLimits?.canCreateMore && (
                <button
                  onClick={() => setShowNewScanModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Scan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview - Compact Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Active</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {scans.filter(s => s.enabled).length}
              </span>
              <span className="text-sm text-gray-400">/{scans.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Runs</div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {scans.reduce((sum, s) => sum + s.totalRuns, 0)}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Success Rate</div>
            <div className="flex items-center gap-2">
              {(() => {
                const rate = Math.round(
                  (scans.reduce((sum, s) => sum + s.successfulRuns, 0) /
                    Math.max(scans.reduce((sum, s) => sum + s.totalRuns, 0), 1)) * 100
                );
                const color = rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600';
                return (
                  <>
                    <span className={`text-2xl font-bold ${color}`}>{rate || 0}%</span>
                    {rate >= 90 && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Failed</div>
            {(() => {
              const failed = scans.reduce((sum, s) => sum + s.failedRuns, 0);
              return (
                <span className={`text-2xl font-bold ${failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {failed}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Scheduled Scans List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scheduled Scans
            </h2>
            {scans.length > 0 && (
              <span className="text-sm text-gray-500">{scans.length} scan{scans.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {scans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No scheduled scans yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Automate your AI visibility monitoring with scheduled scans
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Run AI Visibility Analysis
                </Link>
                <Link
                  href="/hallucination-detector"
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Brand Positioning
                </Link>
              </div>
              <p className="text-xs text-gray-400 mt-5">
                Run an analysis first, then schedule it for automated monitoring
              </p>
            </div>
          ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {scans.map(scan => {
              const analysisInfo = getAnalysisInfo(scan);
              const AnalysisIcon = getAnalysisTypeIcon(analysisInfo.type);

              return (
              <div key={scan.id} className="group">
                <div className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                    {/* Left: Toggle + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => toggleScan(scan.id)}
                        className={`p-2.5 rounded-xl transition-all shrink-0 ${
                          scan.enabled
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500'
                        }`}
                        title={scan.enabled ? 'Pause scan' : 'Enable scan'}
                      >
                        {scan.enabled ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Pause className="w-5 h-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{scan.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            analysisInfo.type === 'ai_visibility'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            <AnalysisIcon className="w-3 h-3" />
                            {getAnalysisTypeLabel(analysisInfo.type)}
                          </span>
                          {scan.lastStatus && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                scan.lastStatus === 'success'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : scan.lastStatus === 'failed'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {scan.lastStatus === 'success' ? '✓ Last run OK' : scan.lastStatus === 'failed' ? '✗ Failed' : scan.lastStatus}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{scan.brandOrKeyword}</span>
                          {scan.domain && (
                            <span className="text-gray-400">({scan.domain})</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {getFrequencyDisplay(scan.frequency)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Next: {formatNextRun(scan.nextRun)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                        title="View history"
                      >
                        {expandedScan === scan.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete scan"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                {/* Execution History - Only shows when expanded */}
                {expandedScan === scan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Mini Stats Row */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Runs:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{scan.totalRuns}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Success:</span>
                        <span className="font-medium text-green-600">{scan.successfulRuns}</span>
                      </div>
                      {scan.failedRuns > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Failed:</span>
                          <span className="font-medium text-red-600">{scan.failedRuns}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Executions</h4>
                    <div className="space-y-2">
                      {getScanExecutions(scan).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          No executions yet — will run at next scheduled time
                        </p>
                      ) : (
                        getScanExecutions(scan).map(exec => (
                          <div
                            key={exec.id}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              {exec.status === 'completed' && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {exec.status === 'failed' && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {exec.status === 'running' && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              )}
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {new Date(exec.startTime).toLocaleString()}
                                </p>
                                {exec.error && (
                                  <p className="text-xs text-red-500 mt-0.5">{exec.error}</p>
                                )}
                              </div>
                            </div>
                            {exec.analysisId && (
                              <Link
                                href={`/results/${exec.analysisId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                              >
                                View →
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Quick Tips */}
        {scans.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">Tip:</strong> Scans run automatically at scheduled times.
              View results in your <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link> or
              configure notifications in <Link href="/alerts" className="text-blue-600 hover:underline">Alerts</Link>.
            </p>
          </div>
        )}
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
