'use client';

import { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';

type ScanFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface ScheduledScan {
  id: string;
  name: string;
  brandOrKeyword: string;
  enabled: boolean;
  schedule: {
    frequency: ScanFrequency;
    hour?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    cronExpression?: string;
  };
  lastRun?: Date;
  nextRun: Date;
  lastStatus?: 'success' | 'failed' | 'running';
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}

interface ScanExecution {
  id: string;
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  analysisId?: string;
}

// Mock data
const mockScans: ScheduledScan[] = [
  {
    id: '1',
    name: 'Nike Weekly Brand Check',
    brandOrKeyword: 'Nike',
    enabled: true,
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 1,
      hour: 9
    },
    lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    lastStatus: 'success',
    totalRuns: 24,
    successfulRuns: 23,
    failedRuns: 1
  },
  {
    id: '2',
    name: 'Daily Competitor Watch',
    brandOrKeyword: 'Adidas',
    enabled: true,
    schedule: {
      frequency: 'daily',
      hour: 6
    },
    lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000),
    lastStatus: 'success',
    totalRuns: 90,
    successfulRuns: 88,
    failedRuns: 2
  },
  {
    id: '3',
    name: 'Monthly Market Analysis',
    brandOrKeyword: 'Running Shoes',
    enabled: false,
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      hour: 0
    },
    lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    lastStatus: 'failed',
    totalRuns: 3,
    successfulRuns: 2,
    failedRuns: 1
  }
];

const mockExecutions: ScanExecution[] = [
  {
    id: 'e1',
    scanId: '1',
    status: 'completed',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    analysisId: 'a123'
  },
  {
    id: 'e2',
    scanId: '2',
    status: 'completed',
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 12 * 60 * 60 * 1000 + 4 * 60 * 1000),
    analysisId: 'a124'
  },
  {
    id: 'e3',
    scanId: '3',
    status: 'failed',
    startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000),
    error: 'API rate limit exceeded'
  }
];

export default function AutomationPage() {
  const [scans, setScans] = useState<ScheduledScan[]>(mockScans);
  const [executions, setExecutions] = useState<ScanExecution[]>(mockExecutions);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);

  const toggleScan = (id: string) => {
    setScans(scans.map(scan =>
      scan.id === id ? { ...scan, enabled: !scan.enabled } : scan
    ));
  };

  const formatNextRun = (date: Date) => {
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

  const getScanExecutions = (scanId: string) => {
    return executions.filter(e => e.scanId === scanId).slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              Automation Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Schedule and manage automated brand visibility scans
            </p>
          </div>
          <button
            onClick={() => setShowNewScanModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Scheduled Scan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Scans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scans.filter(s => s.enabled).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scans.reduce((sum, s) => sum + s.totalRuns, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    (scans.reduce((sum, s) => sum + s.successfulRuns, 0) /
                      scans.reduce((sum, s) => sum + s.totalRuns, 0)) *
                      100
                  )}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Runs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scans.reduce((sum, s) => sum + s.failedRuns, 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Scans List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Scheduled Scans
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {scans.map(scan => (
              <div key={scan.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleScan(scan.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        scan.enabled
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {scan.enabled ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900">{scan.name}</h3>
                      <p className="text-sm text-gray-600">
                        Brand: <span className="font-medium">{scan.brandOrKeyword}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {getFrequencyDisplay(scan.schedule.frequency)}
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
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>

                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Execution History */}
                {expandedScan === scan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Executions</h4>
                    <div className="space-y-2">
                      {getScanExecutions(scan.id).map(exec => (
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
                              <p className="text-sm font-medium text-gray-900">
                                {exec.startTime.toLocaleString()}
                              </p>
                              {exec.error && (
                                <p className="text-xs text-red-600">{exec.error}</p>
                              )}
                            </div>
                          </div>
                          {exec.analysisId && (
                            <a
                              href={`/results/${exec.analysisId}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              View Results →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Total Runs</p>
                    <p className="text-lg font-bold text-gray-900">{scan.totalRuns}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Successful</p>
                    <p className="text-lg font-bold text-green-700">{scan.successfulRuns}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600">Failed</p>
                    <p className="text-lg font-bold text-red-700">{scan.failedRuns}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}
