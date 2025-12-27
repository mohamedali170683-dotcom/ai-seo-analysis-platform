'use client';

import { useState, useEffect } from 'react';
import {
  Webhook,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send
} from 'lucide-react';
import { NewWebhookForm, type NewWebhookData } from '@/components/Forms';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  enabled: boolean;
  events: string[];
  createdAt?: string;
  lastTriggered?: string;
  deliveryCount: number;
  failureCount: number;
  deliveries?: WebhookDelivery[];
}

interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  event: string;
  status: string;
  attempts: number;
  timestamp: string;
  responseCode?: number;
  errorMessage?: string;
}

const availableEvents = [
  { value: 'analysis.started', label: 'Analysis Started', description: 'When a new analysis begins' },
  { value: 'analysis.completed', label: 'Analysis Completed', description: 'When an analysis finishes successfully' },
  { value: 'analysis.failed', label: 'Analysis Failed', description: 'When an analysis encounters an error' },
  { value: 'alert.triggered', label: 'Alert Triggered', description: 'When an alert condition is met' },
  { value: 'hallucination.detected', label: 'Hallucination Detected', description: 'When a hallucination is found' },
  { value: 'scan.scheduled', label: 'Scan Scheduled', description: 'When a scheduled scan is queued' },
  { value: '*', label: 'All Events', description: 'Subscribe to all webhook events' }
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  // Fetch webhooks from API
  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks?userId=demo-user');
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhook = async (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !webhook.enabled })
      });

      if (response.ok) {
        setWebhooks(webhooks.map(w =>
          w.id === id ? { ...w, enabled: !w.enabled } : w
        ));
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const getWebhookDeliveries = (webhook: WebhookConfig) => {
    return webhook.deliveries?.slice(0, 10) || [];
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '••••••••';
    return secret.slice(0, 12) + '•'.repeat(secret.length - 12);
  };

  const handleCreateWebhook = async (webhookData: NewWebhookData) => {
    try {
      const response = await fetch('/api/webhooks?userId=demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        await fetchWebhooks(); // Refresh the webhook list
        setShowNewWebhookModal(false);
      } else {
        throw new Error('Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading webhooks...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Webhook className="w-8 h-8 text-blue-600" />
              Webhooks
            </h1>
            <p className="text-gray-600 mt-2">
              Configure real-time webhooks with HMAC signature verification
            </p>
          </div>
          <button
            onClick={() => setShowNewWebhookModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Webhook
          </button>
        </div>

        {/* Stats Overview - Evidence-Based Design */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Active Webhooks - Primary Metric */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Webhooks</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {webhooks.filter(w => w.enabled).length}
                </span>
                {webhooks.filter(w => w.enabled).length > 0 && (
                  <CheckCircle2 className="w-5 h-5" style={{color: SEMANTIC_COLORS.positive}} />
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">of {webhooks.length} total</span>
            </div>
          </div>

          {/* Total Deliveries - Gray (Informational) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Deliveries</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {webhooks.reduce((sum, w) => sum + w.deliveryCount, 0)}
              </span>
            </div>
          </div>

          {/* Success Rate - Semantic Color Based on Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Success Rate</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: (() => {
                      const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryCount, 0);
                      const rate = totalDeliveries > 0 ? Math.round(
                        ((totalDeliveries - webhooks.reduce((sum, w) => sum + w.failureCount, 0)) / totalDeliveries) * 100
                      ) : 100;
                      return rate >= 95 ? SEMANTIC_COLORS.positive :
                             rate >= 80 ? SEMANTIC_COLORS.warning :
                             SEMANTIC_COLORS.critical;
                    })()
                  }}
                >
                  {(() => {
                    const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryCount, 0);
                    return totalDeliveries > 0 ? Math.round(
                      ((totalDeliveries - webhooks.reduce((sum, w) => sum + w.failureCount, 0)) / totalDeliveries) * 100
                    ) : 100;
                  })()}%
                </span>
                {(() => {
                  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryCount, 0);
                  const rate = totalDeliveries > 0 ? Math.round(
                    ((totalDeliveries - webhooks.reduce((sum, w) => sum + w.failureCount, 0)) / totalDeliveries) * 100
                  ) : 100;
                  return rate >= 95 ? <CheckCircle2 className="w-5 h-5" style={{color: SEMANTIC_COLORS.positive}} /> :
                         rate >= 80 ? <AlertTriangle className="w-5 h-5" style={{color: SEMANTIC_COLORS.warning}} /> :
                         <XCircle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />;
                })()}
              </div>
            </div>
          </div>

          {/* Failed Deliveries - Only red if > 0 (Actionable) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed Deliveries</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: webhooks.reduce((sum, w) => sum + w.failureCount, 0) > 0
                      ? SEMANTIC_COLORS.critical
                      : SEMANTIC_COLORS.muted
                  }}
                >
                  {webhooks.reduce((sum, w) => sum + w.failureCount, 0)}
                </span>
                {webhooks.reduce((sum, w) => sum + w.failureCount, 0) > 0 && (
                  <XCircle className="w-5 h-5" style={{color: SEMANTIC_COLORS.critical}} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configured Webhooks
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{webhook.name}</h3>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          webhook.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {webhook.enabled ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{webhook.url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhook.enabled}
                        onChange={() => toggleWebhook(webhook.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    <button
                      onClick={() =>
                        setSelectedWebhook(selectedWebhook === webhook.id ? null : webhook.id)
                      }
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Secret */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Signing Secret:</span>
                    <code className="flex-1 text-xs bg-gray-100 px-3 py-1 rounded font-mono">
                      {showSecrets[webhook.id] ? webhook.secret : maskSecret(webhook.secret)}
                    </code>
                    <button
                      onClick={() => toggleSecretVisibility(webhook.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {showSecrets[webhook.id] ? (
                        <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copySecret(webhook.secret, webhook.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copiedSecret === webhook.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Events */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600 font-medium">Events:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {webhook.events.map(event => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Deliveries</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{webhook.deliveryCount}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Success</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {webhook.deliveryCount - webhook.failureCount}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">{webhook.failureCount}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Last Triggered</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleTimeString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Delivery History */}
                {selectedWebhook === webhook.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Deliveries</h4>
                    <div className="space-y-2">
                      {getWebhookDeliveries(webhook).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No deliveries yet</p>
                      ) : (
                        getWebhookDeliveries(webhook).map(delivery => (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            {delivery.status === 'success' && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                            {delivery.status === 'failed' && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            {delivery.status === 'pending' && (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{delivery.event}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(delivery.timestamp).toLocaleString()}
                                {delivery.errorMessage && (
                                  <span className="text-red-600 ml-2">• {delivery.errorMessage}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {delivery.responseCode && (
                              <span
                                className={`px-2 py-1 rounded text-xs font-mono ${
                                  delivery.responseCode >= 200 && delivery.responseCode < 300
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {delivery.responseCode}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">{delivery.attempts} attempt(s)</span>
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Webhook Security
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All webhook payloads are signed with HMAC-SHA256</li>
                  <li>• Verify signatures using the signing secret</li>
                  <li>• Failed deliveries retry with exponential backoff (up to 3 attempts)</li>
                  <li>• Keep your signing secret secure - rotate it if compromised</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-6 h-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">
                  Retry Logic
                </h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Failed deliveries automatically retry after 1 minute</li>
                  <li>• Second retry after 10 minutes</li>
                  <li>• Final retry after 1 hour</li>
                  <li>• Webhooks are disabled after 10 consecutive failures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Webhook Modal */}
      <NewWebhookForm
        isOpen={showNewWebhookModal}
        onClose={() => setShowNewWebhookModal(false)}
        onSubmit={handleCreateWebhook}
      />
    </div>
  );
}
