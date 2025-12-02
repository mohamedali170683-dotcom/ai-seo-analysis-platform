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
      backLink="/"
    />
  );
}

// Transform database analysis data to report format
function transformAnalysisData(data: any) {
  const insights = data.aiInsights || [];
  
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
  };
}
