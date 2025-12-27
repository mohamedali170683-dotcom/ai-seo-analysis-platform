'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Zap,
  Search,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Brain,
  AlertTriangle,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const mainFeatures = [
    {
      icon: Brain,
      title: 'AI Platform Analysis',
      description: 'Test your brand across 6 major AI platforms including ChatGPT, Gemini, Claude, Perplexity, Meta AI, and Google AI Overviews',
      link: '/analyze',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Hallucination Detection',
      description: 'Detect and track 8 types of AI hallucinations with brand safety scoring and ground truth management',
      link: '/hallucination-detector',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'Automation & Alerts',
      description: 'Schedule automated scans and receive intelligent alerts across multiple channels when visibility changes',
      link: '/automation',
      color: 'yellow'
    },
    {
      icon: TrendingUp,
      title: 'Visibility Scoring',
      description: 'Transparent visibility metrics with proof-based scoring across the entire customer journey',
      link: '/analyze',
      color: 'green'
    }
  ];

  const benefits = [
    'Monitor your brand across 6 AI platforms in real-time',
    'Detect hallucinations and false information automatically',
    'Track competitors and their visibility trends',
    'Get actionable recommendations with ROI scoring',
    'Automate monitoring with scheduled scans and alerts',
    'Export data in multiple formats (CSV, JSON, Excel, PDF)'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI Visibility Analysis Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Know How AI Platforms
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Talk About Your Brand
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Measure, monitor, and optimize your brand's visibility across ChatGPT, Gemini, Claude, and other AI platforms. Get data-driven insights to improve how AI discusses your brand.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/analyze')}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => router.push('/features')}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-gray-200 dark:border-gray-700"
            >
              View All Features
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">6</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">AI Platforms Monitored</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Hallucination Types Detected</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">9</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Alert Types Available</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">12+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Integrations</div>
          </div>
        </div>

        {/* Main Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Monitor AI Visibility
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                green: 'bg-green-100 text-green-600'
              };

              return (
                <Link
                  key={index}
                  href={feature.link}
                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-blue-300 hover:shadow-xl transition-all group"
                >
                  <div className={`inline-flex p-3 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]} mb-4`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium">
                    Learn more
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-12 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Velaris?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to See How AI Talks About Your Brand?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get your first analysis in less than 5 minutes. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/analyze')}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => router.push('/hallucination-detector')}
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 dark:bg-gray-800/10 transition-colors"
            >
              Try Hallucination Detector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
