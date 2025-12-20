"use client";

import { ArrowLeft, Download, Brain, Users, ShoppingCart, Info, CheckCircle2, BarChart3, ChevronDown } from "lucide-react";
import { useState } from "react";

interface JourneyStageReportProps {
  brandName: string;
  domain?: string;
  overallScore: number;
  totalTests: number;
  totalQuestions: number;
  platformBreakdown?: Record<string, number>; // e.g., { "ChatGPT": 10, "Gemini": 10 }
  scoringMethodology?: {
    mentionRate: { weight: number; description: string; yourScore: number; calculation: string };
    averagePosition: { weight: number; description: string; yourScore: number; calculation: string };
    sentiment: { weight: number; description: string; yourScore: number; calculation: string };
  };
  sentimentDefinitions?: any;
  journeyStages: any[];
  showHeader?: boolean;
  backLink?: string;
}

export function JourneyStageReport({
  brandName,
  domain,
  overallScore,
  totalTests,
  totalQuestions,
  platformBreakdown,
  scoringMethodology,
  sentimentDefinitions,
  journeyStages,
  showHeader = true,
  backLink = "/",
}: JourneyStageReportProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const toggleStage = (stage: string) => {
    setExpandedStage(expandedStage === stage ? null : stage);
  };

  // Default scoring methodology if not provided
  const defaultScoringMethodology = {
    mentionRate: {
      weight: 50,
      description: "How often your brand appears in AI responses",
      yourScore: Math.round(overallScore * 0.5),
      calculation: "(Mentions ÷ Total Tests) × 100",
    },
    averagePosition: {
      weight: 30,
      description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
      yourScore: Math.round(overallScore * 0.3),
      calculation: "100 - ((Avg Position - 1) × 20)",
    },
    sentiment: {
      weight: 20,
      description: "How positively your brand is portrayed",
      yourScore: Math.round(overallScore * 0.2),
      calculation: "(Positive% - Negative%) normalized to 0-100",
    },
  };

  const methodology = scoringMethodology || defaultScoringMethodology;

  // Default sentiment definitions
  const defaultSentimentDefinitions = {
    positive: {
      label: "Positive",
      emoji: "👍",
      color: "green",
      description: "AI recommends or praises your brand with favorable language",
      tone: "Enthusiastic, confident, endorsing",
      keywords: ["highly recommend", "excellent", "best", "trusted", "top-rated"],
      examples: ['"Highly recommended by experts..."', '"Excellent choice for..."'],
    },
    neutral: {
      label: "Neutral",
      emoji: "😐",
      color: "gray",
      description: "AI mentions your brand factually without endorsement or criticism",
      tone: "Objective, informative, balanced",
      keywords: ["available", "offers", "includes", "provides", "one option"],
      examples: ['"One option available at most retailers..."'],
    },
    negative: {
      label: "Negative",
      emoji: "👎",
      color: "red",
      description: "AI expresses concerns, criticisms, or warns against your brand",
      tone: "Cautionary, critical, discouraging",
      keywords: ["concerns", "issues", "not recommended", "avoid", "problems"],
      examples: ['"Some users have concerns about..."'],
    },
  };

  const sentimentDefs = sentimentDefinitions || defaultSentimentDefinitions;

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <a href={backLink} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </a>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {brandName} - Velaris Analysis Report
                </h1>
                {domain && <p className="text-gray-600 mt-1">{domain}</p>}
              </div>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 print:hidden"
              >
                <Download className="w-4 h-4" />
                Print / Export PDF
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Analysis Effort Banner */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 text-white text-center mb-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-5xl font-bold mb-2">{totalTests}</div>
              <div className="text-sm font-semibold opacity-90">AI Responses Analyzed</div>
              <div className="text-xs opacity-75 mt-1">Across Multiple Platforms</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-5xl font-bold mb-2">{totalQuestions}</div>
              <div className="text-sm font-semibold opacity-90">Questions Tested</div>
              <div className="text-xs opacity-75 mt-1">Covering All Journey Stages</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-5xl font-bold mb-2">{journeyStages.length}</div>
              <div className="text-sm font-semibold opacity-90">Journey Stages</div>
              <div className="text-xs opacity-75 mt-1">Awareness • Consideration • Decision</div>
            </div>
          </div>
          
          {/* Platform Breakdown */}
          {platformBreakdown && Object.keys(platformBreakdown).length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm font-semibold text-white opacity-90 mb-3 text-center">
                🤖 AI Platforms Tested
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {Object.entries(platformBreakdown).map(([platform, count]) => (
                  <div 
                    key={platform} 
                    className="bg-white bg-opacity-20 rounded-lg px-4 py-2 flex items-center gap-2"
                  >
                    <span className="text-xl">
                      {platform === "ChatGPT" && "🟢"}
                      {platform === "Gemini" && "🔵"}
                      {platform === "Copilot" && "🟣"}
                      {platform === "Perplexity" && "🟠"}
                    </span>
                    <span className="font-semibold text-white">{platform}</span>
                    <span className="bg-white bg-opacity-30 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {count} responses
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 text-white mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold mb-6 opacity-90">Overall AI Visibility Score</h2>
            <div className="text-9xl font-bold mb-6">
              {overallScore}
              <span className="text-5xl opacity-75">/100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Info className="w-5 h-5" />
              How This Score is Calculated:
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(methodology).map(([key, data]) => (
                <div key={key} className="bg-white bg-opacity-10 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-lg">{data.weight}%</div>
                    <div className="text-3xl font-bold">{data.yourScore}</div>
                  </div>
                  <div className="text-sm opacity-90 mb-2 font-semibold capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-xs opacity-75 mb-2">{data.description}</div>
                  <div className="text-xs font-mono bg-black bg-opacity-20 px-2 py-1 rounded">
                    {data.calculation}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center text-sm opacity-90">
              <strong>Final Score = </strong> (Mention Rate × 0.50) + (Position Score × 0.30) +
              (Sentiment Score × 0.20) = <strong className="text-xl">{overallScore}</strong>
            </div>
          </div>
        </div>

        {/* Visual User Journey Map */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Your Brand's AI Journey
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Click on any stage to see detailed visibility analysis
          </p>
          <div className="relative">
            {/* Journey Line */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transform -translate-y-1/2 hidden md:block"></div>

            {/* Journey Stages */}
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {journeyStages.map((stage, index) => {
                const iconMap: any = {
                  Brain: Brain,
                  Users: Users,
                  ShoppingCart: ShoppingCart,
                };
                const Icon = iconMap[stage.icon] || Brain;
                const isExpanded = expandedStage === stage.stage;
                
                return (
                  <div key={stage.stage} className="text-center">
                    <div
                      className={`bg-gradient-to-br ${stage.color} w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-white`}
                    >
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <div
                      className={`bg-white rounded-xl p-4 shadow-lg border-2 transition-all cursor-pointer hover:shadow-2xl ${
                        isExpanded ? "border-blue-500 scale-105" : "border-gray-100"
                      }`}
                    >
                      <div className="text-sm text-gray-500 font-semibold mb-1">STAGE {index + 1}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{stage.stageLabel}</h3>
                      <p className="text-sm text-gray-600 mb-4">{stage.stageDescription}</p>
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-3xl font-bold text-gray-900">
                          {stage.portrayal.visibilityScore}
                        </div>
                        <div className="text-xs text-gray-600">Visibility Score</div>
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        {stage.portrayal.mentionRate}% mention rate • {stage.portrayal.totalAnswersAnalyzed}{" "}
                        responses analyzed
                      </div>
                      <button
                        onClick={() => toggleStage(stage.stage)}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                          isExpanded
                            ? "bg-gray-700 text-white hover:bg-gray-800 border-2 border-gray-800"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-2 border-blue-700"
                        }`}
                      >
                        {isExpanded ? "Hide Details" : `See ${stage.stageLabel} Details`}
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sentiment Guide */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-xl p-8 mb-12 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            📊 Understanding Sentiment Analysis
          </h2>
          <p className="text-center text-gray-600 mb-8">
            How we evaluate whether AI responses are favorable, neutral, or critical of your brand
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(sentimentDefs).map(([key, data]: [string, any]) => (
              <div
                key={key}
                className={`bg-white rounded-xl p-6 border-4 ${
                  data.color === "green"
                    ? "border-green-200"
                    : data.color === "red"
                    ? "border-red-200"
                    : "border-gray-200"
                }`}
              >
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{data.emoji}</div>
                  <h3
                    className={`text-2xl font-bold ${
                      data.color === "green"
                        ? "text-green-700"
                        : data.color === "red"
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {data.label}
                  </h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">{data.description}</p>

                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-semibold text-blue-900 mb-2">Tone of Voice:</div>
                  <div className="text-xs text-blue-800 italic">{data.tone}</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-semibold text-purple-900 mb-2">Key Words & Phrases:</div>
                  <div className="flex flex-wrap gap-1">
                    {data.keywords.slice(0, 5).map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded-full ${
                          data.color === "green"
                            ? "bg-green-100 text-green-700"
                            : data.color === "red"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Example Phrases:</div>
                  {data.examples.slice(0, 2).map((example: string, i: number) => (
                    <div key={i} className="text-xs text-gray-700 mb-1 italic">
                      • {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Stages Detail */}
        <div className="space-y-12">
          {journeyStages.map((stage, index) =>
            expandedStage === stage.stage ? (
              <JourneyStageDetailCard
                key={stage.stage}
                stage={stage}
                brandName={brandName}
                stageNumber={index + 1}
              />
            ) : null
          )}
        </div>
      </main>
    </div>
  );
}

// Journey Stage Detail Card Component
function JourneyStageDetailCard({ stage, brandName, stageNumber }: any) {
  const iconMap: any = {
    Brain: Brain,
    Users: Users,
    ShoppingCart: ShoppingCart,
  };
  const Icon = iconMap[stage.icon] || Brain;

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">
      {/* Stage Header */}
      <div className={`bg-gradient-to-r ${stage.color} p-8 text-white`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Icon className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <div className="text-sm opacity-90 font-semibold">JOURNEY STAGE {stageNumber}</div>
            <h2 className="text-4xl font-bold mb-1">{stage.stageLabel}</h2>
            <p className="text-lg opacity-90">{stage.stageDescription}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
            <div className="text-5xl font-bold">{stage.portrayal.visibilityScore}</div>
            <div className="text-sm opacity-90">Score</div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Questions + Statistical Significance */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Questions Analyzed</h3>
            <div className="bg-green-100 border-2 border-green-300 rounded-xl px-4 py-2">
              <div className="text-xs text-green-700 font-semibold">STATISTICALLY SIGNIFICANT</div>
              <div className="text-2xl font-bold text-green-900">
                {stage.portrayal.totalAnswersAnalyzed} responses
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {stage.questions.map((q: any, i: number) => {
              // Check if question contains brand name (case-insensitive)
              const isBrandQuestion = q.type === "brand" || 
                (brandName && q.question?.toLowerCase().includes(brandName.toLowerCase()));
              
              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 border-2 ${
                    isBrandQuestion 
                      ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200" 
                      : "bg-gradient-to-br from-blue-50 to-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-base font-semibold text-gray-900">{q.question}</div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      isBrandQuestion 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {isBrandQuestion ? "Brand Q" : "Category Q"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {q.searchVolume > 0 ? `📊 ${q.searchVolume?.toLocaleString()}/mo` : "🎯 Strategic"}
                    </span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {q.answersAnalyzed} AI responses
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-200"></div>
              <span><strong>Brand Q:</strong> Includes brand name (higher mention expected)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-200"></div>
              <span><strong>Category Q:</strong> Generic query (true organic visibility)</span>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-10"></div>

        {/* Q1: Portrayal */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl mb-8 shadow-lg">
            <h3 className="text-3xl font-bold flex items-center gap-3">
              <div className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              How is {brandName} being portrayed in the {stage.stage} stage?
            </h3>
          </div>

          <div className="space-y-8">
            {/* Mention Rate & Position */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                <div className="text-sm font-semibold text-blue-700 mb-2">MENTION RATE</div>
                <div className="text-6xl font-bold text-blue-900 mb-2">{stage.portrayal.mentionRate}%</div>
                <p className="text-gray-700 text-sm">
                  {brandName} appears in{" "}
                  <strong>
                    {Math.round(
                      (stage.portrayal.totalAnswersAnalyzed * stage.portrayal.mentionRate) / 100
                    )}{" "}
                    out of {stage.portrayal.totalAnswersAnalyzed}
                  </strong>{" "}
                  AI responses
                </p>
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>📊 Note:</strong> Questions that include your brand name naturally have higher mention rates. 
                    Category questions (without brand name) better reflect organic AI visibility.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
                <div className="text-sm font-semibold text-purple-700 mb-2">AVERAGE POSITION</div>
                <div className="text-6xl font-bold text-purple-900 mb-2">
                  #{stage.portrayal.averagePosition || "N/A"}
                </div>
                <p className="text-gray-700 text-sm">
                  When mentioned, {brandName} appears as the{" "}
                  <strong>
                    {stage.portrayal.averagePosition === 1
                      ? "1st"
                      : stage.portrayal.averagePosition === 2
                      ? "2nd"
                      : stage.portrayal.averagePosition + "th"}
                  </strong>{" "}
                  brand on average
                </p>
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="bg-white rounded-2xl p-6 border-4 border-gray-100 shadow-lg">
              <div className="font-bold text-gray-900 mb-4 text-xl">😊 Sentiment Breakdown:</div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Positive */}
                <div
                  className={`p-6 rounded-xl text-center transition-all ${
                    stage.portrayal.sentiment.dominant === "positive"
                      ? "bg-green-500 text-white shadow-2xl scale-105 ring-4 ring-green-200"
                      : "bg-green-50 text-green-700 border-2 border-green-200"
                  }`}
                >
                  <div className="text-4xl mb-2">👍</div>
                  <div className="text-4xl font-bold mb-1">{stage.portrayal.sentiment.positive}%</div>
                  <div className="text-sm font-semibold">Positive</div>
                  {stage.portrayal.sentiment.dominant === "positive" && (
                    <div className="mt-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">DOMINANT</div>
                  )}
                </div>

                {/* Neutral */}
                <div
                  className={`p-6 rounded-xl text-center transition-all ${
                    stage.portrayal.sentiment.dominant === "neutral"
                      ? "bg-gray-500 text-white shadow-2xl scale-105 ring-4 ring-gray-200"
                      : "bg-gray-50 text-gray-700 border-2 border-gray-200"
                  }`}
                >
                  <div className="text-4xl mb-2">😐</div>
                  <div className="text-4xl font-bold mb-1">{stage.portrayal.sentiment.neutral}%</div>
                  <div className="text-sm font-semibold">Neutral</div>
                  {stage.portrayal.sentiment.dominant === "neutral" && (
                    <div className="mt-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">DOMINANT</div>
                  )}
                </div>

                {/* Negative */}
                <div
                  className={`p-6 rounded-xl text-center transition-all ${
                    stage.portrayal.sentiment.dominant === "negative"
                      ? "bg-red-500 text-white shadow-2xl scale-105 ring-4 ring-red-200"
                      : "bg-red-50 text-red-700 border-2 border-red-200"
                  }`}
                >
                  <div className="text-4xl mb-2">👎</div>
                  <div className="text-4xl font-bold mb-1">{stage.portrayal.sentiment.negative}%</div>
                  <div className="text-sm font-semibold">Negative</div>
                  {stage.portrayal.sentiment.dominant === "negative" && (
                    <div className="mt-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">DOMINANT</div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-gray-700">Overall Sentiment: </span>
                <strong
                  className={`text-xl capitalize ${
                    stage.portrayal.sentiment.dominant === "positive"
                      ? "text-green-600"
                      : stage.portrayal.sentiment.dominant === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {stage.portrayal.sentiment.dominant}
                </strong>
              </div>
            </div>

            {/* AI Answer Examples - MULTIPLE */}
            {stage.portrayal.aiAnswerExamples && stage.portrayal.aiAnswerExamples.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-4 border-yellow-200">
                <div className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                  <span className="text-3xl">💬</span>
                  <span>Real AI Response Examples ({stage.portrayal.aiAnswerExamples.length} samples):</span>
                </div>
                <div className="space-y-4">
                  {stage.portrayal.aiAnswerExamples.map((example: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl p-5 border-2 border-yellow-300 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                            {example.platform}
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              example.sentiment === "positive"
                                ? "bg-green-100 text-green-700"
                                : example.sentiment === "negative"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {example.sentiment}
                          </div>
                          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            Position: #{example.brandPosition}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 font-semibold">
                        Question: "{example.question}"
                      </div>
                      <blockquote className="text-gray-800 text-sm leading-relaxed pl-4 border-l-4 border-yellow-400 italic">
                        {example.excerpt}
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitor Comparison - VISUAL */}
            {stage.portrayal.competitorComparison && stage.portrayal.competitorComparison.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-4 border-purple-200">
                <div className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-2xl">
                  <span className="text-3xl">🏆</span>
                  Competitive Landscape in {stage.stageLabel}
                </div>

                {/* Visual Bar Chart */}
                <div className="space-y-4 mb-6">
                  {/* Your Brand */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-700 text-lg">{brandName} (You) ⭐</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-blue-700">
                          {stage.portrayal.mentionRate}%
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          • Position #{stage.portrayal.averagePosition || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold transition-all duration-1000"
                        style={{ width: `${stage.portrayal.mentionRate}%` }}
                      >
                        {stage.portrayal.mentionRate}%
                      </div>
                    </div>
                  </div>

                  {/* Competitors */}
                  {stage.portrayal.competitorComparison.map((comp: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{comp.competitorName}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-gray-700">{comp.mentionRate}%</span>
                          <span className="text-sm text-gray-600 ml-2">• Position #{comp.avgPosition}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-gray-400 to-gray-500 h-6 rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all duration-1000"
                          style={{ width: `${comp.mentionRate}%` }}
                        >
                          {comp.mentionRate}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gap Analysis */}
                <div className="bg-white p-5 rounded-xl border-2 border-purple-300">
                  <div className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Gap Analysis:
                  </div>
                  {stage.portrayal.competitorComparison.map((comp: any, i: number) => {
                    const gap = comp.mentionRate - stage.portrayal.mentionRate;
                    return (
                      <div key={i} className="text-sm text-gray-700 mb-2">
                        • {comp.competitorName} is{" "}
                        <strong className={gap > 0 ? "text-red-600" : "text-green-600"}>
                          {Math.abs(gap).toFixed(1)}% {gap > 0 ? "ahead" : "behind"}
                        </strong>{" "}
                        in mention rate
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent my-10"></div>

        {/* Q2: Recommendations */}
        <div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl mb-8 shadow-lg">
            <h3 className="text-3xl font-bold flex items-center gap-3">
              <div className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              What can I do to be more visible in the {stage.stage} stage?
            </h3>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🔍</span>
                Common Pattern Identified:
              </div>
              <p className="text-gray-800 text-base leading-relaxed pl-10">
                {stage.recommendation.commonPattern}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">📚</span>
                Content Type Needed:
              </div>
              <p className="text-gray-800 text-base leading-relaxed pl-10">
                {stage.recommendation.contentType}
              </p>
            </div>

            {/* Hero Action */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-md opacity-40"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl border-4 border-green-300">
                <div className="flex items-start gap-4">
                  <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-4 text-2xl">✅ Recommended Action:</div>
                    <p className="text-xl leading-relaxed">{stage.recommendation.focusedAction}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
