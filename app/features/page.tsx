'use client';

import Link from 'next/link';
import {
  Target,
  Bell,
  Calendar,
  FileDown,
  Brain,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import { PublicNavigation } from '@/components/PublicNavigation';
import { PublicFooter } from '@/components/PublicFooter';

const features = [
  {
    category: 'Core Analysis Tools',
    description: 'Comprehensive brand monitoring across major AI platforms',
    items: [
      {
        name: 'AI Visibility Analysis',
        icon: Brain,
        description: 'Test your brand across 4 AI platforms with transparent visibility scoring.',
        status: 'live',
        link: '/analyze',
        tier: 'free',
        highlights: [
          'ChatGPT, Gemini, Copilot, Perplexity testing',
          'Visibility score (mention rate, position, sentiment)',
          'Journey stage breakdown (Awareness, Consideration, Decision)',
          'Real AI responses with proof quotes',
          'Competitor comparison',
          'Export to PDF, CSV, Excel'
        ]
      },
      {
        name: 'Brand Positioning Check',
        icon: Target,
        description: 'Compare how AI perceives your brand vs. your intended positioning.',
        status: 'live',
        link: '/hallucination-detector',
        tier: 'free',
        highlights: [
          'Auto-fetch positioning from your website',
          'Define positioning attributes (premium, innovative, affordable, etc.)',
          'AI perception vs intended positioning comparison',
          'Alignment scoring per platform',
          'Detect brand misrepresentation',
          'Track positioning over time'
        ]
      }
    ]
  },
  {
    category: 'Monitoring & Alerts',
    description: 'Automated tracking and intelligent notifications',
    items: [
      {
        name: 'Automation Dashboard',
        icon: Calendar,
        description: 'Schedule recurring analyses to track visibility trends over time.',
        status: 'live',
        link: '/automation',
        tier: 'professional',
        highlights: [
          'Cron-based scheduling (daily, weekly, monthly)',
          'Automated scan execution',
          'Execution history tracking',
          'Error handling & retry logic',
          'Brand positioning scheduled checks'
        ]
      },
      {
        name: 'Alert Management',
        icon: Bell,
        description: 'Set up intelligent alerts with multi-channel delivery.',
        status: 'live',
        link: '/alerts',
        tier: 'professional',
        highlights: [
          '9 alert types (visibility drop, competitor surge, etc.)',
          'Configurable thresholds and conditions',
          'Multi-channel delivery (Email, Slack, Discord, Teams)',
          'Intelligent throttling to prevent alert fatigue',
          'Alert history and trigger tracking'
        ]
      }
    ]
  },
  {
    category: 'Insights & Reporting',
    description: 'Deep analysis and actionable recommendations',
    items: [
      {
        name: 'Executive Summary',
        icon: Sparkles,
        description: 'AI-generated executive summaries with key findings and recommendations.',
        status: 'live',
        link: '/results',
        tier: 'professional',
        highlights: [
          'Auto-generated executive summary',
          'Pattern recognition across AI responses',
          'Actionable recommendations',
          'ROI-scored priority suggestions',
          'Trend analysis over time'
        ]
      },
      {
        name: 'Journey Stage Analysis',
        icon: TrendingUp,
        description: 'Understand performance at each stage of the customer journey.',
        status: 'live',
        link: '/results',
        tier: 'free',
        highlights: [
          'Awareness stage visibility',
          'Consideration stage positioning',
          'Decision stage recommendations',
          'Stage-weighted overall score',
          'Competitor performance by stage'
        ]
      },
      {
        name: 'Competitor Intelligence',
        icon: Users,
        description: 'Track how competitors appear in AI responses vs. your brand.',
        status: 'live',
        link: '/results',
        tier: 'free',
        highlights: [
          'Side-by-side competitor comparison',
          'Mention frequency tracking',
          'Sentiment comparison',
          'Position ranking analysis',
          'Competitor visibility trends'
        ]
      }
    ]
  },
  {
    category: 'Export & Integration',
    description: 'Get your data where you need it',
    items: [
      {
        name: 'Data Export',
        icon: FileDown,
        description: 'Export analysis results in multiple formats.',
        status: 'live',
        link: null,
        tier: 'professional',
        highlights: [
          'PDF reports with branding',
          'CSV export for spreadsheets',
          'Excel (XLSX) with formatting',
          'JSON for developers',
          'Filtered export by date/brand'
        ]
      },
      {
        name: 'Dashboard',
        icon: BarChart3,
        description: 'Central hub for all your analyses and insights.',
        status: 'live',
        link: '/dashboard',
        tier: 'free',
        highlights: [
          'Analysis history and management',
          'Quick stats overview',
          'Recent activity tracking',
          'Quick actions for common tasks',
          'Individual analysis deletion'
        ]
      }
    ]
  }
];

const tierColors = {
  free: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Free' },
  professional: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Professional' },
  partner: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Partner' }
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Platform Features
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for AI Visibility
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From one-time brand checks to continuous monitoring, we provide the tools to understand and improve how AI platforms talk about your brand.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-20">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {category.category}
                </h2>
                <p className="text-lg text-gray-600">{category.description}</p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((feature, featureIndex) => {
                  const Icon = feature.icon;
                  const tierStyle = tierColors[feature.tier as keyof typeof tierColors];

                  return (
                    <div
                      key={featureIndex}
                      className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all p-6 hover:shadow-xl group"
                    >
                      {/* Feature Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tierStyle.bg} ${tierStyle.text}`}>
                            {tierStyle.label}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Live
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {feature.description}
                      </p>

                      {/* Highlights */}
                      <ul className="space-y-2 mb-6">
                        {feature.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Link */}
                      {feature.link && (
                        <Link
                          href={feature.link}
                          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                        >
                          Try it now
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tier Comparison Quick View */}
        <div className="mt-20 bg-gray-50 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Feature Availability by Plan
            </h2>
            <p className="text-gray-600">
              All core features available on Free. Unlock automation and alerts with Professional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Free</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  AI Visibility Analysis
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Brand Positioning Check
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Journey Stage Analysis
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Competitor Comparison
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Dashboard
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4" />
                  Automation (locked)
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4" />
                  Alerts (locked)
                </li>
              </ul>
            </div>

            {/* Professional */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-500 shadow-lg scale-105">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Professional</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Automation Dashboard
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Alert Management
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Executive Summary
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  PDF/Excel Export
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Unlimited Analyses
                </li>
              </ul>
            </div>

            {/* Partner */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Partner</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Everything in Professional
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  API Access
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  White-label Reports
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Team Access (10 users)
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Dedicated Support
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Strategy Calls
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              View full pricing comparison
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-12 lg:p-16 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start with a free analysis to see how AI platforms talk about your brand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
