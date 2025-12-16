"use client";

import { X, Lock, Sparkles, Calendar, ArrowRight, Check, Star } from "lucide-react";
import { 
  UpgradeModalTrigger, 
  UPGRADE_MODAL_CONTENT, 
  BOOKING_URLS,
  TIER_PRICING,
  TIER_NAMES,
} from "@/lib/tier/types";
import { useState } from "react";

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
    // In production, this would redirect to Stripe checkout
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-cyan-700 p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Unlock Full AI Visibility Analysis</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{content.headline}</h2>
          <p className="text-white/90">{content.description}</p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center py-4 bg-gray-50 border-b">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:text-gray-900"
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
            <div className="relative border-2 border-blue-500 rounded-2xl p-8 bg-blue-50/30">
              {/* Most Popular Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most Popular
                </span>
              </div>
              
              <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-bold text-gray-900">{TIER_NAMES.professional.name}</h3>
                <p className="text-sm text-gray-500">{TIER_NAMES.professional.tagline}</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">€{professionalPrice}</span>
                  <span className="text-gray-500">/month</span>
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
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleStartTrial}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Start My 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                30-day money-back guarantee. Cancel anytime.
              </p>
              
              <button
                onClick={handleBookDemo}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                or Book My Demo →
              </button>
            </div>

            {/* Partner Tier - ANCHOR */}
            <div className="border border-gray-200 rounded-2xl p-8 bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{TIER_NAMES.partner.name}</h3>
                <p className="text-sm text-gray-500">{TIER_NAMES.partner.tagline}</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">€{partnerPrice.toLocaleString()}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  or €{TIER_PRICING.partner.annual.toLocaleString()}/year (1 month free)
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4 text-center font-medium">
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
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleBookStrategyCall}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book Strategy Call
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                Let&apos;s discuss your AI visibility goals
              </p>
            </div>
          </div>
        </div>

        {/* Stay on Free link */}
        <div className="text-center pb-6">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
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
    ? "from-cyan-100 to-cyan-50 text-cyan-700 border-blue-200"
    : "from-amber-100 to-yellow-100 text-amber-700 border-amber-200";
  
  return (
    <span className={`
      inline-flex items-center gap-1 
      ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}
      bg-gradient-to-r ${colors}
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
      className="absolute inset-0 bg-gray-100/80 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 rounded-lg"
      onClick={onClick}
    >
      {showTeaser && teaserValue && (
        <div className="text-2xl font-bold text-gray-400 mb-2">{teaserValue}</div>
      )}
      <div className="bg-white rounded-full p-3 shadow-lg mb-2">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <span className="text-sm font-medium text-gray-600">{message}</span>
      <span className="text-xs text-blue-600 mt-1 flex items-center gap-1">
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
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">AI Visibility Gap Detected</h3>
          <p className="text-sm text-gray-600">
            Your brand is <strong>missing from {missingPercent}%</strong> of AI purchase recommendations
          </p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-900">{brandName}</span>
            <span className="font-bold text-red-600">{brandScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-red-500 h-4 rounded-full transition-all"
              style={{ width: `${brandScore}%` }}
            />
          </div>
        </div>
        
        {competitorName && competitorScore && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-900">{competitorName}</span>
              <span className="font-bold text-green-600">{competitorScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${competitorScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {issuesFound && (
        <p className="text-sm text-gray-600 mb-4">
          We identified <strong>{issuesFound} optimization opportunities</strong> to improve your visibility.
        </p>
      )}

      <button
        onClick={onUpgrade}
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold py-3 px-6 min-h-[48px] rounded-xl transition-all flex items-center justify-center gap-2"
      >
        Get My Fix Recommendations — €590/mo
        <ArrowRight className="w-4 h-4" />
      </button>
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
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white my-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl">💡</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">
            Need help implementing these optimizations?
          </h3>
          <p className="text-slate-300 text-sm mb-4">
            Our team has helped 50+ brands improve their AI visibility by an average of 34% in 90 days.
          </p>
          <button
            onClick={handleContact}
            className="bg-white text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            Talk to Your Team
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
