"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JourneyStageReport } from "@/components/journey-stage-report";
import { Brain, Users, ShoppingCart } from "lucide-react";

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

  return (
    <div>
      {/* Analysis Complete Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-semibold">Analysis Complete</span>
            <span className="text-green-100">|</span>
            <span className="text-sm text-green-100">
              {reportData.totalTests} AI responses analyzed across 3 platforms
            </span>
          </div>
          <a
            href="/analyze"
            className="px-4 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-all"
          >
            Run Another Analysis
          </a>
        </div>
      </div>
      
      <JourneyStageReport
        brandName={reportData.brandOrKeyword}
        domain={reportData.domain}
        overallScore={reportData.overallScore}
        totalTests={reportData.totalTests}
        totalQuestions={reportData.totalQuestions}
        scoringMethodology={reportData.scoringMethodology}
        sentimentDefinitions={SENTIMENT_DEFINITIONS}
        journeyStages={reportData.journeyStages}
        showHeader={true}
        backLink="/dashboard"
      />
      
      {/* Website Technical Audit Section */}
      {reportData.websiteAudit && (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  🔧 Website Technical Audit
                </h2>
                <p className="text-gray-600 mt-1">
                  Technical factors that impact your AI visibility
                </p>
              </div>
              <div className={`text-center p-4 rounded-xl ${
                reportData.websiteAudit.technicalScore >= 70 ? "bg-green-100" :
                reportData.websiteAudit.technicalScore >= 40 ? "bg-yellow-100" : "bg-red-100"
              }`}>
                <div className={`text-4xl font-bold ${
                  reportData.websiteAudit.technicalScore >= 70 ? "text-green-700" :
                  reportData.websiteAudit.technicalScore >= 40 ? "text-yellow-700" : "text-red-700"
                }`}>
                  {reportData.websiteAudit.technicalScore}/100
                </div>
                <div className="text-sm text-gray-600">Tech Score</div>
              </div>
            </div>

            {/* Schema Markup Status */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Schema Markup Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Organization", has: reportData.websiteAudit.schemas?.hasOrganization },
                  { name: "Product", has: reportData.websiteAudit.schemas?.hasProduct },
                  { name: "FAQ", has: reportData.websiteAudit.schemas?.hasFAQ },
                  { name: "Review", has: reportData.websiteAudit.schemas?.hasReview },
                ].map((schema) => (
                  <div key={schema.name} className={`p-4 rounded-xl text-center ${
                    schema.has ? "bg-green-50 border-2 border-green-200" : "bg-gray-50 border-2 border-gray-200"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Content Analysis</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-700">{reportData.websiteAudit.content?.wordCount || 0}</div>
                  <div className="text-sm text-gray-600">Words on Homepage</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {(reportData.websiteAudit.content?.wordCount || 0) >= 1500 ? "✓ Good depth" : 
                     (reportData.websiteAudit.content?.wordCount || 0) >= 500 ? "⚠️ Could be deeper" : "❌ Too thin"}
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${
                  reportData.websiteAudit.faqContent?.hasFAQSection ? "bg-green-50" : "bg-red-50"
                }`}>
                  <div className="text-3xl font-bold">
                    {reportData.websiteAudit.faqContent?.hasFAQSection ? "✅" : "❌"}
                  </div>
                  <div className="text-sm text-gray-600">FAQ Section</div>
                  <div className="text-xs mt-1">
                    {reportData.websiteAudit.faqContent?.hasFAQSection 
                      ? `${reportData.websiteAudit.faqContent.questions?.length || 0} questions found` 
                      : "No FAQ content detected"}
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${
                  reportData.websiteAudit.robotsAllowsAI ? "bg-green-50" : "bg-red-50"
                }`}>
                  <div className="text-3xl font-bold">
                    {reportData.websiteAudit.robotsAllowsAI ? "✅" : "🚫"}
                  </div>
                  <div className="text-sm text-gray-600">AI Bot Access</div>
                  <div className="text-xs mt-1">
                    {reportData.websiteAudit.robotsAllowsAI 
                      ? "AI crawlers allowed" 
                      : "AI crawlers may be blocked!"}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Recommendations */}
            {reportData.websiteAudit.recommendations && reportData.websiteAudit.recommendations.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Technical Recommendations</h3>
                <div className="space-y-4">
                  {reportData.websiteAudit.recommendations.slice(0, 5).map((rec: any, index: number) => (
                    <div key={index} className={`rounded-xl p-5 border-l-4 ${
                      rec.priority === "high" ? "bg-red-50 border-red-500" :
                      rec.priority === "medium" ? "bg-yellow-50 border-yellow-500" :
                      "bg-blue-50 border-blue-500"
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{rec.recommendation}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          rec.priority === "high" ? "bg-red-200 text-red-800" :
                          rec.priority === "medium" ? "bg-yellow-200 text-yellow-800" :
                          "bg-blue-200 text-blue-800"
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{rec.rationale}</p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 font-semibold hover:text-blue-800">
                          View Implementation Guide
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                          <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">
                            {rec.implementationGuide}
                          </pre>
                          <div className="mt-2 text-xs text-green-700 font-semibold">
                            Expected Impact: {rec.expectedImpact}
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {reportData.websiteAudit.issues && reportData.websiteAudit.issues.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Issues Detected</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {reportData.websiteAudit.issues.map((issue: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg flex items-start gap-3 ${
                      issue.severity === "critical" ? "bg-red-50" :
                      issue.severity === "warning" ? "bg-yellow-50" : "bg-blue-50"
                    }`}>
                      <span className="text-xl">
                        {issue.severity === "critical" ? "🔴" :
                         issue.severity === "warning" ? "🟡" : "🔵"}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900">{issue.issue}</div>
                        <div className="text-sm text-gray-600">{issue.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
