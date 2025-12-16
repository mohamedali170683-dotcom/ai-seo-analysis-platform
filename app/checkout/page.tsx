"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Lock, Shield, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { TIER_PRICING, TRIAL_DAYS } from "@/lib/tier/types";
import { useTier } from "@/lib/tier";
import { Suspense } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "professional";
  const billing = searchParams.get("billing") || "monthly";
  const { setTier } = useTier();
  
  const price = billing === "monthly" 
    ? TIER_PRICING.professional.monthly 
    : TIER_PRICING.professional.annual;
  
  const monthlyEquivalent = billing === "annual" 
    ? Math.round(TIER_PRICING.professional.annual / 12)
    : TIER_PRICING.professional.monthly;

  // Simulate successful checkout for prototype
  const handleSimulateCheckout = () => {
    setTier("professional");
    window.location.href = "/dashboard?upgrade=success";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="border-b pb-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Velaris Professional
                  </h3>
                  <p className="text-sm text-gray-500">
                    {billing === "annual" ? "Annual subscription" : "Monthly subscription"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">€{price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {billing === "annual" ? "/year" : "/month"}
                  </p>
                </div>
              </div>

              {billing === "annual" && (
                <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                  <p className="font-medium">You&apos;re saving €{TIER_PRICING.professional.annualSavings}!</p>
                  <p className="text-green-600">That&apos;s 2 months free compared to monthly billing.</p>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">What&apos;s included:</h4>
              {[
                "All 4 AI platforms",
                "18 questions per analysis",
                "Full funnel analysis",
                "3 competitor comparisons",
                "5 analyses per month",
                "PDF export & code snippets",
                "Weekly monitoring",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Today&apos;s charge</span>
                <span className="text-2xl font-bold text-gray-900">€0</span>
              </div>
              <p className="text-sm text-gray-500">
                Your {TRIAL_DAYS}-day free trial starts today. You&apos;ll be charged €{price.toLocaleString()} on {new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            </div>
          </div>

          {/* Payment Form Placeholder */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            </div>

            {/* Placeholder for Stripe Elements */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email"
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Stripe Elements will render here</p>
                  <p className="text-xs text-gray-400 mt-2">Prototype Mode</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name on card</label>
                <input 
                  type="text"
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Select country</option>
                  <option>Germany</option>
                  <option>United Kingdom</option>
                  <option>France</option>
                  <option>Spain</option>
                  <option>Netherlands</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSimulateCheckout}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Start My Free Trial
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                Secured by Stripe. 30-day money-back guarantee.
              </p>
            </div>

            {/* Simulate success note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                <strong>Prototype Mode:</strong> Click the button above to simulate a successful checkout and unlock Professional features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading checkout...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
