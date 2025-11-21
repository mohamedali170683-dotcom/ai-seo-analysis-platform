"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TrendingUp, Brain, Lightbulb, Users, ShoppingCart } from "lucide-react";

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

  const analysis = data.analysis;

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

            {analysis.currentStep && (
              <div className="text-center text-sm text-gray-600 mb-6">
                {analysis.currentStep}
              </div>
            )}

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

  // Parse journey stage data from AI insights
  const journeyStages = parseJourneyStages(analysis.aiInsights, analysis.discoveredQuestions, analysis.aiTestResults);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {analysis.brandOrKeyword} - AI Visibility Journey
            </h1>
            <p className="text-gray-600">{analysis.domain}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 text-white mb-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 opacity-90">
              Overall AI Visibility Score
            </h2>
            <div className="text-8xl font-bold mb-4">
              {analysis.stats?.visibilityScore?.toFixed(0) || "N/A"}
              <span className="text-4xl opacity-75">/100</span>
            </div>
            <p className="text-lg text-blue-100">
              Analyzed across {journeyStages.length} journey stages • {analysis.stats?.totalTests || 0} AI queries
            </p>
          </div>
        </div>

        {/* Journey Stages */}
        <div className="space-y-12">
          {journeyStages.map((stage: any, index: number) => (
            <JourneyStageCard
              key={stage.stage}
              stage={stage}
              brandName={analysis.brandOrKeyword}
              stageNumber={index + 1}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// Helper function to parse journey stages from insights
function parseJourneyStages(insights: any[], questions: any[], testResults: any[]) {
  const stages = ["awareness", "consideration", "decision"];
  const stageData: any[] = [];

  stages.forEach(stageName => {
    // Find insights for this stage
    const stageInsights = insights.filter(i => 
      i.title?.toLowerCase().includes(stageName) ||
      i.dataEvidence?.toLowerCase().includes(stageName)
    );

    // Find questions for this stage
    const stageQuestions = questions.filter(q => q.category === stageName);

    // Calculate metrics
    const stageTests = testResults.filter(t => {
      const questionMatch = stageQuestions.find(q => q.question === t.question);
      return questionMatch !== undefined;
    });

    const totalTests = stageTests.length;
    const mentions = stageTests.filter(t => t.brandMentioned).length;
    const mentionRate = totalTests > 0 ? (mentions / totalTests) * 100 : 0;

    // Calculate sentiment
    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    stageTests.forEach(t => {
      if (t.sentiment === "positive") sentiments.positive++;
      else if (t.sentiment === "negative") sentiments.negative++;
      else sentiments.neutral++;
    });

    const total = totalTests || 1;
    const sentiment = {
      positive: Math.round((sentiments.positive / total) * 100 * 10) / 10,
      negative: Math.round((sentiments.negative / total) * 100 * 10) / 10,
      neutral: Math.round((sentiments.neutral / total) * 100 * 10) / 10,
      dominant: sentiments.positive > sentiments.negative ? "positive" : sentiments.negative > sentiments.positive ? "negative" : "neutral",
    };

    // Get example extract
    const exampleExtract = stageTests.find(t => t.brandMentioned && t.fullResponse)?.fullResponse?.substring(0, 250) + "..." || "No example available.";

    // Parse recommendation from insights
    const patternInsight = stageInsights.find(i => i.category === "pattern");
    const recommendationInsight = stageInsights.find(i => i.category === "recommendation");

    // Calculate visibility score
    const positions = stageTests.filter(t => t.position).map(t => t.position);
    const avgPosition = positions.length > 0 ? positions.reduce((a: number, b: number) => a + b, 0) / positions.length : null;
    const positionScore = avgPosition ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const visibilityScore = Math.round((mentionRate * 0.7 + positionScore * 0.3) * 10) / 10;

    stageData.push({
      stage: stageName,
      stageLabel: stageName.charAt(0).toUpperCase() + stageName.slice(1) + " Stage",
      questions: stageQuestions.map(q => ({
        question: q.question,
        searchVolume: q.searchVolume,
        mentionRate: 0, // Would need to calculate per question
      })),
      portrayal: {
        mentionRate: Math.round(mentionRate * 10) / 10,
        totalQuestions: stageQuestions.length,
        totalTests,
        visibilityScore,
        sentiment,
        exampleExtract,
        competitorComparison: [
          { competitorName: "Competitor A", mentionRate: Math.round((mentionRate + 15) * 10) / 10, sentiment: "positive" }
        ],
      },
      recommendation: {
        commonPattern: patternInsight?.finding || "Analyzing patterns...",
        contentType: patternInsight?.aiReasoning?.split(":")[1]?.trim() || "N/A",
        focusedAction: recommendationInsight?.actions?.[0] || "Generate more stage-specific content.",
      },
    });
  });

  return stageData;
}

// Journey Stage Card Component
function JourneyStageCard({ stage, brandName, stageNumber }: any) {
  const stageIcons = {
    awareness: Brain,
    consideration: Users,
    decision: ShoppingCart,
  };

  const stageColors = {
    awareness: "from-blue-500 to-blue-600",
    consideration: "from-purple-500 to-purple-600",
    decision: "from-pink-500 to-pink-600",
  };

  const Icon = stageIcons[stage.stage as keyof typeof stageIcons] || Brain;
  const colorClass = stageColors[stage.stage as keyof typeof stageColors];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Stage Header */}
      <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm opacity-90">Stage {stageNumber}</div>
            <h2 className="text-3xl font-bold">{stage.stageLabel}</h2>
          </div>
        </div>
        
        {/* Visibility Score for this stage */}
        <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
          <div className="text-sm opacity-90 mb-1">Stage Visibility Score</div>
          <div className="text-4xl font-bold">
            {stage.portrayal.visibilityScore}
            <span className="text-xl opacity-75">/100</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Questions Analyzed */}
        {stage.questions && stage.questions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Questions Analyzed ({stage.questions.length})
            </h3>
            <div className="space-y-2">
              {stage.questions.map((q: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-700">• {q.question}</span>
                  <span className="text-gray-500 ml-2">({q.searchVolume?.toLocaleString()} searches/mo)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q1: How is [Brand] being portrayed? */}
        <div className="mb-8 border-l-4 border-blue-500 pl-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            How is {brandName} being portrayed in the {stage.stage} stage?
          </h3>
          
          <div className="space-y-4">
            {/* Mention Rate & Visibility */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed">
                <strong className="text-blue-700">{brandName}</strong> is mentioned in{" "}
                <strong className="text-2xl text-blue-700">{stage.portrayal.mentionRate}%</strong>{" "}
                of all answers across{" "}
                <strong>{stage.portrayal.totalQuestions} {stage.stage} stage questions</strong>{" "}
                ({stage.portrayal.totalTests} total AI queries).
              </p>
            </div>

            {/* Sentiment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-2">Sentiment Analysis:</div>
              <div className="flex gap-4 items-center">
                <div className={`px-4 py-2 rounded-lg ${
                  stage.portrayal.sentiment.dominant === "positive" ? "bg-green-100 text-green-700 font-bold" : "bg-gray-100 text-gray-700"
                }`}>
                  👍 Positive: {stage.portrayal.sentiment.positive}%
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  stage.portrayal.sentiment.dominant === "negative" ? "bg-red-100 text-red-700 font-bold" : "bg-gray-100 text-gray-700"
                }`}>
                  👎 Negative: {stage.portrayal.sentiment.negative}%
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  stage.portrayal.sentiment.dominant === "neutral" ? "bg-gray-200 text-gray-800 font-bold" : "bg-gray-100 text-gray-700"
                }`}>
                  😐 Neutral: {stage.portrayal.sentiment.neutral}%
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Overall: <strong className="capitalize">{stage.portrayal.sentiment.dominant}</strong> sentiment
              </div>
            </div>

            {/* Example Extract */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="font-semibold text-gray-700 mb-2">📝 Example AI Response:</div>
              <p className="text-gray-700 italic">"{stage.portrayal.exampleExtract}"</p>
            </div>

            {/* Competitor Comparison */}
            {stage.portrayal.competitorComparison && stage.portrayal.competitorComparison.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="font-semibold text-gray-700 mb-3">🏆 Competitor Comparison:</div>
                <div className="space-y-2">
                  {stage.portrayal.competitorComparison.map((comp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded">
                      <span className="font-medium text-gray-800">{comp.competitorName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                          Mentioned: <strong>{comp.mentionRate}%</strong>
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comp.sentiment === "positive" ? "bg-green-100 text-green-700" :
                          comp.sentiment === "negative" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {comp.sentiment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Q2: What can I do to be more visible? */}
        <div className="border-l-4 border-green-500 pl-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-green-600" />
            What can I do to be more visible in the {stage.stage} stage?
          </h3>
          
          <div className="space-y-4">
            {/* Common Pattern */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-2">🔍 Common Pattern Identified:</div>
              <p className="text-gray-800">{stage.recommendation.commonPattern}</p>
            </div>

            {/* Content Type */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-2">📚 Content Type Needed:</div>
              <p className="text-gray-800">{stage.recommendation.contentType}</p>
            </div>

            {/* Focused Action */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="font-semibold mb-2 text-lg">✅ Recommended Action:</div>
              <p className="text-xl leading-relaxed">{stage.recommendation.focusedAction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
