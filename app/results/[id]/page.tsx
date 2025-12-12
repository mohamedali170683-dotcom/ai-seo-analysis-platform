"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Users, ShoppingCart, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

// Sentiment definitions for the report
const SENTIMENT_DEFINITIONS = {
  positive: {
    label: "Positive",
    emoji: "👍",
    color: "green",
    description: "AI recommends or praises your brand with favorable language",
    tone: "Enthusiastic, confident, endorsing",
    keywords: [
      "highly recommend",
      "excellent",
      "best",
      "trusted",
      "top-rated",
      "outstanding",
      "superior",
      "proven",
      "leading",
      "preferred",
    ],
    examples: [
      '"Highly recommended by experts..."',
      '"Excellent choice for your needs..."',
      '"Trusted brand with proven results..."',
    ],
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    color: "gray",
    description: "AI mentions your brand factually without endorsement or criticism",
    tone: "Objective, informative, balanced",
    keywords: ["available", "offers", "includes", "provides", "one option", "can be found", "also", "another"],
    examples: [
      '"One option available at most retailers..."',
      '"Offers various product lines including..."',
      '"Can be found at major stores..."',
    ],
  },
  negative: {
    label: "Negative",
    emoji: "👎",
    color: "red",
    description: "AI expresses concerns, criticisms, or warns against your brand",
    tone: "Cautionary, critical, discouraging",
    keywords: [
      "concerns",
      "issues",
      "not recommended",
      "avoid",
      "problems",
      "controversial",
      "recalls",
      "complaints",
      "inferior",
    ],
    examples: [
      '"Some users have concerns about..."',
      '"Not recommended for certain use cases..."',
      '"May have issues with..."',
    ],
  },
};

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("pending");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setError("No analysis ID provided");
      setLoading(false);
      return;
    }

    // Poll for analysis status and data
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analysis data");
        }

        const data = await response.json();
        setProgress(data.progress || 0);
        setStatus(data.status);

        if (data.status === "completed") {
          clearInterval(pollInterval);
          setReportData(transformAnalysisData(data));
          setLoading(false);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error || "Analysis failed");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching analysis:", err);
        setError(err.message);
        clearInterval(pollInterval);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 animate-pulse">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {status === "running" ? "Analyzing Your Brand..." : "Preparing Analysis..."}
            </h2>
            <p className="text-gray-600 mb-8">
              {status === "running"
                ? "Testing your brand across AI platforms and user journey stages"
                : "Setting up your analysis..."}
            </p>
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div className={progress >= 10 ? "text-green-600 font-semibold" : ""}>
                ✓ Questions Generated
              </div>
              <div className={progress >= 50 ? "text-green-600 font-semibold" : ""}>
                ✓ AI Testing
              </div>
              <div className={progress >= 90 ? "text-green-600 font-semibold" : ""}>
                ✓ Analysis Complete
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Failed</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Collect all recommendations from all stages with safety checks
  const journeyStages = reportData?.journeyStages || [];
  const allRecommendations = journeyStages.map((stage: any) => ({
    stage: stage?.stageLabel || "Unknown",
    stageIcon: stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅",
    recommendation: stage?.recommendation || null,
    visibilityScore: stage?.portrayal?.visibilityScore || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Analysis Complete Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <span className="font-bold text-lg">{reportData.brandOrKeyword} - Velaris Analysis Report</span>
              <div className="text-sm text-green-100">
                {reportData.totalTests} AI responses analyzed across 3 platforms
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-semibold hover:bg-green-50 transition-all"
            >
              New Analysis
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        
        {/* 3 Main Score Boxes */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* Box 1: AI Visibility Score */}
          <div 
            onClick={() => toggleSection("visibility")}
            className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              expandedSection === "visibility" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📊</div>
                <div className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  (reportData.overallScore || 0) >= 70 ? "bg-green-100 text-green-700" :
                  (reportData.overallScore || 0) >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>
                  {(reportData.overallScore || 0) >= 70 ? "Good" : (reportData.overallScore || 0) >= 40 ? "Needs Work" : "Critical"}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">AI Visibility Score</h3>
              <p className="text-sm text-gray-500 mb-4">How AI platforms mention your brand</p>
              <div className={`text-5xl font-bold mb-2 ${
                (reportData.overallScore || 0) >= 70 ? "text-green-600" :
                (reportData.overallScore || 0) >= 40 ? "text-yellow-600" : "text-red-600"
              }`}>
                {reportData.overallScore || 0}<span className="text-2xl text-gray-400">/100</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{reportData.totalQuestions || 0} questions tested</span>
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  Click for details {expandedSection === "visibility" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Technical Score */}
          <div 
            onClick={() => toggleSection("technical")}
            className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              expandedSection === "technical" ? "ring-2 ring-purple-500" : ""
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">🔧</div>
                <div className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  (reportData.websiteAudit?.technicalScore || 0) >= 70 ? "bg-green-100 text-green-700" :
                  (reportData.websiteAudit?.technicalScore || 0) >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>
                  {(reportData.websiteAudit?.technicalScore || 0) >= 70 ? "Good" : 
                   (reportData.websiteAudit?.technicalScore || 0) >= 40 ? "Needs Work" : "Critical"}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Technical SEO Score</h3>
              <p className="text-sm text-gray-500 mb-4">Website optimization for AI crawlers</p>
              <div className={`text-5xl font-bold mb-2 ${
                (reportData.websiteAudit?.technicalScore || 0) >= 70 ? "text-green-600" :
                (reportData.websiteAudit?.technicalScore || 0) >= 40 ? "text-yellow-600" : "text-red-600"
              }`}>
                {reportData.websiteAudit?.technicalScore || "N/A"}<span className="text-2xl text-gray-400">{reportData.websiteAudit ? "/100" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{reportData.websiteAudit ? "Schema & content audit" : "No domain provided"}</span>
                <span className="flex items-center gap-1 text-purple-600 font-medium">
                  {reportData.websiteAudit && <>Click for details {expandedSection === "technical" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</>}
                </span>
              </div>
            </div>
          </div>

          {/* Box 3: Recommendations */}
          <div 
            onClick={() => toggleSection("recommendations")}
            className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              expandedSection === "recommendations" ? "ring-2 ring-amber-500" : ""
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">💡</div>
                <div className="text-xs px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
                  {allRecommendations.length} Actions
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Recommendations</h3>
              <p className="text-sm text-gray-500 mb-4">Actions to improve AI visibility</p>
              <div className="space-y-2">
                {allRecommendations.slice(0, 3).map((rec: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{rec.stageIcon}</span>
                    <span className="text-gray-600 truncate">{rec.stage}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end text-sm text-amber-600 font-medium mt-3">
                Click for details {expandedSection === "recommendations" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Section: AI Visibility Details */}
        {expandedSection === "visibility" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 AI Visibility by Funnel Stage</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* Scoring Methodology */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">How We Calculate Your Score</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-bold text-blue-700">50%</span> Mention Rate
                  <p className="text-blue-600 text-xs">How often AI mentions your brand</p>
                </div>
                <div>
                  <span className="font-bold text-blue-700">30%</span> Position
                  <p className="text-blue-600 text-xs">Where your brand appears (1st is best)</p>
                </div>
                <div>
                  <span className="font-bold text-blue-700">20%</span> Sentiment
                  <p className="text-blue-600 text-xs">How positively you're portrayed</p>
                </div>
              </div>
            </div>

            {/* Journey Stages */}
            <div className="space-y-6">
              {journeyStages.length === 0 && (
                <p className="text-gray-500 text-center py-8">No journey stage data available</p>
              )}
              {journeyStages.map((stage: any, index: number) => (
                <div key={stage?.stage || index} className="border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{stage?.stageLabel || "Unknown Stage"}</h3>
                        <p className="text-sm text-gray-500">{stage?.stageDescription || ""}</p>
                      </div>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl ${
                      (stage?.portrayal?.visibilityScore || 0) >= 70 ? "bg-green-100" :
                      (stage?.portrayal?.visibilityScore || 0) >= 40 ? "bg-yellow-100" : "bg-red-100"
                    }`}>
                      <div className={`text-3xl font-bold ${
                        (stage?.portrayal?.visibilityScore || 0) >= 70 ? "text-green-700" :
                        (stage?.portrayal?.visibilityScore || 0) >= 40 ? "text-yellow-700" : "text-red-700"
                      }`}>
                        {Math.round(stage?.portrayal?.visibilityScore || 0)}%
                      </div>
                      <div className="text-xs text-gray-600">Visibility</div>
                    </div>
                  </div>

                  {/* Stage Metrics */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(stage?.portrayal?.mentionRate || 0)}%</div>
                      <div className="text-xs text-gray-500">Mention Rate</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stage?.portrayal?.averagePosition ? stage.portrayal.averagePosition.toFixed(1) : "N/A"}</div>
                      <div className="text-xs text-gray-500">Avg Position</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{Math.round(stage?.portrayal?.sentiment?.positive || 0)}%</div>
                      <div className="text-xs text-gray-500">Positive</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-600">{stage?.questions?.length || 0}</div>
                      <div className="text-xs text-gray-500">Questions</div>
                    </div>
                  </div>

                  {/* AI Answer Examples */}
                  {stage?.portrayal?.aiAnswerExamples && stage.portrayal.aiAnswerExamples.length > 0 && stage.portrayal.aiAnswerExamples[0] && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Sample AI Response</h4>
                      <div className="text-sm text-gray-600 italic border-l-4 border-blue-400 pl-3">
                        &quot;{(stage.portrayal.aiAnswerExamples[0].excerpt || "").substring(0, 300)}{stage.portrayal.aiAnswerExamples[0].excerpt?.length > 300 ? "..." : ""}&quot;
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        — {stage.portrayal.aiAnswerExamples[0].platform || "AI Platform"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Section: Technical Audit */}
        {expandedSection === "technical" && reportData.websiteAudit && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🔧 Website Technical Audit</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* Schema Markup Status */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Schema Markup Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Organization", has: reportData.websiteAudit.schemas?.hasOrganization },
                  { name: "Product", has: reportData.websiteAudit.schemas?.hasProduct },
                  { name: "FAQ", has: reportData.websiteAudit.schemas?.hasFAQ },
                  { name: "Review", has: reportData.websiteAudit.schemas?.hasReview },
                ].map((schema) => (
                  <div key={schema.name} className={`p-4 rounded-xl text-center ${
                    schema.has ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"
                  }`}>
                    <div className="text-2xl mb-1">{schema.has ? "✅" : "❌"}</div>
                    <div className="font-semibold text-gray-900">{schema.name}</div>
                    <div className="text-xs text-gray-600">{schema.has ? "Found" : "Missing"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Analysis */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Content Analysis</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-700">{reportData.websiteAudit.content?.wordCount || 0}</div>
                  <div className="text-sm text-gray-600">Words on Homepage</div>
                </div>
                <div className={`rounded-xl p-4 ${reportData.websiteAudit.faqContent?.hasFAQSection ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="text-3xl font-bold">{reportData.websiteAudit.faqContent?.hasFAQSection ? "✅" : "❌"}</div>
                  <div className="text-sm text-gray-600">FAQ Section</div>
                </div>
                <div className={`rounded-xl p-4 ${reportData.websiteAudit.robots?.allowsAIBots ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="text-3xl font-bold">{reportData.websiteAudit.robots?.allowsAIBots ? "✅" : "❌"}</div>
                  <div className="text-sm text-gray-600">AI Bots Allowed</div>
                </div>
              </div>
            </div>

            {/* Issues & Recommendations */}
            {reportData.websiteAudit.issues?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Issues Found</h3>
                <div className="space-y-3">
                  {reportData.websiteAudit.issues.map((issue: any, i: number) => (
                    <div key={i} className={`p-4 rounded-lg border-l-4 ${
                      issue.severity === "high" ? "bg-red-50 border-red-500" :
                      issue.severity === "medium" ? "bg-yellow-50 border-yellow-500" : "bg-blue-50 border-blue-500"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          issue.severity === "high" ? "bg-red-200 text-red-800" :
                          issue.severity === "medium" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"
                        }`}>
                          {issue.severity?.toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-900">{issue.issue}</span>
                      </div>
                      <p className="text-sm text-gray-600">{issue.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expanded Section: Recommendations */}
        {expandedSection === "recommendations" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">💡 All Recommendations</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Based on your AI visibility analysis, here are personalized recommendations for each stage of the customer journey.
            </p>

            <div className="space-y-6">
              {allRecommendations.map((rec: any, i: number) => (
                <div key={i} className={`rounded-xl p-6 border-2 ${
                  rec.stage === "Awareness" ? "bg-blue-50 border-blue-200" :
                  rec.stage === "Consideration" ? "bg-purple-50 border-purple-200" : "bg-green-50 border-green-200"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{rec.stageIcon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{rec.stage} Stage</h3>
                      <div className="text-sm text-gray-500">Current visibility: {Math.round(rec.visibilityScore)}%</div>
                    </div>
                  </div>

                  {rec.recommendation && (
                    <div className="space-y-4">
                      {/* Pattern Identified */}
                      {rec.recommendation.commonPattern && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🔍</span>
                            <span className="font-semibold text-gray-900">Pattern Identified</span>
                          </div>
                          <p className="text-gray-600">{rec.recommendation.commonPattern}</p>
                        </div>
                      )}

                      {/* Content Type Needed */}
                      {rec.recommendation.contentType && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📚</span>
                            <span className="font-semibold text-gray-900">Content Type Needed</span>
                          </div>
                          <p className="text-gray-600">{rec.recommendation.contentType}</p>
                        </div>
                      )}

                      {/* Recommended Action */}
                      {rec.recommendation.focusedAction && (
                        <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">✅</span>
                            <span className="font-semibold text-gray-900">Recommended Action</span>
                          </div>
                          <p className="text-gray-700 font-medium">{rec.recommendation.focusedAction}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Technical Recommendations if available */}
            {reportData.websiteAudit?.recommendations?.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 Technical Recommendations</h3>
                <div className="space-y-4">
                  {reportData.websiteAudit.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{rec.title}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          rec.priority === "high" ? "bg-red-100 text-red-700" :
                          rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {rec.priority?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.expectedImpact && (
                        <p className="text-xs text-green-600">Expected impact: {rec.expectedImpact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Transform database analysis data to report format
function transformAnalysisData(data: any) {
  const insights = data.aiInsights || [];
  
  // Extract website audit insight
  const websiteAuditInsight = insights.find((i: any) => i.category === "website_audit");
  const websiteAudit = websiteAuditInsight?.expectedImpact || null;
  
  // Extract journey stage insights
  const journeyStageInsights = insights.filter((i: any) => i.category === "journey_stage");
  
  // Sort by priority (awareness=1, consideration=2, decision=3)
  journeyStageInsights.sort((a: any, b: any) => a.priority - b.priority);

  // Transform journey stages
  const journeyStages = journeyStageInsights.map((insight: any) => {
    const stageData = insight.expectedImpact;
    
    // Map icon names
    const iconMap: any = {
      awareness: "Brain",
      consideration: "Users",
      decision: "ShoppingCart",
    };

    return {
      stage: stageData.stage || insight.title.toLowerCase(),
      stageLabel: stageData.stageLabel || insight.title.split(" ")[0],
      stageDescription: stageData.stageDescription || insight.finding,
      icon: iconMap[stageData.stage] || "Brain",
      color: 
        stageData.stage === "awareness" ? "from-blue-500 to-blue-600" :
        stageData.stage === "consideration" ? "from-purple-500 to-purple-600" :
        "from-pink-500 to-pink-600",
      questions: stageData.questions || [],
      portrayal: stageData.portrayal || {
        mentionRate: 0,
        totalQuestions: 0,
        totalTests: 0,
        totalAnswersAnalyzed: 0,
        visibilityScore: 0,
        averagePosition: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0, dominant: "neutral" },
        aiAnswerExamples: [],
        competitorComparison: [],
      },
      recommendation: stageData.recommendation || {
        commonPattern: insight.finding,
        contentType: insight.aiReasoning,
        focusedAction: insight.actions[0] || "Continue monitoring AI visibility",
      },
    };
  });

  // Calculate overall metrics
  const totalTests = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.totalTests || 0), 0);
  const totalQuestions = journeyStages.reduce((sum: number, stage: any) => sum + (stage.questions?.length || 0), 0);
  
  // Calculate overall scores
  const avgMentionRate = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.mentionRate || 0), 0) / Math.max(journeyStages.length, 1);
  const avgPosition = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.averagePosition || 0), 0) / Math.max(journeyStages.length, 1);
  const avgSentimentPositive = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.sentiment.positive || 0), 0) / Math.max(journeyStages.length, 1);
  const avgSentimentNegative = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.sentiment.negative || 0), 0) / Math.max(journeyStages.length, 1);
  
  // Calculate position score (1st = 100pts, 5th = 20pts)
  const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
  
  // Calculate sentiment score (-100 to +100, normalized to 0-100)
  const sentimentDiff = avgSentimentPositive - avgSentimentNegative;
  const normalizedSentimentScore = Math.max(0, Math.min(100, ((sentimentDiff + 100) / 2)));

  // Overall visibility score with proper weights
  const overallScore = Math.round(
    (avgMentionRate * 0.50) + (positionScore * 0.30) + (normalizedSentimentScore * 0.20)
  );

  const scoringMethodology = {
    mentionRate: {
      weight: 50,
      description: "How often your brand appears in AI responses",
      yourScore: Math.round(avgMentionRate),
      calculation: "(Mentions ÷ Total Tests) × 100",
    },
    averagePosition: {
      weight: 30,
      description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
      yourScore: Math.round(positionScore),
      calculation: "100 - ((Avg Position - 1) × 20)",
    },
    sentiment: {
      weight: 20,
      description: "How positively your brand is portrayed",
      yourScore: Math.round(normalizedSentimentScore),
      calculation: "(Positive% - Negative%) normalized to 0-100",
    },
  };

  return {
    brandOrKeyword: data.brandOrKeyword,
    domain: data.domain,
    overallScore: overallScore,
    totalTests: totalTests || 18, // Default to 18 (9 questions × 2 tests)
    totalQuestions: totalQuestions || 9, // Default to 9
    scoringMethodology,
    journeyStages,
    websiteAudit,
  };
}
