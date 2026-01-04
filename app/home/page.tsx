'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Brain,
  AlertTriangle,
  Bell,
  Calendar,
  Star,
  X,
  Clock,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { PublicNavigation } from '@/components/PublicNavigation';
import { PublicFooter } from '@/components/PublicFooter';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero Section - Problem Agitation */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Urgency Hook */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              70% of searches now end without a click
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Is AI Recommending
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Your Competitors
              </span>
              <br />
              Instead of You?
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              When customers ask ChatGPT or Perplexity for recommendations,
              your brand should come up. Find out if it does.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => router.push('/analyze')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Check My AI Visibility
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>

            {/* Trust signals - factual only */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free to start
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                Results in 5 minutes
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-4 h-4 text-purple-500" />
                4 AI platforms tested
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - Loss Aversion */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              The Invisible Problem Costing You Customers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-red-400 mb-2">527%</div>
              <p className="text-gray-300 text-sm">
                Growth in AI-driven traffic in 2025. Users are asking AI instead of Googling.
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-amber-400 mb-2">70%</div>
              <p className="text-gray-300 text-sm">
                Of searches now end without clicking a link. AI gives the answer directly.
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">???</div>
              <p className="text-gray-300 text-sm">
                Your visibility score. Are customers finding you - or your competitors?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do - Simple Value Prop */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              We Test What AI Says About Your Brand
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Velaris queries ChatGPT, Gemini, Perplexity & Copilot with questions your customers ask - then shows you who gets recommended.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Enter Your Brand</h3>
              <p className="text-sm text-gray-600">
                Brand name, category, and competitors you want to track.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">We Query AI Platforms</h3>
              <p className="text-sm text-gray-600">
                Questions across Awareness, Consideration, and Decision stages.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">See Who Wins</h3>
              <p className="text-sm text-gray-600">
                Visibility leaderboard, competitor comparison, and AI reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Concise */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Current Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Brain,
                title: 'AI Visibility Analysis',
                description: 'Test across 4 AI platforms with full journey analysis',
                color: 'blue'
              },
              {
                icon: Target,
                title: 'Brand Positioning Check',
                description: 'Compare AI perception vs your intended positioning',
                color: 'purple'
              },
              {
                icon: Calendar,
                title: 'Automated Monitoring',
                description: 'Weekly/daily scans to track visibility over time',
                color: 'green'
              },
              {
                icon: Bell,
                title: 'Alerts',
                description: 'Get notified on visibility drops or competitor gains',
                color: 'amber'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              const colorMap = {
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                green: 'bg-green-100 text-green-600',
                amber: 'bg-amber-100 text-amber-600'
              };

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-200"
                >
                  <div className={`p-2.5 rounded-lg ${colorMap[feature.color as keyof typeof colorMap]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/features" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              See all features & coming soon →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing - Embedded */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Simple Pricing
            </h2>
            <p className="text-gray-600">
              Start free. Upgrade for continuous monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Starter</h3>
                <span className="text-2xl font-bold text-gray-900">$0</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  '1 analysis/month',
                  'All 4 AI platforms',
                  '3 competitors',
                  'Basic PDF report',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <X className="w-4 h-4 flex-shrink-0" />
                  No automation
                </li>
              </ul>
              <button
                onClick={() => router.push('/analyze')}
                className="w-full py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Start Free
              </button>
            </div>

            {/* Growth - Target */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-500 p-6 relative scale-105 shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most Popular
                </span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-lg font-bold text-gray-900">Growth</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">$149</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  'Unlimited analyses',
                  '10 competitors',
                  '3 brands',
                  'Weekly automated scans',
                  'Email alerts',
                  'Full history & trends',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                Start 14-Day Trial
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                $119/mo billed annually (save 20%)
              </p>
            </div>

            {/* Agency */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Agency</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">$349</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  '15 brands',
                  'Unlimited competitors',
                  'Daily scans',
                  'White-label reports',
                  'API access',
                  '5 team members',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Book a Call
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Differentiation */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              What Makes Velaris Different
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Full Journey Analysis</h4>
                <p className="text-sm text-gray-600">
                  Awareness → Consideration → Decision. Not just mentions.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Competitive Intelligence</h4>
                <p className="text-sm text-gray-600">
                  See who AI recommends and why they beat you.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Actionable Insights</h4>
                <p className="text-sm text-gray-600">
                  Follow-up questions reveal AI reasoning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Urgency */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Your Competitors Might Already Be Optimizing for AI
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              The longer you wait, the harder it gets to catch up. Check your visibility now - it takes 5 minutes.
            </p>
            <button
              onClick={() => router.push('/analyze')}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Check My AI Visibility - Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <p className="text-gray-400 text-sm mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              No credit card required
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
