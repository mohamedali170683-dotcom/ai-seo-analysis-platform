"use client";

import { useState } from "react";
import { Mail, ArrowRight, Sparkles, Check, Shield } from "lucide-react";
import { useTier } from "@/lib/tier";

interface EmailGateProps {
  brandName: string;
  competitorName?: string;
  onEmailSubmit: (email: string) => void;
  onSkip?: () => void;
}

export function EmailGate({ brandName, competitorName, onEmailSubmit, onSkip }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { setUserEmail } = useTier();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    
    // Store email in tier context
    setUserEmail(email);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    onEmailSubmit(email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your AI Visibility Report is Ready!</h2>
          <p className="text-white/90">
            See how <strong>{brandName}</strong> compares
            {competitorName && ` to ${competitorName}`} across AI platforms.
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <p className="text-gray-600 text-center mb-6">
            Enter your email to access your personalized visibility report.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Preparing Your Report...
                </>
              ) : (
                <>
                  View My Report
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* What you'll get */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 font-medium mb-3">Your report includes:</p>
            <ul className="space-y-2">
              {[
                "AI Visibility Score vs Competitors",
                "Sentiment Analysis Breakdown",
                "Technical Audit Pass/Fail Indicators",
                "Quick Optimization Tips",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>We respect your privacy. No spam, ever.</span>
          </div>

          {/* Skip option for testing */}
          {onSkip && (
            <div className="mt-4 text-center">
              <button
                onClick={onSkip}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Skip for now (testing only)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
