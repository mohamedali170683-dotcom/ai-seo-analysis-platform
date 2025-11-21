"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Download, TrendingUp, Bot, Target, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisResultsPage({ params }: PageProps) {
  const [id, setId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    loadAnalysis();

    // Auto-refresh while analysis is running
    const interval = setInterval(() => {
      if (
        data?.analysis?.status &&
        !["completed", "failed"].includes(data.analysis.status)
      ) {
        loadAnalysis(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, data?.analysis?.status]);

  const loadAnalysis = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch(`/api/analysis/${id}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-500">Loading analysis...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analysis not found
          </h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Start New Analysis
          </Link>
        </div>
      </div>
    );
  }

  // Extract data from the correct structure
  const analysis = data.analysis;
  const stats = analysis.stats || {};
  const platformStats = stats.platformStats || { chatgpt: { tests: 0, mentions: 0, mentionRate: 0 }, gemini: { tests: 0, mentions: 0, mentionRate: 0 } };
  const questions = analysis.discoveredQuestions || [];
  const competitors = analysis.detectedCompetitors || [];
  const insights = analysis.aiInsights || [];

  // In progress view
  if (analysis.status !== "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analyzing {analysis.brandOrKeyword}
              </h1>
              <p className="text-gray-600">
                This usually takes 5-10 minutes. You can leave and come back!
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="capitalize">{analysis.status}</span>
                <span>{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>

            {/* Current Step */}
            {analysis.currentStep && (
              <div className="text-center text-sm text-gray-600 mb-6">
                {analysis.currentStep}
              </div>
            )}

            {/* Status Steps */}
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${analysis.progress >= 10 ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${analysis.progress >= 10 ? "bg-green-600" : "bg-gray-400"}`}>
                  {analysis.progress >= 10 ? "✓" : "1"}
                </div>
                <span className="text-sm font-medium">Discovering relevant questions</span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${analysis.progress >= 20 ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${analysis.progress >= 20 ? "bg-green-600" : "bg-gray-400"}`}>
                  {analysis.progress >= 20 ? "✓" : "2"}
                </div>
                <span className="text-sm font-medium">Detecting competitors</span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${analysis.progress >= 70 ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${analysis.progress >= 70 ? "bg-green-600" : "bg-gray-400"}`}>
                  {analysis.progress >= 70 ? "✓" : "3"}
                </div>
                <span className="text-sm font-medium">Testing with ChatGPT & Gemini</span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${analysis.progress >= 100 ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${analysis.progress >= 100 ? "bg-green-600" : "bg-gray-400"}`}>
                  {analysis.progress >= 100 ? "✓" : "4"}
                </div>
                <span className="text-sm font-medium">AI analyzing patterns by journey stage</span>
              </div>
            </div>

            {refreshing && (
              <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Auto-refreshing...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Completed analysis view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {analysis.brandOrKeyword}
              </h1>
              <p className="text-gray-600">{analysis.domain}</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 text-white mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-2 opacity-90">
                AI Visibility Score
              </h2>
              <div className="text-7xl font-bold mb-4">
                {stats.visibilityScore?.toFixed(0) || "N/A"}
                <span className="text-3xl opacity-75">/100</span>
              </div>
              <p className="text-blue-100">
                Based on {stats.totalTests || 0} AI queries across ChatGPT and Gemini
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-sm opacity-90 mb-1">Mention Rate</div>
                <div className="text-3xl font-bold">
                  {stats.overallMentionRate?.toFixed(1) || 0}%
                </div>
                <div className="text-sm opacity-75">
                  {stats.totalMentions || 0} of {stats.totalTests || 0} responses
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-sm opacity-90 mb-1">Average Position</div>
                <div className="text-3xl font-bold">
                  #{stats.avgPosition ? stats.avgPosition.toFixed(1) : "N/A"}
                </div>
                <div className="text-sm opacity-75">
                  When mentioned in responses
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">ChatGPT Performance</h3>
                <p className="text-sm text-gray-600">{platformStats.chatgpt.tests} tests</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Mention Rate</span>
                  <span className="font-bold">{platformStats.chatgpt.mentionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${platformStats.chatgpt.mentionRate}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {platformStats.chatgpt.mentions} of {platformStats.chatgpt.tests} responses mentioned your brand
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Gemini Performance</h3>
                <p className="text-sm text-gray-600">{platformStats.gemini.tests} tests</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Mention Rate</span>
                  <span className="font-bold">{platformStats.gemini.mentionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${platformStats.gemini.mentionRate}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {platformStats.gemini.mentions} of {platformStats.gemini.tests} responses mentioned your brand
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Insights - Journey Stage Based */}
        {insights && insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              AI Visibility Insights by User Journey Stage
            </h2>

            <div className="space-y-6">
              {insights.map((insight: any, index: number) => (
                <div
                  key={insight.id}
                  className={`border-l-4 p-6 rounded-r-lg ${
                    insight.priority === 1
                      ? "border-red-500 bg-red-50"
                      : insight.priority === 2
                      ? "border-orange-500 bg-orange-50"
                      : "border-yellow-500 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            insight.priority === 1
                              ? "bg-red-600 text-white"
                              : insight.priority === 2
                              ? "bg-orange-600 text-white"
                              : "bg-yellow-600 text-white"
                          }`}
                        >
                          PRIORITY {insight.priority}
                        </span>
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {insight.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {insight.title}
                      </h3>
                    </div>
                    {insight.correlationScore && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Correlation</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {insight.correlationScore}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        📊 Finding:
                      </div>
                      <p className="text-gray-800">{insight.finding}</p>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        📈 Data Evidence:
                      </div>
                      <p className="text-gray-700 text-sm">{insight.dataEvidence}</p>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        🧠 AI Analysis:
                      </div>
                      <p className="text-gray-700 text-sm">{insight.aiReasoning}</p>
                    </div>

                    {insight.actions && insight.actions.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          ✅ Recommended Actions:
                        </div>
                        <ul className="space-y-2">
                          {insight.actions.map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                              <span className="text-green-600 font-bold">{i + 1}.</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Effort</div>
                        <div className="font-semibold capitalize">{insight.effort}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Timeline</div>
                        <div className="font-semibold">{insight.timeline}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Confidence</div>
                        <div className="font-semibold capitalize">{insight.confidence}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discovered Questions */}
        {questions && questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              Questions Analyzed ({questions.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((q: any) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{q.question}</div>
                    <div className="text-sm text-gray-600 mt-1 flex gap-4">
                      <span>
                        📊 {q.searchVolume?.toLocaleString() || "N/A"} searches/mo
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          q.intent === "commercial"
                            ? "bg-green-100 text-green-700"
                            : q.intent === "informational"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {q.intent}
                      </span>
                      {q.category && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                          {q.category} stage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitors */}
        {competitors && competitors.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Detected Competitors</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {competitors.map((comp: any) => (
                <div key={comp.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">{comp.competitorName}</div>
                  {comp.domain && (
                    <div className="text-sm text-gray-600">{comp.domain}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
