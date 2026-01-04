"use client";

import { useState } from "react";
import {
  Star,
  Check,
  ArrowRight,
  Calendar,
  Zap,
  Shield,
  Users,
  Building,
  TrendingUp,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  X
} from "lucide-react";
import Link from "next/link";
import { TIER_PRICING, TIER_NAMES, BOOKING_URLS, TRIAL_DAYS } from "@/lib/tier/types";
import { useTier } from "@/lib/tier";
import { PublicNavigation } from "@/components/PublicNavigation";
import { PublicFooter } from "@/components/PublicFooter";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [showCompetitorTable, setShowCompetitorTable] = useState(false);
  const { setTier } = useTier();

  const growthPrice = billingCycle === "monthly"
    ? TIER_PRICING.professional.monthly
    : Math.round(TIER_PRICING.professional.annual / 12);

  const agencyPrice = billingCycle === "monthly"
    ? TIER_PRICING.partner.monthly
    : Math.round(TIER_PRICING.partner.annual / 12);

  const handleStartFree = () => {
    setTier("free");
    window.location.href = "/analyze";
  };

  const handleStartTrial = () => {
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
      <PublicNavigation />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section - Loss Aversion Trigger */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            AI traffic grew 527% in 2025 - is your brand visible?
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Stop Losing Customers to AI Recommendations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            When someone asks ChatGPT or Perplexity for recommendations in your category,
            are they finding you - or your competitors?
          </p>

          {/* Social Proof - Authority */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>Used by 200+ brands</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>

        {/* Billing Toggle with Anchoring - Default to Annual */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg border mb-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                billingCycle === "annual"
                  ? "bg-green-400 text-green-900"
                  : "bg-green-100 text-green-700"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
          {billingCycle === "annual" && (
            <p className="text-sm text-green-600 font-medium">
              You save ${TIER_PRICING.professional.annualSavings} per year on Growth
            </p>
          )}
        </div>

        {/* Pricing Cards - Decoy Effect: Agency anchors high, Growth is target */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">

          {/* FREE TIER - Contrast effect (makes Growth look valuable) */}
          <div className="order-2 lg:order-1 border border-gray-200 rounded-2xl p-8 bg-white">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Zap className="w-3 h-3" />
                Try It Out
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{TIER_NAMES.free.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.free.tagline}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Free forever</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "1 full analysis per month",
                "3 AI platforms (ChatGPT, Gemini, Perplexity)",
                "Full funnel analysis",
                "Up to 3 competitors",
                "Basic PDF report",
                "Dashboard access",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-gray-400 pt-2 border-t">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>No automation</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>No alerts</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>No historical trends</span>
              </li>
            </ul>

            <button
              onClick={handleStartFree}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              No credit card required
            </p>
          </div>

          {/* GROWTH TIER - TARGET (Compromise Effect + Visual Prominence) */}
          <div className="order-1 lg:order-2 relative border-2 border-blue-500 rounded-2xl p-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 shadow-2xl scale-105 lg:scale-110 z-10">
            {/* Most Popular Badge - Social Proof */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <Star className="w-4 h-4 fill-white" /> Most Popular
              </span>
            </div>

            <div className="text-center mb-6 pt-4">
              <h3 className="text-2xl font-bold text-gray-900">{TIER_NAMES.professional.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.professional.tagline}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                {billingCycle === "annual" && (
                  <span className="text-2xl text-gray-400 line-through mr-2">${TIER_PRICING.professional.monthly}</span>
                )}
                <span className="text-5xl font-bold text-gray-900">${growthPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Billed ${TIER_PRICING.professional.annual}/year
                </p>
              )}
            </div>

            {/* Urgency + Social Proof */}
            <div className="bg-blue-100 rounded-lg p-3 mb-6 text-center">
              <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                73% of customers choose this plan
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "Unlimited analyses",
                "3 AI platforms + future additions (Copilot, Claude, Grok)",
                "Up to 10 competitors tracked",
                "3 brands monitored",
                "Weekly automated scans",
                "Email alerts (visibility drops, competitor gains)",
                "Full historical trend charts",
                "All export formats (PDF, Excel, CSV)",
                "Follow-up AI reasoning insights",
                "Priority email support",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleStartTrial}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              Start {TRIAL_DAYS}-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" />
              30-day money-back guarantee
            </p>
          </div>

          {/* AGENCY TIER - Anchor (makes Growth look reasonable) */}
          <div className="order-3 border-2 border-amber-300 rounded-2xl p-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-white">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Building className="w-3 h-3" />
                For Teams & Agencies
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{TIER_NAMES.partner.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{TIER_NAMES.partner.tagline}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                {billingCycle === "annual" && (
                  <span className="text-2xl text-gray-400 line-through mr-2">${TIER_PRICING.partner.monthly}</span>
                )}
                <span className="text-5xl font-bold text-gray-900">${agencyPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>
              {billingCycle === "annual" && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Billed ${TIER_PRICING.partner.annual}/year
                </p>
              )}
            </div>

            <p className="text-center text-sm text-amber-700 font-medium mb-4 bg-amber-100/50 rounded-lg py-2">
              Everything in Growth, plus:
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "15 brands monitored",
                "Unlimited competitors",
                "Daily automated scans",
                "White-label PDF reports",
                "Slack & Teams notifications",
                "5 team members",
                "API access",
                "Priority support",
                "Quarterly strategy call",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleBookStrategyCall}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              <Calendar className="w-5 h-5" />
              Book a Call
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              Custom onboarding included
            </p>
          </div>
        </div>

        {/* Value Proposition Section - Why Velaris */}
        <div className="bg-white rounded-3xl border shadow-sm p-8 md:p-12 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Velaris Delivers More Value
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Most tools charge per prompt. We give you <span className="font-semibold">complete analyses</span> across
              your entire customer journey - from awareness to purchase decision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Full Journey Analysis</h3>
              <p className="text-sm text-gray-600">
                We test Awareness, Consideration, and Decision stages. Others only track mentions - we show you <em>where</em> you're losing customers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Competitive Intelligence</h3>
              <p className="text-sm text-gray-600">
                See exactly which competitors AI recommends over you, and get follow-up insights on <em>why</em> they're winning.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Actionable, Not Just Data</h3>
              <p className="text-sm text-gray-600">
                Every insight includes specific recommendations. Know exactly what content to create to improve your AI visibility.
              </p>
            </div>
          </div>
        </div>

        {/* Competitor Comparison - Expandable */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              How We Compare to Alternatives
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              The AI visibility market charges an average of $337/month. Here's how Velaris stacks up.
            </p>
            <button
              onClick={() => setShowCompetitorTable(!showCompetitorTable)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {showCompetitorTable ? "Hide" : "Show"} detailed comparison
              <ChevronDown className={`w-4 h-4 transition-transform ${showCompetitorTable ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showCompetitorTable && (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Tool</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Starting Price</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Full Journey</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Competitors</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Follow-up Insights</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 text-sm font-bold text-blue-700">Velaris (Growth)</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-blue-700">$149/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center text-sm">10</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  {[
                    { name: "Otterly.ai", price: "$29-989/mo", journey: false, competitors: "Limited", followup: false },
                    { name: "Peec AI", price: "€89-499/mo", journey: false, competitors: "3-Unlimited", followup: false },
                    { name: "Profound", price: "$499+/mo", journey: true, competitors: "Unlimited", followup: false },
                    { name: "Rankability", price: "$149-374/mo", journey: false, competitors: "Limited", followup: false },
                    { name: "AthenaHQ", price: "$295+/mo", journey: false, competitors: "Limited", followup: false },
                    { name: "Scrunch AI", price: "$300/mo", journey: false, competitors: "3", followup: false },
                  ].map((tool, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tool.name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{tool.price}</td>
                      <td className="px-6 py-4 text-center">
                        {tool.journey ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{tool.competitors}</td>
                      <td className="px-6 py-4 text-center">
                        {tool.followup ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Pricing as of January 2025. Sources:
                <a href="https://www.therankmasters.com/blog/best-tools-tracking-brand-visibility-ai-search" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  The Rank Masters <ExternalLink className="w-3 h-3 inline" />
                </a>,
                <a href="https://www.rankability.com/blog/best-ai-search-visibility-tracking-tools/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  Rankability <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
            </div>
          )}

          {/* Quick comparison cards for mobile/summary */}
          {!showCompetitorTable && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border">
                <div className="text-2xl font-bold text-gray-900">$337</div>
                <div className="text-sm text-gray-500">Market average price</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-700">$149</div>
                <div className="text-sm text-blue-600">Velaris Growth</div>
              </div>
              <div className="bg-white rounded-xl p-4 border">
                <div className="text-2xl font-bold text-green-600">56%</div>
                <div className="text-sm text-gray-500">Below average</div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-16">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Compare All Features</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Feature</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Starter</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-blue-600 bg-blue-50">Growth</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-amber-600">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: "Price (monthly)", free: "$0", pro: "$149", partner: "$349" },
                  { feature: "Price (annual)", free: "$0", pro: "$119/mo", partner: "$279/mo" },
                  { feature: "Analyses/Month", free: "1", pro: "Unlimited", partner: "Unlimited" },
                  { feature: "Brands Monitored", free: "1", pro: "3", partner: "15" },
                  { feature: "Competitors Tracked", free: "3", pro: "10", partner: "Unlimited" },
                  { feature: "AI Platforms", free: "All 4", pro: "All 4", partner: "All 4" },
                  { feature: "Full Journey Analysis", free: true, pro: true, partner: true },
                  { feature: "Automated Scans", free: "—", pro: "Weekly", partner: "Daily" },
                  { feature: "Email Alerts", free: false, pro: true, partner: true },
                  { feature: "Slack/Teams Alerts", free: false, pro: false, partner: true },
                  { feature: "Historical Trends", free: "30 days", pro: "Full history", partner: "Full history" },
                  { feature: "PDF Reports", free: "Basic", pro: "Full", partner: "White-label" },
                  { feature: "Excel/CSV Export", free: false, pro: true, partner: true },
                  { feature: "Team Members", free: "1", pro: "2", partner: "5" },
                  { feature: "API Access", free: false, pro: false, partner: true },
                  { feature: "Strategy Calls", free: false, pro: false, partner: "Quarterly" },
                  { feature: "Support", free: "Email", pro: "Priority Email", partner: "Priority + Slack" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>
                      ) : row.free}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 bg-blue-50/50">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>
                      ) : row.pro}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
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
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: "How does the free trial work?",
                a: `Start a ${TRIAL_DAYS}-day free trial of Growth with full access to all features. No credit card required to start. Cancel anytime during the trial.`
              },
              {
                q: "What AI platforms do you test?",
                a: "We currently test ChatGPT (OpenAI), Google Gemini, and Perplexity. We're adding Microsoft Copilot, Claude, Grok, Meta AI, and Mistral soon. All tiers include all platforms - so you see the full picture of your AI visibility."
              },
              {
                q: "How is this different from SEO tools?",
                a: "Traditional SEO tools track Google rankings. We track how AI assistants recommend brands when users ask buying questions. With 70%+ of searches now ending without a click, AI visibility is becoming as important as traditional SEO."
              },
              {
                q: "Can I upgrade or downgrade at any time?",
                a: "Yes! Upgrade from Starter to Growth instantly. Downgrade anytime - your data is preserved. For Agency, book a call and we'll help transition your account."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! 30-day money-back guarantee on Growth. If you're not satisfied, contact us for a full refund - no questions asked."
              },
              {
                q: "What makes Velaris different from Otterly or Peec?",
                a: "Most competitors charge per prompt (e.g., $29/mo for 10 prompts). Velaris gives you complete journey analysis with unlimited questions, competitor tracking with leaderboards, and unique follow-up insights that explain WHY AI recommends competitors over you."
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA - Scarcity + Urgency */}
        <div className="text-center p-8 md:p-12 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-3xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Competitors Are Already Optimizing for AI
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto text-lg">
            Every day you wait, they're building AI visibility while you're invisible. Start with a free analysis to see where you stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartFree}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/30"
            >
              Start Free Analysis
            </button>
            <button
              onClick={handleStartTrial}
              className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl transition-all hover:bg-blue-50 flex items-center justify-center gap-2 shadow-lg"
            >
              Start Growth Trial - ${TRIAL_DAYS} Days Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            Join 200+ brands already improving their AI visibility
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
