"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Search, TrendingUp, Sparkles, ArrowRight, Building2, Users } from "lucide-react";

export default function DemoUIPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brand: "",
    domain: "",
    competitors: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query string
    const params = new URLSearchParams();
    if (formData.brand) params.set('brand', formData.brand);
    if (formData.domain) params.set('domain', formData.domain);
    if (formData.competitors) params.set('competitors', formData.competitors);
    
    // Redirect to demo page with parameters
    router.push(`/demo?${params.toString()}`);
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Visibility Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how your brand appears in AI platforms across the user journey - instant prototype with template data
          </p>
          <div className="mt-4 inline-block bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl px-4 py-2">
            <p className="text-sm font-semibold text-yellow-800">
              ⚡ DEMO MODE: Instant results with template data (no API calls)
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Instant Preview</h3>
            <p className="text-sm text-gray-600">
              See results immediately - no waiting, no API calls needed
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Journey Stages</h3>
            <p className="text-sm text-gray-600">
              Awareness, Consideration, and Decision insights adapted to your brand
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-pink-100">
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Template Data</h3>
            <p className="text-sm text-gray-600">
              Realistic template content customized with your brand information
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Enter Your Brand Information
          </h2>

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
                placeholder="e.g., Nike, Tesla, Coca-Cola"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-2">
                The brand name that will appear throughout the report
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
                placeholder="e.g., nike.com, tesla.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-2">
                Your brand's website (without https://)
              </p>
            </div>

            {/* Competitors */}
            <div>
              <label htmlFor="competitors" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Competitors <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="competitors"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="e.g., Adidas, Puma, Under Armour"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-2">
                Comma-separated list of competitors (up to 3 recommended)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!formData.brand}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                !formData.brand
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
              }`}
            >
              Check AI Visibility
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-sm text-gray-500">
              ⚡ Results appear instantly - this is a demo with template data
            </p>
          </form>
        </div>

        {/* Example Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 text-center">What You'll See</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">📊 Metrics & Scores</h4>
              <ul className="space-y-2 text-sm">
                <li>• Overall AI visibility score (0-100)</li>
                <li>• Mention rate across questions</li>
                <li>• Average position when mentioned</li>
                <li>• Sentiment breakdown</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">🎯 Journey Insights</h4>
              <ul className="space-y-2 text-sm">
                <li>• Awareness stage analysis</li>
                <li>• Consideration comparisons</li>
                <li>• Decision stage recommendations</li>
                <li>• Competitor positioning</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-sm opacity-90">
              All content will be adapted to feature your brand name and competitors
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
