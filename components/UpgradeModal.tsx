"use client";

import React, { useState } from "react";
import { X, Lock, Sparkles, Calendar, ArrowRight, Check, Star, Mail } from "lucide-react";
import {
  UpgradeModalTrigger,
  UPGRADE_MODAL_CONTENT,
  BOOKING_URLS,
  TIER_PRICING,
  TIER_NAMES,
} from "@/lib/tier/types";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: UpgradeModalTrigger;
}

export function UpgradeModal({ isOpen, onClose, trigger }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  if (!isOpen) return null;

  const content = UPGRADE_MODAL_CONTENT[trigger];
  const professionalPrice = billingCycle === "monthly"
    ? TIER_PRICING.professional.monthly
    : Math.round(TIER_PRICING.professional.annual / 12);
  const partnerPrice = TIER_PRICING.partner.monthly;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl border-2 border-[#E5E5E5] shadow-xl max-w-4xl w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-off-grey hover:text-[#4A5F5F] transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="bg-[#173D32] p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Unlock Full AI Visibility Analysis</span>
          </div>
          <h2 className="text-2xl font-headline font-bold mb-2">{content.headline}</h2>
          <p className="text-white/90">{content.description}</p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center py-4 bg-off-white border-b border-[#E5E5E5]">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-[#E5E5E5]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-[#173D32] text-white"
                  : "text-[#4A5F5F] hover:text-off-black"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#173D32] text-white"
                  : "text-[#4A5F5F] hover:text-off-black"
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                billingCycle === "annual"
                  ? "bg-green-400 text-green-900"
                  : "bg-green-100 text-green-700"
              }`}>
                Save €{TIER_PRICING.professional.annualSavings}
              </span>
            </button>
          </div>
        </div>

        {/* Two tier comparison */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Professional Tier - TARGET (highlighted) */}
            <div className="relative border-2 border-[#396FFA] rounded-xl p-8 bg-[#D0DBF9]/10">
              {/* Most Popular Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#396FFA] text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most Popular
                </span>
              </div>

              <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-headline font-bold text-off-black">{TIER_NAMES.professional.name}</h3>
                <p className="text-sm text-off-grey">{TIER_NAMES.professional.tagline}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-off-black">€{professionalPrice}</span>
                  <span className="text-off-grey">/month</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Billed €{TIER_PRICING.professional.annual}/year (2 months free)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  "All 4 AI platforms (ChatGPT, Gemini, Copilot, Perplexity)",
                  "Full funnel analysis (Awareness → Decision)",
                  "Unlimited questions per analysis",
                  "Up to 10 competitor comparisons",
                  "Unlimited analyses per month",
                  "Detailed recommendations & code snippets",
                  "PDF export & save results",
                  "Weekly monitoring alerts",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-[#4A5F5F]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleStartTrial}
                className="w-full bg-[#EB4200] hover:opacity-90 text-white font-semibold py-3 px-6 min-h-[48px] rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Start My 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-off-grey mt-3">
                30-day money-back guarantee. Cancel anytime.
              </p>

              {/* One-Time Report Option */}
              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                <button
                  onClick={() => window.location.href = `${BOOKING_URLS.checkout}?tier=professional&type=one_time`}
                  className="w-full bg-white border-2 border-[#396FFA] text-[#396FFA] font-semibold py-3 px-6 min-h-[48px] rounded-lg transition-all hover:bg-[#D0DBF9]/20 flex items-center justify-center gap-2"
                >
                  Single Report — €{TIER_PRICING.professional.oneTimeReport}
                </button>
                <p className="text-center text-xs text-off-grey mt-2">
                  One-off payment, no subscription
                </p>
              </div>

              <button
                onClick={handleBookDemo}
                className="w-full text-center text-sm text-[#396FFA] hover:text-[#192F80] font-medium mt-3"
              >
                or Book My Demo →
              </button>
            </div>

            {/* Partner Tier - ANCHOR */}
            <div className="border-2 border-[#E5E5E5] rounded-xl p-8 bg-[#E3B5A3]/10">
              <div className="text-center mb-4">
                <h3 className="text-lg font-headline font-bold text-off-black">{TIER_NAMES.partner.name}</h3>
                <p className="text-sm text-off-grey">{TIER_NAMES.partner.tagline}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-off-black">€{partnerPrice.toLocaleString()}</span>
                  <span className="text-off-grey">/month</span>
                </div>
                <p className="text-sm text-off-grey mt-1">
                  or €{TIER_PRICING.partner.annual.toLocaleString()}/year (1 month free)
                </p>
              </div>

              <p className="text-sm text-[#4A5F5F] mb-4 text-center font-medium">
                Everything in Professional, plus:
              </p>

              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited analyses & brands",
                  "Unlimited competitor comparisons",
                  "Daily monitoring alerts",
                  "White-label PDF reports",
                  "Full API access",
                  "Team access (up to 10 users)",
                  "Monthly strategy call (2 hours)",
                  "Implementation support",
                  "Dedicated account manager",
                  "Private Slack channel",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-[#EB4200] flex-shrink-0" />
                    <span className="text-[#4A5F5F]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleBookStrategyCall}
                className="w-full bg-[#173D32] hover:bg-[#1D5142] text-white font-semibold py-3 px-6 min-h-[48px] rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book Strategy Call
              </button>

              <p className="text-center text-xs text-off-grey mt-3">
                Let&apos;s discuss your AI visibility goals
              </p>
            </div>
          </div>
        </div>

        {/* Stay on Free link */}
        <div className="text-center pb-6">
          <button
            onClick={onClose}
            className="text-sm text-off-grey hover:text-[#4A5F5F]"
          >
            Stay on Free
          </button>
        </div>
      </div>
    </div>
  );
}

// Premium Badge Component
export function PremiumBadge({
  size = "sm",
  tier = "professional",
  className = ""
}: {
  size?: "sm" | "md";
  tier?: "professional" | "partner";
  className?: string;
}) {
  const colors = tier === "professional"
    ? "bg-[#D0DBF9]/30 text-[#192F80] border-[#D0DBF9]"
    : "bg-[#E3B5A3]/20 text-[#EB4200] border-[#E3B5A3]";

  return (
    <span className={`
      inline-flex items-center gap-1
      ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}
      ${colors}
      font-medium rounded-full border
      ${className}
    `}>
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {tier === "professional" ? "Professional" : "Partner"}
    </span>
  );
}

// Lock Overlay Component
export function LockOverlay({
  onClick,
  message = "Included in Professional",
  showTeaser,
  teaserValue
}: {
  onClick: () => void;
  message?: string;
  showTeaser?: boolean;
  teaserValue?: string;
}) {
  return (
    <div
      className="absolute inset-0 bg-off-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 rounded-lg"
      onClick={onClick}
    >
      {showTeaser && teaserValue && (
        <div className="text-2xl font-bold text-off-grey mb-2">{teaserValue}</div>
      )}
      <div className="bg-white rounded-full p-3 shadow-lg mb-2">
        <Lock className="w-6 h-6 text-off-grey" />
      </div>
      <span className="text-sm font-medium text-[#4A5F5F]">{message}</span>
      <span className="text-xs text-[#396FFA] mt-1 flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> Click to unlock
      </span>
    </div>
  );
}

// Blurred Content Wrapper
export function BlurredContent({
  children,
  isLocked,
  onClick,
  message,
  showTeaser,
  teaserValue
}: {
  children: React.ReactNode;
  isLocked: boolean;
  onClick: () => void;
  message?: string;
  showTeaser?: boolean;
  teaserValue?: string;
}) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      <LockOverlay onClick={onClick} message={message} showTeaser={showTeaser} teaserValue={teaserValue} />
    </div>
  );
}

// Visibility Gap Alert Component (Loss Aversion)
export function VisibilityGapAlert({
  brandName,
  brandScore,
  competitorName,
  competitorScore,
  onUpgrade,
  issuesFound
}: {
  brandName: string;
  brandScore: number;
  competitorName?: string;
  competitorScore?: number;
  onUpgrade: () => void;
  issuesFound?: number;
}) {
  const gap = competitorScore ? competitorScore - brandScore : 0;
  const missingPercent = 100 - brandScore;

  return (
    <div className="bg-[#E3B5A3]/15 border-2 border-[#EB4200]/30 rounded-xl p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="text-lg font-headline font-bold text-off-black">AI Visibility Gap Detected</h3>
          <p className="text-sm text-[#4A5F5F]">
            Your brand is <strong>missing from {missingPercent}%</strong> of AI purchase recommendations
          </p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-off-black">{brandName}</span>
            <span className="font-bold text-red-600">{brandScore}%</span>
          </div>
          <div className="w-full bg-[#E5E5E5] rounded-full h-4">
            <div
              className="bg-red-500 h-4 rounded-full transition-all"
              style={{ width: `${brandScore}%` }}
            />
          </div>
        </div>

        {competitorName && competitorScore && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-off-black">{competitorName}</span>
              <span className="font-bold text-green-600">{competitorScore}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${competitorScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {issuesFound && (
        <p className="text-sm text-[#4A5F5F] mb-4">
          We identified <strong>{issuesFound} optimization opportunities</strong> to improve your visibility.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onUpgrade}
          className="flex-1 bg-[#EB4200] hover:opacity-90 text-white font-semibold py-3 px-6 min-h-[48px] rounded-lg transition-all flex items-center justify-center gap-2"
        >
          Get My Fix Recommendations
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onUpgrade}
          className="flex-1 bg-white border-2 border-[#396FFA] text-[#396FFA] font-semibold py-3 px-6 min-h-[48px] rounded-lg transition-all hover:bg-[#D0DBF9]/20 flex items-center justify-center gap-2"
        >
          One Report — €199
        </button>
      </div>
    </div>
  );
}

// Lead Magnet Unlock Component
export function LeadMagnetUnlock({
  title = "Unlock Top 10 Missed Questions",
  description = "Enter your email to reveal the top questions where competitors are beating you.",
  onUnlock,
  isLoading = false,
}: {
  title?: string;
  description?: string;
  onUnlock: (email: string) => void;
  isLoading?: boolean;
}) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid work email");
      return;
    }
    setError("");
    onUnlock(email);
  };

  return (
    <div className="bg-[#D0DBF9]/20 border-2 border-[#ACD3C8] rounded-xl p-6 my-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-[#D0DBF9]/30 p-2 rounded-lg">
          <Mail className="w-5 h-5 text-[#396FFA]" />
        </div>
        <div>
          <h3 className="text-lg font-headline font-bold text-off-black">{title}</h3>
          <p className="text-sm text-[#4A5F5F]">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#396FFA] focus:border-[#396FFA] ${
              error ? "border-red-500" : "border-[#E5E5E5]"
            }`}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#EB4200] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 min-w-[140px]"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Unlock Now
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-off-grey mt-3 flex items-center gap-1">
        <Lock className="w-3 h-3" />
        We respect your privacy. No spam, ever.
      </p>
    </div>
  );
}

// Agency CTA Component
export function AgencyCTA({ onContact }: { onContact?: () => void }) {
  const handleContact = () => {
    if (onContact) {
      onContact();
    } else {
      window.location.href = BOOKING_URLS.strategyCall;
    }
  };

  return (
    <div className="bg-[#173D32] rounded-xl p-6 text-white my-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl">💡</span>
        <div className="flex-1">
          <h3 className="text-lg font-headline font-bold mb-2">
            Need help implementing these optimizations?
          </h3>
          <p className="text-[#ACD3C8] text-sm mb-4">
            Our team has helped 50+ brands improve their AI visibility by an average of 34% in 90 days.
          </p>
          <button
            onClick={handleContact}
            className="bg-white text-[#173D32] font-semibold py-2 px-4 rounded-lg hover:bg-off-white transition-all flex items-center gap-2"
          >
            Talk to Your Team
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
