'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Shield,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  Webhook as WebhookIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type AlertType =
  | 'visibility_drop'
  | 'visibility_spike'
  | 'competitor_takeover'
  | 'hallucination_detected'
  | 'citation_lost'
  | 'citation_gained'
  | 'anomaly_detected'
  | 'content_gap_found'
  | 'trigger_loss';

type ChannelType = 'email' | 'slack' | 'webhook' | 'discord' | 'teams';

interface AlertConfig {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  conditions: any;
  channels: any;
  throttleEnabled?: boolean;
  throttleWindow?: number;
  maxAlertsPerWindow?: number;
  lastTriggered?: string;
  triggerCount: number;
  events?: any[];
}

const alertTypeInfo = {
  visibility_drop: {
    icon: TrendingDown,
    color: 'red',
    description: 'Triggered when overall visibility score drops below threshold'
  },
  visibility_spike: {
    icon: TrendingUp,
    color: 'green',
    description: 'Triggered when visibility score increases significantly'
  },
  competitor_takeover: {
    icon: Users,
    color: 'yellow',
    description: 'Triggered when competitors are mentioned more than your brand'
  },
  hallucination_detected: {
    icon: Shield,
    color: 'purple',
    description: 'Triggered when AI platforms generate false information about your brand'
  },
  citation_lost: {
    icon: Link2,
    color: 'red',
    description: 'Triggered when your content is no longer cited as a source'
  },
  citation_gained: {
    icon: Link2,
    color: 'green',
    description: 'Triggered when AI platforms start citing your content'
  },
  anomaly_detected: {
    icon: AlertTriangle,
    color: 'orange',
    description: 'Triggered when unusual patterns are detected in AI responses'
  },
  content_gap_found: {
    icon: AlertTriangle,
    color: 'blue',
    description: 'Triggered when content gaps are identified'
  },
  trigger_loss: {
    icon: TrendingDown,
    color: 'red',
    description: 'Triggered when trigger phrases stop producing results'
  }
};

const channelIcons = {
  email: Mail,
  slack: MessageSquare,
  webhook: WebhookIcon,
  discord: MessageSquare,
  teams: MessageSquare
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [showNewAlertModal, setShowNewAlertModal] = useState(false);

  // Fetch alerts from API
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts?userId=demo-user');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !alert.enabled })
      });

      if (response.ok) {
        setAlerts(alerts.map(a =>
          a.id === id ? { ...a, enabled: !a.enabled } : a
        ));
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const getAlertInfo = (type: AlertType) => {
    return alertTypeInfo[type];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
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
              <Bell className="w-8 h-8 text-blue-600" />
              Alert Management
            </h1>
            <p className="text-gray-600 mt-2">
              Configure intelligent alerts with multi-channel notifications
            </p>
          </div>
          <button
            onClick={() => setShowNewAlertModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Alert
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.enabled).length}
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
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Triggered (30d)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.reduce((sum, a) => sum + a.triggerCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Channels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(alerts.flatMap(a => a.channels.map((c: any) => c.type))).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Types Overview */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Alert Types
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(alertTypeInfo).map(([type, info]) => {
              const Icon = info.icon;
              const alertsOfType = alerts.filter(a => a.type === type);
              return (
                <div
                  key={type}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className={`p-2 bg-${info.color}-100 rounded-lg`}>
                    <Icon className={`w-5 h-5 text-${info.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">{info.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alertsOfType.length} configured
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configured Alerts</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.map(alert => {
              const info = getAlertInfo(alert.type);
              const Icon = info.icon;

              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-${info.color}-100 rounded-lg`}>
                        <Icon className={`w-6 h-6 text-${info.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Triggered</p>
                        <p className="font-semibold text-gray-900">
                          {alert.triggerCount}x
                        </p>
                        {alert.lastTriggered && (
                          <p className="text-xs text-gray-500">
                            Last: {new Date(alert.lastTriggered).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alert.enabled}
                          onChange={() => toggleAlert(alert.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>

                      <button
                        onClick={() =>
                          setExpandedAlert(expandedAlert === alert.id ? null : alert.id)
                        }
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {expandedAlert === alert.id ? (
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

                  {/* Expanded Details */}
                  {expandedAlert === alert.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Conditions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                          Conditions
                        </h4>
                        <div className="space-y-2">
                          {alert.conditions.map((condition, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg p-3"
                            >
                              <span className="font-mono font-medium">
                                {condition.metric}
                              </span>
                              <span className="text-gray-600">{condition.operator}</span>
                              <span className="font-bold text-blue-600">
                                {condition.threshold}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Channels */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                          Notification Channels
                        </h4>
                        <div className="flex gap-2">
                          {alert.channels.map(channel => {
                            const ChannelIcon = channelIcons[channel.type];
                            return (
                              <div
                                key={channel.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  channel.enabled
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <ChannelIcon className="w-4 h-4" />
                                {channel.type}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Throttle */}
                      {alert.throttleEnabled && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Throttling:</strong> Max {alert.maxAlertsPerWindow}{' '}
                            alerts per {alert.throttleWindow} minutes
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                About Alert System
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Alerts are evaluated after each analysis scan completes</li>
                <li>• Intelligent throttling prevents alert fatigue from duplicate notifications</li>
                <li>• Multi-channel delivery ensures you're notified on your preferred platform</li>
                <li>• Weekly digest reports summarize all triggered alerts (configure in Settings)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
