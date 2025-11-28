'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, TrendingUp, Target, Zap, CheckCircle2, BarChart3 } from 'lucide-react';

export default function FormaLandingPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Forma</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/forma/assessment" className="text-gray-300 hover:text-white transition-colors">
                Start Assessment
              </Link>
              <Link 
                href="/forma/assessment"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Forma & Attention
            </h1>
            <p className="text-2xl sm:text-3xl text-purple-300 mb-8">
              Want to improve conversions without doubling your ad spend?
            </p>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              We engineer persuasion, using proven behavioral science.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/forma/assessment"
                className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center space-x-2 shadow-xl hover:shadow-purple-500/50"
              >
                <span>Calculate Your BSOS Score</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-purple-400 text-purple-300 hover:bg-purple-400/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Executive Summary</h2>
            <div className="w-20 h-1 bg-purple-500 mx-auto"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              In the economy of attention, one fundamental truth remains constant: brands must capture attention to drive action. 
              While technologies, platforms, and tactics evolve, this core principle endures.
            </p>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Target className="h-6 w-6 mr-3 text-purple-400" />
                Forma: The Attention Solution
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Once visible, brands must convert attention into outcomes. Forma applies behavioral science systematically 
                across websites, social media, and advertising to optimize how brands capture, maintain, and convert attention 
                into measurable business results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Attention Imperative */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <div className="bg-purple-600/20 rounded-lg p-4 w-16 h-16 flex items-center justify-center mb-6">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Behavioral Science</h3>
              <p className="text-gray-300">
                Systematic understanding of how humans actually make decisions, not just aesthetic intuition.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <div className="bg-purple-600/20 rounded-lg p-4 w-16 h-16 flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Evidence-Based</h3>
              <p className="text-gray-300">
                Quantitative BSOS scoring (0-100) transforms subjective assessments into trackable metrics.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <div className="bg-purple-600/20 rounded-lg p-4 w-16 h-16 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Rapid Testing</h3>
              <p className="text-gray-300">
                Two-way door decisions enable rapid testing cycles. Stop debating, start learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BSOS Framework */}
      <section id="how-it-works" className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Behavioral Science Optimization Score (BSOS)</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A comprehensive 0-100 scale that quantifies behavioral science application across three primary channels
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Website Component */}
            <div className="bg-gradient-to-br from-blue-900/40 to-transparent rounded-xl p-8 border border-blue-500/20 backdrop-blur-sm">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-400 mb-2">0-33</div>
                <h3 className="text-2xl font-bold text-white">Website/Blog</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Bias Implementation (12):</span>
                    <span className="text-gray-300 text-sm block">Social proof, authority, scarcity, reciprocity</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Choice Architecture (12):</span>
                    <span className="text-gray-300 text-sm block">Option presentation, defaults, CTA design</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Journey Optimization (9):</span>
                    <span className="text-gray-300 text-sm block">Navigation flow, friction reduction</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Social Media Component */}
            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-purple-400 mb-2">0-33</div>
                <h3 className="text-2xl font-bold text-white">Social Media</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Content Engagement (12):</span>
                    <span className="text-gray-300 text-sm block">Emotional triggers, storytelling quality</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Behavioral Triggers (12):</span>
                    <span className="text-gray-300 text-sm block">Scarcity, urgency, commitment devices</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Visual Psychology (9):</span>
                    <span className="text-gray-300 text-sm block">Color psychology, visual hierarchy</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Paid Advertising Component */}
            <div className="bg-gradient-to-br from-pink-900/40 to-transparent rounded-xl p-8 border border-pink-500/20 backdrop-blur-sm">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-pink-400 mb-2">0-34</div>
                <h3 className="text-2xl font-bold text-white">Paid Advertising</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Creative Effectiveness (12):</span>
                    <span className="text-gray-300 text-sm block">Headline framing, attention capture</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Persuasion Architecture (12):</span>
                    <span className="text-gray-300 text-sm block">Loss aversion, social proof integration</span>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold">Landing Page Alignment (10):</span>
                    <span className="text-gray-300 text-sm block">Message consistency, conversion path</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Score Interpretation</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400 mb-2">75-100</div>
                <p className="text-sm text-gray-300">Sophisticated behavioral design, systematic optimization</p>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-2">50-74</div>
                <p className="text-sm text-gray-300">Moderate application with significant opportunities</p>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400 mb-2">25-49</div>
                <p className="text-sm text-gray-300">Limited behavioral science, heavy reliance on aesthetics</p>
              </div>
              <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30">
                <div className="text-2xl font-bold text-red-400 mb-2">0-24</div>
                <p className="text-sm text-gray-300">Minimal application, substantial untapped potential</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Solution, Why Now */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why This Solution, Why Now</h2>
            <div className="w-20 h-1 bg-purple-500 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <TrendingUp className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">It's Cheaper to Test Than Argue</h3>
              <p className="text-gray-300 leading-relaxed">
                Forma is designed as reversible, testable optimizations—"two-way door decisions." Unlike brand repositioning 
                or product overhauls, our solution enables rapid testing cycles.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
              <Zap className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Technology-Enabled, Not Technology-Dependent</h3>
              <p className="text-gray-300 leading-relaxed">
                Behavioral science insights discovered decades ago remain valid. We leverage contemporary technology 
                to apply timeless principles at scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Optimize Your Conversions?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Calculate your Behavioral Science Optimization Score and get personalized recommendations
          </p>
          <Link
            href="/forma/assessment"
            className="inline-flex items-center space-x-2 bg-white text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
          >
            <span>Start Your Assessment</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">Forma</span>
            </div>
            <p className="text-gray-400">Engineering persuasion through behavioral science</p>
            <p className="text-gray-500 text-sm mt-4">© 2025 Forma & Attention. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
