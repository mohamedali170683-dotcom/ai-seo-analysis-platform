'use client';

import Link from 'next/link';
import {
  Shield,
  Zap,
  Bell,
  Webhook,
  Blocks,
  FileDown,
  Brain,
  Search,
  TrendingUp,
  Code,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const features = [
  {
    category: 'AI Analysis & Detection',
    description: 'Advanced AI platform analysis and brand safety',
    features: [
      {
        name: 'Multi-Platform AI Testing',
        icon: Brain,
        description: 'Test your brand across 6 AI platforms: ChatGPT, Gemini, Claude, Perplexity, Meta AI, and Google AI Overviews',
        status: 'live',
        link: '/analyze',
        highlights: [
          'Support for 6 major AI platforms',
          'Claude AI (all 4 models)',
          'Google AI Overviews tracking',
          'Cross-platform comparison analytics'
        ]
      },
      {
        name: 'Hallucination Detection',
        icon: Shield,
        description: 'Detect 8 types of hallucinations and brand safety issues in AI responses',
        status: 'live',
        link: '/hallucination-detector',
        highlights: [
          '8 hallucination types detected',
          'Pricing errors & fake products',
          'Outdated information detection',
          'Brand safety scoring (0-100)',
          'Ground truth management system'
        ]
      },
      {
        name: 'Visibility Scoring',
        icon: TrendingUp,
        description: 'Comprehensive visibility analysis with transparent scoring formulas',
        status: 'live',
        link: '/analyze',
        highlights: [
          'Mention rate tracking (50% weight)',
          'Position scoring (30% weight)',
          'Sentiment analysis (20% weight)',
          'Journey stage breakdown',
          'Proof-based metrics with actual quotes'
        ]
      }
    ]
  },
  {
    category: 'Automation & Alerting',
    description: 'Automated monitoring and intelligent notifications',
    features: [
      {
        name: 'Automation Dashboard',
        icon: Zap,
        description: 'Schedule automated scans with cron scheduling and error handling',
        status: 'live',
        link: '/automation',
        highlights: [
          'Cron-based scheduling',
          'Automated scan execution',
          'Error handling & retry logic',
          'Execution history tracking'
        ]
      },
      {
        name: 'Alert Engine',
        icon: Bell,
        description: '5 alert types with intelligent throttling and multi-channel delivery',
        status: 'live',
        link: '/alerts',
        highlights: [
          '5 alert types (mention drop, negative sentiment, competitor surge, etc.)',
          'Intelligent throttling',
          'Multi-channel delivery (Email, Slack, Discord, Teams)',
          'Weekly digest reports with HTML export'
        ]
      },
      {
        name: 'Webhooks',
        icon: Webhook,
        description: 'Real-time webhook system with HMAC signature verification',
        status: 'live',
        link: '/webhooks',
        highlights: [
          'HMAC signature verification',
          'Retry logic with exponential backoff',
          'Event type filtering',
          'Delivery history & logs'
        ]
      }
    ]
  },
  {
    category: 'Integrations & Export',
    description: 'Connect with your existing tools and export data',
    features: [
      {
        name: 'Integrations Hub',
        icon: Blocks,
        description: 'Connect with 10+ platforms including Zapier, Google Sheets, and Slack',
        status: 'live',
        link: '/integrations',
        highlights: [
          'Zapier integration',
          'Google Sheets connector',
          'Slack notifications',
          'Discord webhooks',
          'Microsoft Teams integration',
          'Custom API access'
        ]
      },
      {
        name: 'Data Export',
        icon: FileDown,
        description: 'Export analysis data in multiple formats with custom filtering',
        status: 'live',
        link: null,
        apiEndpoint: '/api/analysis/[id]/export',
        highlights: [
          'CSV export',
          'JSON export',
          'Excel (XLSX) export',
          'PDF reports',
          'Custom field selection',
          'Scheduled exports'
        ]
      }
    ]
  },
  {
    category: 'Content Optimization',
    description: 'AI-powered content recommendations and schema generation',
    features: [
      {
        name: 'Content Gap Analysis',
        icon: Search,
        description: 'Identify 7 types of content gaps with ROI-scored recommendations',
        status: 'live',
        link: '/results',
        highlights: [
          '7 gap types detected',
          'Missing topics identification',
          'Keyword coverage analysis',
          'Question coverage tracking',
          'AI-powered recommendations with ROI scoring'
        ]
      },
      {
        name: 'Schema Generator',
        icon: Code,
        description: 'Generate 8 types of schema markup to improve AI understanding',
        status: 'live',
        link: null,
        highlights: [
          'Organization schema',
          'Product schema',
          'FAQ schema',
          'Article schema',
          'Review schema',
          'BreadcrumbList schema',
          'WebSite schema',
          'LocalBusiness schema'
        ]
      },
      {
        name: 'Optimization Reports',
        icon: Sparkles,
        description: 'Comprehensive optimization reports with executive summaries',
        status: 'live',
        link: '/results',
        highlights: [
          'Executive summary generation',
          'Pattern recognition across AI responses',
          'Actionable recommendations',
          'Implementation priority scoring',
          'Expected impact forecasting'
        ]
      }
    ]
  },
  {
    category: 'API & Developer Tools',
    description: 'Full REST API with SDK and monitoring',
    features: [
      {
        name: 'REST API',
        icon: Globe,
        description: 'Complete REST API with authentication and rate limiting',
        status: 'live',
        link: null,
        apiEndpoint: '/api/*',
        highlights: [
          'Full CRUD operations',
          'Tiered rate limiting',
          'API key authentication',
          'Comprehensive documentation',
          'Webhook event delivery',
          'Usage analytics'
        ]
      }
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Platform Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive suite of tools to measure, monitor, and optimize your brand's visibility across AI platforms
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-16">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {category.category}
                </h2>
                <p className="text-gray-600">{category.description}</p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature, featureIndex) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={featureIndex}
                      className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all p-6 hover:shadow-lg"
                    >
                      {/* Feature Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {feature.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {feature.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4">
                        {feature.description}
                      </p>

                      {/* Highlights */}
                      <ul className="space-y-2 mb-4">
                        {feature.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start text-xs text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Link */}
                      {feature.link && (
                        <Link
                          href={feature.link}
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Try it now
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      )}
                      {feature.apiEndpoint && (
                        <div className="text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1">
                          API: {feature.apiEndpoint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Start analyzing your brand's AI visibility in minutes
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Start New Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
