"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, TrendingUp, DollarSign, Target } from "lucide-react";

interface AIOverviewResult {
  hasAIOverview: boolean;
  position?: number;
  searchIntent?: string;
  estimatedTraffic?: number;
  competitiveDifficulty?: string;
}

export default function AIOverviewTestPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIOverviewResult | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai-overview/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to check AI Overview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Overview Detection
              </h1>
              <p className="text-gray-600">
                Check if a keyword triggers Google AI Overview (powered by DataForSEO)
              </p>
            </div>
          </div>

          <form onSubmit={handleCheck} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Enter keyword (e.g., best running shoes)"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Check
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                <h2 className="text-xl font-bold mb-4">Analysis Results</h2>

                {/* AI Overview Status */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">AI Overview Status</div>
                      <div className="text-2xl font-bold">
                        {result.hasAIOverview ? (
                          <span className="text-green-600">✓ AI Overview Present</span>
                        ) : (
                          <span className="text-gray-600">○ No AI Overview</span>
                        )}
                      </div>
                    </div>
                    {result.hasAIOverview && result.position && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Position</div>
                        <div className="text-2xl font-bold text-blue-600">
                          #{result.position}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Keyword Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Search className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Search Volume
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.searchVolume?.toLocaleString() || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">monthly searches</div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Target className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Competition
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.competition
                        ? `${(result.competition * 100).toFixed(0)}%`
                        : "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.competition > 0.7
                        ? "High"
                        : result.competition > 0.4
                        ? "Medium"
                        : "Low"}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-600">CPC</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${result.cpc?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Google Ads CPC</div>
                  </div>
                </div>

                {result.hasAIOverview && result.contentLength && (
                  <div className="bg-white rounded-lg p-4 mt-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      AI Overview Content Length
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {result.contentLength} characters
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-3 text-yellow-900">
                  💡 Recommendations
                </h3>
                <ul className="space-y-2 text-yellow-900">
                  {result.hasAIOverview ? (
                    <>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          This keyword triggers AI Overview, which may reduce organic
                          click-through rate
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Consider optimizing for long-tail variations or related
                          questions
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Focus on creating comprehensive content to be cited in AI
                          Overview
                        </span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>
                          No AI Overview detected - traditional SEO still effective
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Target this keyword for organic traffic growth</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-bold mb-3">About AI Overview Detection</h3>
          <p className="text-gray-700 mb-2">
            This tool uses DataForSEO API to check real-time SERP data and detect:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Whether Google shows an AI Overview for your keyword</li>
            <li>Position of the AI Overview in search results</li>
            <li>Search volume and keyword difficulty</li>
            <li>Cost-per-click (CPC) for Google Ads</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
