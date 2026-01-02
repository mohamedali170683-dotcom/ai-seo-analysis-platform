'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  Zap,
  Search,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Brain,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Bell,
  Calendar,
  Shield,
  Play,
  Star,
  Users,
  Building,
  Globe,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const coreFeatures = [
    {
      icon: Brain,
      title: 'AI Visibility Analysis',
      description: 'Test your brand across ChatGPT, Gemini, Copilot & Perplexity. See exactly how AI platforms talk about you.',
      link: '/analyze',
      color: 'blue',
      badge: 'Core Feature'
    },
    {
      icon: Target,
      title: 'Brand Positioning Check',
      description: 'Does AI portray your brand the way you want? Compare AI perception vs your intended positioning.',
      link: '/hallucination-detector',
      color: 'purple',
      badge: 'Popular'
    },
    {
      icon: Calendar,
      title: 'Automated Monitoring',
      description: 'Schedule recurring scans to track visibility trends over time. Get notified when things change.',
      link: '/automation',
      color: 'green',
      badge: 'Professional'
    },
    {
      icon: Bell,
      title: 'Intelligent Alerts',
      description: 'Set up alerts for visibility drops, competitor gains, or brand misrepresentation.',
      link: '/alerts',
      color: 'amber',
      badge: 'Professional'
    }
  ];

  const benefits = [
    {
      title: 'Understand AI Perception',
      description: 'See exactly what AI platforms say about your brand when customers ask questions.',
      icon: Eye
    },
    {
      title: 'Track Competitors',
      description: 'Know when competitors are mentioned more than you across AI platforms.',
      icon: Users
    },
    {
      title: 'Catch Misinformation',
      description: 'Detect when AI generates inaccurate information about your products or services.',
      icon: AlertTriangle
    },
    {
      title: 'Journey Stage Insights',
      description: 'See how you perform at Awareness, Consideration, and Decision stages.',
      icon: TrendingUp
    },
    {
      title: 'Actionable Reports',
      description: 'Get specific recommendations with ROI scoring to improve your AI visibility.',
      icon: FileText
    },
    {
      title: 'Export Everything',
      description: 'Download reports in PDF, CSV, Excel, or JSON. Share with your team.',
      icon: BarChart3
    }
  ];

  const socialProof = [
    { company: 'Deutsche Telekom', role: 'Marketing' },
    { company: 'SAP', role: 'Digital Strategy' },
    { company: 'Siemens', role: 'Brand' },
    { company: 'Allianz', role: 'Communications' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Velaris</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/analyze"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI Visibility Analysis Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Know How AI Platforms
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Talk About Your Brand
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              When customers ask ChatGPT, Gemini, or Perplexity about your industry,
              does your brand come up? Find out in 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => router.push('/analyze')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors border-2 border-gray-200"
              >
                View Pricing
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Results in 5 minutes
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                4 AI platforms tested
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-500 mb-6">
            Trusted by marketing teams at leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {socialProof.map((item, index) => (
              <div key={index} className="text-center">
                <span className="text-lg font-semibold text-gray-400">{item.company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50">
              <div className="text-4xl font-bold text-blue-600 mb-2">4</div>
              <div className="text-sm font-medium text-gray-600">AI Platforms</div>
              <div className="text-xs text-gray-500 mt-1">ChatGPT, Gemini, Copilot, Perplexity</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50">
              <div className="text-4xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-sm font-medium text-gray-600">Journey Stages</div>
              <div className="text-xs text-gray-500 mt-1">Awareness, Consideration, Decision</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50">
              <div className="text-4xl font-bold text-green-600 mb-2">9+</div>
              <div className="text-sm font-medium text-gray-600">Alert Types</div>
              <div className="text-xs text-gray-500 mt-1">Visibility, competitors, sentiment</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50">
              <div className="text-4xl font-bold text-amber-600 mb-2">5min</div>
              <div className="text-sm font-medium text-gray-600">Average Scan Time</div>
              <div className="text-xs text-gray-500 mt-1">Full analysis with insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Monitor AI Visibility
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From one-time checks to continuous monitoring, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {coreFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const colorMap = {
                blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'hover:border-blue-300' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'hover:border-purple-300' },
                green: { bg: 'bg-green-100', text: 'text-green-600', border: 'hover:border-green-300' },
                amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'hover:border-amber-300' }
              };
              const colors = colorMap[feature.color as keyof typeof colorMap];

              return (
                <Link
                  key={index}
                  href={feature.link}
                  className={`group bg-white rounded-2xl border-2 border-gray-200 p-8 transition-all ${colors.border} hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                      <Icon className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <div className={`flex items-center font-semibold ${colors.text}`}>
                    Try it now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              See all features
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three steps to understand your AI visibility
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enter Your Brand</h3>
              <p className="text-gray-600">
                Tell us your brand name, domain, and optionally your competitors. That's all we need.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">We Query AI Platforms</h3>
              <p className="text-gray-600">
                We ask ChatGPT, Gemini, Copilot & Perplexity questions your customers might ask.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Your Report</h3>
              <p className="text-gray-600">
                See your visibility score, competitor comparison, and actionable recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Marketing Teams Choose Velaris
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="p-2 bg-blue-100 rounded-lg w-fit mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  3 analyses/month
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  All 4 AI platforms
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Basic visibility score
                </li>
              </ul>
              <Link
                href="/analyze"
                className="block w-full py-3 text-center bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-500 p-8 relative scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <Star className="w-4 h-4" /> Popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">Professional</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Unlimited analyses
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Automated monitoring
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Alerts & notifications
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  PDF & Excel exports
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start 14-Day Trial
              </Link>
            </div>

            {/* Partner */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Partner</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">Custom</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  API access
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  White-label reports
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Dedicated support
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 text-center bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-12 lg:p-16 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to See How AI Talks About Your Brand?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Get your first analysis in less than 5 minutes. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/analyze')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                View Demo Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Velaris</span>
              </div>
              <p className="text-sm text-gray-600">
                AI Visibility Analysis Platform. Know how AI talks about your brand.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/analyze" className="text-sm text-gray-600 hover:text-gray-900">Free Analysis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Tools</h4>
              <ul className="space-y-2">
                <li><Link href="/analyze" className="text-sm text-gray-600 hover:text-gray-900">AI Visibility Analysis</Link></li>
                <li><Link href="/hallucination-detector" className="text-sm text-gray-600 hover:text-gray-900">Brand Positioning</Link></li>
                <li><Link href="/automation" className="text-sm text-gray-600 hover:text-gray-900">Automation</Link></li>
                <li><Link href="/alerts" className="text-sm text-gray-600 hover:text-gray-900">Alerts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link></li>
                <li><Link href="/integrations" className="text-sm text-gray-600 hover:text-gray-900">Integrations</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Velaris. AI Visibility Analysis Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
