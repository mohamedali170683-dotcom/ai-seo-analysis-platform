'use client';

import { useState, useEffect } from 'react';
import {
  Blocks,
  Check,
  ExternalLink,
  Settings,
  AlertCircle,
  Zap,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  Database,
  Code,
  Cloud,
  Link2,
  Play,
  Pause
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  setupComplexity: 'easy' | 'medium' | 'advanced';
  connectedAt?: string;
  lastSync?: string;
  syncCount?: number;
  type?: string;
  enabled?: boolean;
  config?: any;
}

const availableIntegrations: Integration[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5,000+ apps with automated workflows',
    icon: Zap,
    category: 'Automation',
    status: 'available',
    features: [
      'Trigger workflows on analysis completion',
      'Send alerts to any app',
      'Sync data to your tools',
      'Multi-step automations'
    ],
    setupComplexity: 'easy'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive real-time notifications in your Slack channels',
    icon: MessageSquare,
    category: 'Communication',
    status: 'available',
    features: [
      'Real-time alerts',
      'Analysis summaries',
      'Custom channel routing',
      'Interactive notifications'
    ],
    setupComplexity: 'easy'
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Export and sync analysis data to Google Sheets',
    icon: FileSpreadsheet,
    category: 'Data Export',
    status: 'available',
    features: [
      'Auto-sync analysis results',
      'Custom data mapping',
      'Real-time updates',
      'Historical data tracking'
    ],
    setupComplexity: 'medium'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Get notifications in your Discord servers',
    icon: MessageSquare,
    category: 'Communication',
    status: 'available',
    features: [
      'Server notifications',
      'Rich embeds with data',
      'Custom webhooks',
      'Role mentions'
    ],
    setupComplexity: 'easy'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for enterprise notifications',
    icon: MessageSquare,
    category: 'Communication',
    status: 'available',
    features: [
      'Channel notifications',
      'Adaptive cards',
      'Action buttons',
      'Team collaboration'
    ],
    setupComplexity: 'medium'
  },
  {
    id: 'email',
    name: 'Email Notifications',
    description: 'Configure custom email alerts and reports',
    icon: Mail,
    category: 'Communication',
    status: 'available',
    features: [
      'HTML email reports',
      'Custom recipients',
      'Scheduled digests',
      'Priority alerts'
    ],
    setupComplexity: 'easy'
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Sync data to Airtable bases',
    icon: Database,
    category: 'Data Export',
    status: 'available',
    features: [
      'Custom base mapping',
      'Bi-directional sync',
      'Field type mapping',
      'Relation support'
    ],
    setupComplexity: 'medium'
  },
  {
    id: 'api',
    name: 'REST API',
    description: 'Full programmatic access via REST API',
    icon: Code,
    category: 'Developer',
    status: 'available',
    features: [
      'Complete data access',
      'Webhook events',
      'Rate limiting',
      'API documentation'
    ],
    setupComplexity: 'advanced'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Export analysis reports to Notion databases',
    icon: Database,
    category: 'Data Export',
    status: 'coming_soon',
    features: [
      'Database integration',
      'Rich content sync',
      'Automatic updates',
      'Template support'
    ],
    setupComplexity: 'medium'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Send metrics and events to Datadog',
    icon: Cloud,
    category: 'Monitoring',
    status: 'coming_soon',
    features: [
      'Custom metrics',
      'Event tracking',
      'Dashboard integration',
      'Alert correlation'
    ],
    setupComplexity: 'advanced'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync brand insights to your CRM',
    icon: Database,
    category: 'CRM',
    status: 'coming_soon',
    features: [
      'Contact enrichment',
      'Deal tracking',
      'Activity logging',
      'Custom properties'
    ],
    setupComplexity: 'medium'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM integration',
    icon: Cloud,
    category: 'CRM',
    status: 'coming_soon',
    features: [
      'Object mapping',
      'Workflow triggers',
      'Custom fields',
      'Enterprise security'
    ],
    setupComplexity: 'advanced'
  }
];

const categories = [
  'All',
  'Automation',
  'Communication',
  'Data Export',
  'Developer',
  'Monitoring',
  'CRM'
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(availableIntegrations);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch connected integrations from API and merge with available integrations
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations?userId=demo-user');
      const data = await response.json();

      if (data.success && data.integrations) {
        // Merge API integrations with available integrations
        const mergedIntegrations = availableIntegrations.map(integration => {
          const connected = data.integrations.find((i: any) =>
            i.type === integration.id || i.name.toLowerCase().includes(integration.id)
          );

          if (connected) {
            return {
              ...integration,
              status: 'connected' as const,
              connectedAt: connected.createdAt,
              lastSync: connected.lastSync,
              syncCount: connected.syncCount,
              enabled: connected.enabled
            };
          }
          return integration;
        });
        setIntegrations(mergedIntegrations);
      } else {
        setIntegrations(availableIntegrations);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setIntegrations(availableIntegrations);
    } finally {
      setLoading(false);
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalSyncs = integrations.reduce((sum, i) => sum + (i.syncCount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            <Check className="w-3 h-3" />
            Connected
          </div>
        );
      case 'available':
        return (
          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Available
          </div>
        );
      case 'coming_soon':
        return (
          <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            Coming Soon
          </div>
        );
    }
  };

  const getComplexityBadge = (complexity: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700'
    };
    return (
      <div className={`px-2 py-1 rounded text-xs font-medium ${colors[complexity as keyof typeof colors]}`}>
        {complexity.charAt(0).toUpperCase() + complexity.slice(1)} Setup
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Blocks className="w-8 h-8 text-blue-600" />
            Integrations
          </h1>
          <p className="text-gray-600 mt-2">
            Connect Velaris with your favorite tools and platforms
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{connectedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {integrations.filter(i => i.status === 'available').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Blocks className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Syncs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSyncs.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coming Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {integrations.filter(i => i.status === 'coming_soon').length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className={`bg-white rounded-xl border-2 p-6 transition-all ${
                  integration.status === 'connected'
                    ? 'border-green-200 hover:border-green-300 hover:shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      integration.status === 'connected' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        integration.status === 'connected' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{integration.name}</h3>
                      <span className="text-xs text-gray-500">{integration.category}</span>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                {/* Features */}
                <ul className="space-y-1 mb-4">
                  {integration.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start text-xs text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Complexity Badge */}
                <div className="mb-4">
                  {getComplexityBadge(integration.setupComplexity)}
                </div>

                {/* Connected Info */}
                {integration.status === 'connected' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-700">
                        Connected: {integration.connectedAt ? new Date(integration.connectedAt).toLocaleDateString() : 'Recently'}
                      </span>
                      {integration.syncCount && (
                        <span className="font-medium text-green-800">
                          {integration.syncCount} syncs
                        </span>
                      )}
                    </div>
                    {integration.lastSync && (
                      <p className="text-xs text-green-600 mt-1">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {integration.status === 'connected' && (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                      <button className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                        Disconnect
                      </button>
                    </>
                  )}
                  {integration.status === 'available' && (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      <Link2 className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                  {integration.status === 'coming_soon' && (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Request Integration */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Don't see your tool?
          </h2>
          <p className="text-blue-100 mb-6">
            Request a new integration and we'll prioritize it for development
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Request Integration
            <ExternalLink className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
