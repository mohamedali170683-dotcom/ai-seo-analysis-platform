"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, TrendingUp, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function AnalysisLandingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brandOrKeyword: "",
    domain: "",
    competitors: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analysis/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to analysis progress page
        router.push(`/analysis/${data.analysisId}`);
      } else {
        setError(data.error || "Failed to start analysis");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Brand Visibility Intelligence
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your AI
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              Visibility Score
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Analyze how ChatGPT and Gemini mention your brand. Get actionable insights 
            to increase AI citations, improve positioning, and dominate AI-powered search.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Start Your Analysis
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brand/Keyword Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand or Keyword
                </label>
                <input
                  type="text"
                  value={formData.brandOrKeyword}
                  onChange={(e) =>
                    setFormData({ ...formData, brandOrKeyword: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="e.g., Nike, Salesforce, or 'project management tools'"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The brand or product category you want to analyze
                </p>
              </div>

              {/* Domain Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Website Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="e.g., nike.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your company website (for context and attribution analysis)
                </p>
              </div>

              {/* Competitors Input (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Known Competitors <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.competitors}
                  onChange={(e) =>
                    setFormData({ ...formData, competitors: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="e.g., Adidas, Puma, Asics"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll auto-detect competitors, but you can specify key ones (comma-separated)
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Check AI Visibility
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* What You'll Get */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                What you'll get:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      100+ AI Queries
                    </div>
                    <div className="text-xs text-gray-600">
                      ChatGPT & Gemini tested multiple times
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      Competitive Analysis
                    </div>
                    <div className="text-xs text-gray-600">
                      See how you compare to rivals
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      AI-Generated Insights
                    </div>
                    <div className="text-xs text-gray-600">
                      Actionable recommendations
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <ArrowRight className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      Visibility Score
                    </div>
                    <div className="text-xs text-gray-600">
                      Overall AI presence rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Time and Demo Link */}
          <div className="text-center mt-6 text-sm text-gray-600 space-y-3">
            <span className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
              ⏱️ Analysis takes 5-10 minutes
            </span>
            <div>
              <a
                href="/demo"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                <Sparkles className="w-4 h-4" />
                View Sample Report
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Automated AI Testing
            </h3>
            <p className="text-gray-600 text-sm">
              We query ChatGPT and Gemini 10-20 times per question for statistical 
              significance. No manual testing needed.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Pattern Detection
            </h3>
            <p className="text-gray-600 text-sm">
              AI analyzes AI responses to discover what triggers brand mentions, 
              recommendations, and positive positioning.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Strategic Insights
            </h3>
            <p className="text-gray-600 text-sm">
              Get prioritized recommendations to increase AI visibility metrics: 
              mentions, citations, positions, and recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
