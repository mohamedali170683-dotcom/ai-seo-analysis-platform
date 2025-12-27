"use client";

import { useState } from "react";
import { 
  Star, 
  Check, 
  ArrowRight, 
  Calendar,
  MessageCircle,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Building
} from "lucide-react";
import Link from "next/link";
import { TIER_PRICING, TIER_NAMES, BOOKING_URLS, TRIAL_DAYS } from "@/lib/tier/types";
import { useTier } from "@/lib/tier";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { setTier } = useTier();

  const professionalPrice = billingCycle === "monthly" 
    ? TIER_PRICING.professional.monthly 
    : Math.round(TIER_PRICING.professional.annual / 12);
    
  const partnerPrice = billingCycle === "monthly"
    ? TIER_PRICING.partner.monthly
    : Math.round(TIER_PRICING.partner.annual / 12);

  const handleStartFree = () => {
    setTier("free");
    window.location.href = "/analyze";
  };

  const handleStartTrial = () => {
    // In production, redirect to Stripe checkout
    window.location.href = `${BOOKING_URLS.checkout}?tier=professional&billing=${billingCycle}`;
  };

  const handleBookDemo = () => {
    window.location.href = BOOKING_URLS.demo;
  };

  const handleBookStrategyCall = () => {
    window.location.href = BOOKING_URLS.strategyCall;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Velaris</span>
          </Link>
          <Link 
            href="/analyze"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Start My Free Analysis
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your AI Visibility Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Understand how AI platforms represent your brand. Fix visibility gaps before competitors do.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-100"
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                billingCycle === "annual" 
                  ? "bg-green-400 text-green-900 dark:text-green-100" 
                  : "bg-green-100 text-green-700 dark:text-green-300"
              }`}>
                Save €{TIER_PRICING.professional.annualSavings}
              </span>
            </button>
          </div>

          {/* One-Time Report Option */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Or get a <span className="font-semibold text-blue-600">single comprehensive report for €{TIER_PRICING.professional.oneTimeReport}</span> (one-off, no subscription)
            </p>
          </div>
        </div>

        {/* Pricing Cards - Anchoring: Partner → Professional → Free */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          
          {/* PARTNER TIER - ANCHOR (leftmost for anchoring effect) */}
          <div className="order-3 lg:order-1 border-2 border-amber-300 rounded-2xl p-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Building className="w-3 h-3" />
                For Teams & Agencies
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{TIER_NAMES.partner.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.partner.tagline}</p>
            </div>
            
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">€{partnerPrice.toLocaleString()}</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Billed €{TIER_PRICING.partner.annual.toLocaleString()}/year (1 month free)
                </p>
              )}
            </div>

            <p className="text-center text-sm text-amber-700 font-medium mb-4 bg-amber-100/50 rounded-lg py-2">
              Everything in Professional, plus:
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Unlimited analyses & brands",
                "Unlimited competitor comparisons",
                "Daily monitoring alerts",
                "White-label PDF reports",
                "Full API access",
                "Team access (up to 10 users)",
                "Monthly strategy call (2 hrs)",
                "Implementation support",
                "Dedicated account manager",
                "Private Slack channel",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleBookStrategyCall}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              <Calendar className="w-5 h-5" />
              Book Strategy Call
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Let&apos;s discuss your AI visibility goals
            </p>
          </div>

          {/* PROFESSIONAL TIER - TARGET (highlighted) */}
          <div className="order-1 lg:order-2 relative border-2 border-blue-500 rounded-2xl p-8 bg-gradient-to-br from-cyan-50 via-white to-slate-50 shadow-2xl scale-105 lg:scale-110 z-10">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <Star className="w-4 h-4" /> Most Popular
              </span>
            </div>
            
            <div className="text-center mb-6 pt-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{TIER_NAMES.professional.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.professional.tagline}</p>
            </div>
            
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">€{professionalPrice}</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Billed €{TIER_PRICING.professional.annual}/year (2 months free)
                </p>
              )}
            </div>

            {/* Social proof */}
            <div className="bg-blue-50 rounded-lg p-3 mb-6 text-center">
              <p className="text-sm text-blue-700 font-medium flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Chosen by 73% of customers
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "All 4 AI platforms (ChatGPT, Gemini, Copilot, Perplexity)",
                "Full funnel analysis (Awareness → Decision)",
                "Unlimited questions per analysis",
                "Up to 10 competitor comparisons",
                "Unlimited analyses per month",
                "3 brands monitored",
                "Real search volume data",
                "Full technical recommendations",
                "Code snippets for implementation",
                "PDF export & save results",
                "Weekly monitoring alerts",
                "Email + chat support",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleStartTrial}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold py-4 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              Start My {TRIAL_DAYS}-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" />
              30-day money-back guarantee. Cancel anytime.
            </p>
            
            <button
              onClick={handleBookDemo}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              or Book My Demo →
            </button>
          </div>

          {/* FREE TIER */}
          <div className="order-2 lg:order-3 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 bg-white dark:bg-gray-800">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Zap className="w-3 h-3" />
                Quick Check
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{TIER_NAMES.free.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.free.tagline}</p>
            </div>
            
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">€0</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Free forever</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "All 4 AI platforms",
                "Full funnel analysis (Awareness → Decision)",
                "Real search data from DataForSEO",
                "9 questions analyzed (3 per stage)",
                "Real visibility scores & pain points",
                "Competitor comparison (1 competitor)",
                "Technical audit (issues found)",
                "3 analyses per month",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg -mx-2 mt-2">
                <span className="w-5 h-5 flex-shrink-0 text-center">🔒</span>
                <span>Actionable insights & recommendations blurred</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-amber-600">
                <span className="w-5 h-5 flex-shrink-0 text-center">🔒</span>
                <span>Deep dive details locked</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-amber-600">
                <span className="w-5 h-5 flex-shrink-0 text-center">🔒</span>
                <span>Code snippets & PDF export locked</span>
              </li>
            </ul>

            <button
              onClick={handleStartFree}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Start My Free Check
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              No credit card required
            </p>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden mb-16">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Compare All Features</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Free</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20">Professional</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-amber-600">Partner</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: "AI Platforms", free: "All 4", pro: "All 4", partner: "All 4 + future" },
                  { feature: "Full Funnel Analysis", free: true, pro: true, partner: true },
                  { feature: "Real Visibility Scores", free: true, pro: true, partner: true },
                  { feature: "Max Questions", free: "9", pro: "Unlimited", partner: "Unlimited" },
                  { feature: "Tests per Question", free: "1", pro: "3", partner: "3" },
                  { feature: "Competitors", free: "1", pro: "10", partner: "Unlimited" },
                  { feature: "Analyses/Month", free: "3", pro: "Unlimited", partner: "Unlimited" },
                  { feature: "Brands", free: "1", pro: "3", partner: "Unlimited" },
                  { feature: "Real Search Data", free: true, pro: true, partner: true },
                  { feature: "Actionable Insights", free: "Blurred 🔒", pro: true, partner: true },
                  { feature: "Detailed Recommendations", free: "Blurred 🔒", pro: true, partner: true },
                  { feature: "Deep Dive Details", free: "Blurred 🔒", pro: true, partner: true },
                  { feature: "Code Snippets", free: false, pro: true, partner: true },
                  { feature: "PDF Export", free: false, pro: true, partner: "White-label" },
                  { feature: "Save Results", free: false, pro: true, partner: true },
                  { feature: "Monitoring", free: "—", pro: "Weekly", partner: "Daily" },
                  { feature: "API Access", free: false, pro: false, partner: true },
                  { feature: "Team Members", free: "1", pro: "1", partner: "10" },
                  { feature: "Strategy Calls", free: false, pro: false, partner: "Monthly" },
                  { feature: "Implementation Support", free: false, pro: false, partner: true },
                  { feature: "Slack Access", free: false, pro: false, partner: true },
                  { feature: "Support", free: "Email", pro: "Email + Chat", partner: "Priority + Dedicated" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>
                      ) : row.free}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 bg-blue-50/50">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>
                      ) : row.pro}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                      {typeof row.partner === "boolean" ? (
                        row.partner ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>
                      ) : row.partner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              {
                q: "How does the free trial work?",
                a: "Start a 14-day free trial of Professional with full access to all features. No credit card required to start. Cancel anytime during the trial."
              },
              {
                q: "Can I upgrade or downgrade at any time?",
                a: "Yes! Upgrade from Free to Professional instantly. If you need Partner features, book a strategy call and we'll set up your account. Downgrade anytime - your data is preserved."
              },
              {
                q: "What AI platforms do you test?",
                a: "We test ChatGPT (OpenAI), Google Gemini, Microsoft Copilot, and Perplexity. All tiers include all four platforms — so you see the full picture of your AI visibility, even on Free."
              },
              {
                q: "How is the visibility score calculated?",
                a: "We ask AI platforms questions your customers ask, analyze responses for brand mentions, sentiment, and positioning. Score = (positive mentions / total relevant queries) × 100."
              },
              {
                q: "What's included in the Partner strategy calls?",
                a: "Monthly 2-hour sessions with an AI visibility expert. Review your scores, discuss optimization strategies, plan implementations, and get personalized recommendations."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! 30-day money-back guarantee on Professional. If you're not satisfied, contact us for a full refund."
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to improve your AI visibility?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Start with a free check to see where you stand, or jump into Professional for the complete picture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartFree}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Start My Free Check
            </button>
            <button
              onClick={handleStartTrial}
              className="bg-white text-blue-600 font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              Start My Professional Trial
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 Velaris. AI Visibility Analysis Platform.</p>
        </div>
      </footer>
    </div>
  );
}
