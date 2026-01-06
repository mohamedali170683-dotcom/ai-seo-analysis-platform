"use client";

import { useState } from "react";
import { Mail, ArrowRight, Lock, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";

interface LoginGateProps {
  brandName: string;
  overallScore: number;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSkip?: () => void;
}

export function LoginGate({ brandName, overallScore, onLogin, onSkip }: LoginGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError(mode === "login" ? "Invalid email or password" : "Registration failed. Try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Gradient overlay that fades content */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-10" />

      {/* Login prompt card */}
      <div className="relative z-20 bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md mx-auto mt-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-1">
            {mode === "login" ? "Login to See Full Report" : "Create Account"}
          </h2>
          <p className="text-white/90 text-sm">
            <strong>{brandName}</strong> scored <strong>{overallScore}%</strong> visibility
          </p>
        </div>

        {/* What's locked */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-amber-800 font-medium mb-2">Unlock with free account:</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Detailed Technical Audit & Recommendations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Competitor Intelligence Breakdown
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              AI Response Deep Dives
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Save & Track Your Results
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    error && !email ? "border-red-500" : "border-gray-300"
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "Create a password"}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    error && !password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === "login" ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Login & View Full Report" : "Create Account & View Report"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-4 text-center text-sm">
            {mode === "login" ? (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Login
                </button>
              </p>
            )}
          </div>

          {/* Skip option for testing */}
          {onSkip && (
            <div className="mt-4 text-center">
              <button
                onClick={onSkip}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Continue without account (limited view)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline login prompt that can be placed anywhere
export function InlineLoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Login to See Full Report</h3>
            <p className="text-slate-400 text-sm">
              Create a free account to unlock all insights and recommendations
            </p>
          </div>
        </div>
        <button
          onClick={onLogin}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Login / Sign Up
        </button>
      </div>
    </div>
  );
}
