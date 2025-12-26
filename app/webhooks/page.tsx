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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Webhooks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.filter(w => w.enabled).length}
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
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.reduce((sum, w) => sum + w.deliveryCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    ((webhooks.reduce((sum, w) => sum + w.deliveryCount, 0) -
                      webhooks.reduce((sum, w) => sum + w.failureCount, 0)) /
                      webhooks.reduce((sum, w) => sum + w.deliveryCount, 0)) *
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
                <p className="text-sm text-gray-600">Failed Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.reduce((sum, w) => sum + w.failureCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Configured Webhooks
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
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
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>

                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <Edit className="w-5 h-5 text-gray-600" />
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
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => copySecret(webhook.secret, webhook.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copiedSecret === webhook.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
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
                    <p className="text-xs text-gray-600">Deliveries</p>
                    <p className="text-lg font-bold text-gray-900">{webhook.deliveryCount}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Success</p>
                    <p className="text-lg font-bold text-green-700">
                      {webhook.deliveryCount - webhook.failureCount}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600">Failed</p>
                    <p className="text-lg font-bold text-red-700">{webhook.failureCount}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">Last Triggered</p>
                    <p className="text-sm font-bold text-blue-700">
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleTimeString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Delivery History */}
                {selectedWebhook === webhook.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
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
                              <p className="text-sm font-medium text-gray-900">{delivery.event}</p>
                              <p className="text-xs text-gray-600">
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
                            <span className="text-xs text-gray-500">{delivery.attempts} attempt(s)</span>
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
    </div>
  );
}
