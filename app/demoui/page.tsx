"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Search, TrendingUp, Sparkles, ArrowRight, Building2, Users, Zap, Clock, BarChart3 } from "lucide-react";

export default function DemoUIPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brand: "",
    domain: "",
    competitors: "",
  });
  const [analysisMode, setAnalysisMode] = useState<"demo" | "real">("demo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query string for demo mode
    const params = new URLSearchParams();
    if (formData.brand) params.set('brand', formData.brand);
    if (formData.domain) params.set('domain', formData.domain);
    if (formData.competitors) params.set('competitors', formData.competitors);
    
    // Redirect to demo page with template data
    router.push(`/demo?${params.toString()}`);
  };

  const handleRealAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandOrKeyword: formData.brand,
          domain: formData.domain || undefined,
          competitors: formData.competitors || undefined,
          testsPerPlatform: 5, // 5 tests per platform for statistical significance
          questionsPerStage: 4, // 4 questions per funnel stage
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start analysis");
      }

      // Redirect to results page
      router.push(`/results/${data.analysisId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start analysis");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (analysisMode === "demo") {
      handleDemoSubmit(e);
    } else {
      handleRealAnalysis(e);
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
              View Sample Report (Purina)
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
            Discover how your brand appears in AI chatbots like ChatGPT, Gemini, and Copilot across the user journey
          </p>
        </div>

        {/* Analysis Mode Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Choose Analysis Mode</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Demo Mode */}
            <button
              onClick={() => setAnalysisMode("demo")}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                analysisMode === "demo"
                  ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200"
                  : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${analysisMode === "demo" ? "bg-yellow-500 text-white" : "bg-yellow-100 text-yellow-600"}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Demo Mode</h3>
                  <span className="text-xs text-yellow-600 font-semibold">INSTANT</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Get instant results with template data. Perfect for seeing what the report looks like with your brand name.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>✓ Instant results (no waiting)</li>
                <li>✓ Template data customized to your brand</li>
                <li>✓ Full report visualization</li>
              </ul>
            </button>

            {/* Real Analysis Mode */}
            <button
              onClick={() => setAnalysisMode("real")}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                analysisMode === "real"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${analysisMode === "real" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Real Analysis</h3>
                  <span className="text-xs text-blue-600 font-semibold">AI-POWERED</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Run actual AI queries across ChatGPT, Gemini, and Copilot for real visibility data.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>✓ 180 real AI queries (12 questions × 5 tests × 3 platforms)</li>
                <li>✓ Statistically significant results</li>
                <li>✓ Actual AI response excerpts</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Mode-specific Info Banner */}
        {analysisMode === "demo" ? (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl px-6 py-4 mb-8">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-800">⚡ Demo Mode Selected</p>
                <p className="text-sm text-yellow-700">
                  You'll see instant results with template data adapted to your brand. No API calls needed.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-xl px-6 py-4 mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-bold text-blue-800">🔬 Real Analysis Selected</p>
                <p className="text-sm text-blue-700">
                  This will run 180 AI queries across 3 platforms. Takes 3-5 minutes for comprehensive results.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Multi-Platform Testing</h3>
            <p className="text-sm text-gray-600">
              Test across ChatGPT, Gemini, and Copilot to understand visibility across AI ecosystems
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Journey Stage Analysis</h3>
            <p className="text-sm text-gray-600">
              Awareness, Consideration, and Decision stage insights with actionable recommendations
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-pink-100">
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Competitive Intelligence</h3>
            <p className="text-sm text-gray-600">
              See how your brand compares to competitors in AI recommendations
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Enter Your Brand Information
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brand Name */}
            <div>
              <label htmlFor="brand" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Brand or Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="brand"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Nike, Tesla, Coca-Cola, Purina"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                The brand name that AI chatbots will be tested with
              </p>
            </div>

            {/* Domain */}
            <div>
              <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Website Domain <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., nike.com, tesla.com, shop.purina.de"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Your brand's website (used for citation tracking)
              </p>
            </div>

            {/* Competitors */}
            <div>
              <label htmlFor="competitors" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Competitors <span className="text-gray-400">(Optional but recommended)</span>
              </label>
              <input
                type="text"
                id="competitors"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="e.g., Adidas, Puma, Under Armour"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Comma-separated list of competitors (up to 3 recommended)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!formData.brand || isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                !formData.brand || isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : analysisMode === "demo"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 hover:shadow-2xl"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting Analysis...
                </>
              ) : analysisMode === "demo" ? (
                <>
                  <Zap className="w-5 h-5" />
                  View Demo Report
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Start Real Analysis
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              {analysisMode === "demo" 
                ? "⚡ Results appear instantly - this is a demo with template data"
                : "🔬 Analysis takes 3-5 minutes - testing across 3 AI platforms"
              }
            </p>
          </form>
        </div>

        {/* What You'll See Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 text-center">What You'll See in the Report</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">📊 Metrics & Scores</h4>
              <ul className="space-y-2 text-sm">
                <li>• Overall AI visibility score (0-100)</li>
                <li>• Mention rate across all questions</li>
                <li>• Average position when mentioned</li>
                <li>• Sentiment breakdown (positive/neutral/negative)</li>
                <li>• Platform-by-platform analysis</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">🎯 Journey Insights</h4>
              <ul className="space-y-2 text-sm">
                <li>• Awareness stage analysis</li>
                <li>• Consideration stage comparisons</li>
                <li>• Decision stage recommendations</li>
                <li>• Competitor landscape</li>
                <li>• Actionable improvement suggestions</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-sm opacity-90">
              {analysisMode === "demo" 
                ? "All content will be adapted to feature your brand name and competitors"
                : "Real AI responses from ChatGPT, Gemini, and Copilot for accurate insights"
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
