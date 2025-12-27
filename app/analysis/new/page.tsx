"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Search, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export default function NewAnalysisPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brandOrKeyword: "",
    domain: "",
    competitors: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the comprehensive analysis endpoint
      const response = await fetch("/api/analysis/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandOrKeyword: formData.brandOrKeyword,
          domain: formData.domain || undefined,
          competitors: formData.competitors || undefined,
          testsPerPlatform: 5, // 5 tests per platform for statistical significance
          questionsPerStage: 4, // 4 questions per funnel stage
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start analysis");
      }

      // Redirect to results page
      router.push(`/results/${data.analysisId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <Link
              href="/demo"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              View Demo Report
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Visibility Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how AI platforms like ChatGPT, Gemini, and Copilot mention your brand across the entire user journey
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 border-2 border-blue-200 rounded-xl px-4 py-2">
            <span className="text-sm font-semibold text-blue-700">
              🔬 180 AI queries across 3 platforms for statistically significant results
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">12 Smart Questions</h3>
            <p className="text-sm text-gray-600">
              Brand-specific questions across awareness, consideration, and decision stages
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">3 AI Platforms</h3>
            <p className="text-sm text-gray-600">
              Test across ChatGPT, Gemini, and Copilot for complete visibility
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">180 AI Queries</h3>
            <p className="text-sm text-gray-600">
              5 tests per question per platform for statistical significance
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-pink-100">
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">AI Insights</h3>
            <p className="text-sm text-gray-600">
              Actionable recommendations to improve your AI visibility
            </p>
          </div>
        </div>

        {/* Analysis Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Start Your Analysis
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brand/Keyword */}
            <div>
              <label htmlFor="brandOrKeyword" className="block text-sm font-semibold text-gray-700 mb-2">
                Brand or Keyword <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="brandOrKeyword"
                required
                value={formData.brandOrKeyword}
                onChange={(e) => setFormData({ ...formData, brandOrKeyword: e.target.value })}
                placeholder="e.g., Nike, Shopify, project management software"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 dark:text-gray-100"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the brand name or keyword you want to analyze
              </p>
            </div>

            {/* Domain */}
            <div>
              <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2">
                Website Domain <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., nike.com, shopify.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 dark:text-gray-100"
              />
              <p className="text-sm text-gray-500 mt-2">
                Your brand's website URL (without https://)
              </p>
            </div>

            {/* Competitors */}
            <div>
              <label htmlFor="competitors" className="block text-sm font-semibold text-gray-700 mb-2">
                Competitors <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="competitors"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="e.g., Adidas, Puma, Under Armour"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 dark:text-gray-100"
              />
              <p className="text-sm text-gray-500 mt-2">
                Comma-separated list of competitor brands for comparison
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.brandOrKeyword}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading || !formData.brandOrKeyword
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting Analysis...
                </>
              ) : (
                <>
                  Start My Analysis
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Analysis typically completes in 3-5 minutes (180 AI queries across 3 platforms)
            </p>
          </form>
        </div>

        {/* What You'll Get */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">What You'll Discover</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-bold text-xl mb-3">📊 Visibility Metrics</h3>
              <ul className="space-y-2 text-sm">
                <li>• Overall AI visibility score (0-100)</li>
                <li>• Mention rate across all questions</li>
                <li>• Average position when mentioned</li>
                <li>• Sentiment analysis (positive/neutral/negative)</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-bold text-xl mb-3">🎯 Journey Stage Analysis</h3>
              <ul className="space-y-2 text-sm">
                <li>• Awareness stage performance</li>
                <li>• Consideration stage insights</li>
                <li>• Decision stage recommendations</li>
                <li>• Real AI response examples</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-bold text-xl mb-3">🏆 Competitive Intelligence</h3>
              <ul className="space-y-2 text-sm">
                <li>• Competitor mention rates</li>
                <li>• Relative positioning analysis</li>
                <li>• Gap identification</li>
                <li>• Opportunity assessment</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-bold text-xl mb-3">💡 Strategic Recommendations</h3>
              <ul className="space-y-2 text-sm">
                <li>• Content type recommendations</li>
                <li>• Common pattern identification</li>
                <li>• Actionable next steps</li>
                <li>• Stage-specific strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
