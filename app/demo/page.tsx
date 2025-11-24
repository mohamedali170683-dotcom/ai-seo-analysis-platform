"use client";

import Link from "next/link";
import { ArrowLeft, Download, Brain, Users, ShoppingCart, TrendingUp } from "lucide-react";

// Mock realistic data for Purina analysis
const DEMO_DATA = {
  brandOrKeyword: "Purina",
  domain: "https://shop.purina.de",
  overallScore: 67,
  totalTests: 180,
  totalQuestions: 12,
  
  journeyStages: [
    {
      stage: "awareness",
      stageLabel: "Awareness Stage",
      icon: Brain,
      color: "from-blue-500 to-blue-600",
      
      questions: [
        { question: "What is Purina?", searchVolume: 12000 },
        { question: "Who owns Purina?", searchVolume: 8500 },
        { question: "Is Purina a good brand?", searchVolume: 15000 },
        { question: "Where is Purina made?", searchVolume: 6200 },
      ],
      
      portrayal: {
        mentionRate: 78.3,
        totalQuestions: 4,
        totalTests: 60,
        visibilityScore: 71.2,
        sentiment: {
          positive: 65.0,
          negative: 8.3,
          neutral: 26.7,
          dominant: "positive"
        },
        exampleExtract: "...Purina is a well-established pet food brand owned by Nestlé, with over 90 years of experience in pet nutrition. They offer a wide range of products formulated with veterinary nutritionists, including Pro Plan, ONE, and Fancy Feast...",
        competitorComparison: [
          { competitorName: "Mars Petcare", mentionRate: 82.1, sentiment: "positive" },
          { competitorName: "Hill's Pet Nutrition", mentionRate: 71.5, sentiment: "positive" },
        ]
      },
      
      recommendation: {
        commonPattern: "AI responses consistently emphasize Purina's veterinary research, AAFCO compliance, and long-standing brand reputation as key trust signals.",
        contentType: "Educational content about veterinary formulation process, ingredient sourcing transparency, and nutritional science credentials",
        focusedAction: "Create a dedicated 'Nutrition Science Hub' featuring veterinarian-endorsed educational content, published research studies, and transparent ingredient sourcing documentation to establish thought leadership in the awareness stage."
      }
    },
    
    {
      stage: "consideration",
      stageLabel: "Consideration Stage",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      
      questions: [
        { question: "What's the best Purina dog food?", searchVolume: 9800 },
        { question: "Purina vs Royal Canin - which is better?", searchVolume: 7200 },
        { question: "Is Purina Pro Plan worth it?", searchVolume: 11500 },
        { question: "Why do vets recommend Purina?", searchVolume: 13200 },
      ],
      
      portrayal: {
        mentionRate: 64.2,
        totalQuestions: 4,
        totalTests: 60,
        visibilityScore: 62.8,
        sentiment: {
          positive: 71.7,
          negative: 5.0,
          neutral: 23.3,
          dominant: "positive"
        },
        exampleExtract: "...Veterinarians often recommend Purina Pro Plan because it's backed by extensive research and feeding trials. The brand invests heavily in nutritional science, and many formulas are developed in consultation with veterinary nutritionists. Pro Plan also offers specialized diets for specific health conditions...",
        competitorComparison: [
          { competitorName: "Mars Petcare", mentionRate: 69.8, sentiment: "positive" },
          { competitorName: "Hill's Pet Nutrition", mentionRate: 75.3, sentiment: "positive" },
        ]
      },
      
      recommendation: {
        commonPattern: "AI chatbots prioritize brands that can demonstrate specific health benefits, clinical research backing, and veterinary endorsements when making recommendations.",
        contentType: "Comparison-friendly content highlighting unique formulations, clinical trial results, and specific health benefit documentation for different pet needs",
        focusedAction: "Develop an interactive 'Formula Finder' tool with detailed comparison charts showing clinical evidence, ingredient benefits, and vet testimonial videos for each product line to help users make informed comparisons."
      }
    },
    
    {
      stage: "decision",
      stageLabel: "Decision Stage",
      icon: ShoppingCart,
      color: "from-pink-500 to-pink-600",
      
      questions: [
        { question: "Where can I buy Purina Pro Plan?", searchVolume: 8900 },
        { question: "How much does Purina dog food cost?", searchVolume: 10500 },
        { question: "Does Purina offer free shipping?", searchVolume: 3200 },
        { question: "Purina Pro Plan price comparison", searchVolume: 5800 },
      ],
      
      portrayal: {
        mentionRate: 52.5,
        totalQuestions: 4,
        totalTests: 60,
        visibilityScore: 58.3,
        sentiment: {
          positive: 55.0,
          negative: 10.0,
          neutral: 35.0,
          dominant: "positive"
        },
        exampleExtract: "...Purina Pro Plan is available at major retailers including Petco, PetSmart, Chewy.com, and Amazon. Prices typically range from $45-75 for a 30lb bag depending on the formula. Many online retailers offer auto-ship discounts of 5-10%...",
        competitorComparison: [
          { competitorName: "Mars Petcare", mentionRate: 58.2, sentiment: "positive" },
          { competitorName: "Hill's Pet Nutrition", mentionRate: 61.7, sentiment: "positive" },
        ]
      },
      
      recommendation: {
        commonPattern: "AI responses highlight availability, pricing transparency, and purchase convenience as critical factors. They frequently cite specific retailer partnerships and subscription options.",
        contentType: "Structured data for pricing, retailer locator optimization, and clear shipping/subscription policy documentation",
        focusedAction: "Implement schema.org Product markup with real-time pricing across all retailer partners, create an optimized 'Where to Buy' page with live inventory status, and prominently feature subscription savings to improve decision-stage visibility."
      }
    }
  ]
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                DEMO REPORT
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {DEMO_DATA.brandOrKeyword} - AI Visibility Journey Analysis
              </h1>
              <p className="text-gray-600">{DEMO_DATA.domain}</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-12 text-white mb-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 opacity-90">
              Overall AI Visibility Score
            </h2>
            <div className="text-9xl font-bold mb-4">
              {DEMO_DATA.overallScore}
              <span className="text-5xl opacity-75">/100</span>
            </div>
            <p className="text-xl text-blue-100">
              Analyzed across {DEMO_DATA.journeyStages.length} journey stages • {DEMO_DATA.totalTests} AI queries • {DEMO_DATA.totalQuestions} questions
            </p>
          </div>
        </div>

        {/* Journey Stages */}
        <div className="space-y-12">
          {DEMO_DATA.journeyStages.map((stage, index) => (
            <JourneyStageCard
              key={stage.stage}
              stage={stage}
              brandName={DEMO_DATA.brandOrKeyword}
              stageNumber={index + 1}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function JourneyStageCard({ stage, brandName, stageNumber }: any) {
  const Icon = stage.icon;

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
      {/* Stage Header */}
      <div className={`bg-gradient-to-r ${stage.color} p-8 text-white`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Icon className="w-10 h-10" />
          </div>
          <div>
            <div className="text-sm opacity-90 font-semibold">Journey Stage {stageNumber}</div>
            <h2 className="text-4xl font-bold">{stage.stageLabel}</h2>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-20 rounded-xl p-5 inline-block">
          <div className="text-sm opacity-90 mb-1">Stage Visibility Score</div>
          <div className="text-5xl font-bold">
            {stage.portrayal.visibilityScore}
            <span className="text-2xl opacity-75">/100</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Questions Analyzed */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📋 Questions Analyzed in {stage.stageLabel} ({stage.questions.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {stage.questions.map((q: any, i: number) => (
              <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-900">{q.question}</div>
                <div className="text-xs text-gray-500 mt-1">
                  📊 {q.searchVolume?.toLocaleString()} searches/month
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-10"></div>

        {/* Q1: How is [Brand] being portrayed? */}
        <div className="mb-10">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
              How is {brandName} being portrayed in the {stage.stage} stage?
            </h3>
          </div>
          
          <div className="space-y-6 pl-4">
            {/* Mention Rate */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <p className="text-lg text-gray-800 leading-relaxed">
                <strong className="text-blue-700 text-2xl">{brandName}</strong> is mentioned in{" "}
                <span className="inline-block bg-blue-600 text-white px-4 py-1 rounded-lg text-2xl font-bold mx-1">
                  {stage.portrayal.mentionRate}%
                </span>{" "}
                of all AI responses across{" "}
                <strong className="text-gray-900">{stage.portrayal.totalQuestions} {stage.stage}-stage questions</strong>{" "}
                <span className="text-gray-600">({stage.portrayal.totalTests} total AI queries)</span>
              </p>
            </div>

            {/* Sentiment Analysis */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="font-bold text-gray-900 mb-4 text-lg">😊 Sentiment Analysis:</div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className={`p-4 rounded-xl text-center transition-all ${
                  stage.portrayal.sentiment.dominant === "positive" 
                    ? "bg-green-500 text-white shadow-lg scale-105 ring-4 ring-green-200" 
                    : "bg-green-50 text-green-700"
                }`}>
                  <div className="text-3xl mb-1">👍</div>
                  <div className="text-2xl font-bold">{stage.portrayal.sentiment.positive}%</div>
                  <div className="text-sm opacity-90">Positive</div>
                </div>
                <div className={`p-4 rounded-xl text-center transition-all ${
                  stage.portrayal.sentiment.dominant === "neutral" 
                    ? "bg-gray-500 text-white shadow-lg scale-105 ring-4 ring-gray-200" 
                    : "bg-gray-50 text-gray-700"
                }`}>
                  <div className="text-3xl mb-1">😐</div>
                  <div className="text-2xl font-bold">{stage.portrayal.sentiment.neutral}%</div>
                  <div className="text-sm opacity-90">Neutral</div>
                </div>
                <div className={`p-4 rounded-xl text-center transition-all ${
                  stage.portrayal.sentiment.dominant === "negative" 
                    ? "bg-red-500 text-white shadow-lg scale-105 ring-4 ring-red-200" 
                    : "bg-red-50 text-red-700"
                }`}>
                  <div className="text-3xl mb-1">👎</div>
                  <div className="text-2xl font-bold">{stage.portrayal.sentiment.negative}%</div>
                  <div className="text-sm opacity-90">Negative</div>
                </div>
              </div>
              <div className="text-center bg-gray-100 p-3 rounded-lg">
                <span className="text-gray-700">Overall Sentiment: </span>
                <strong className={`text-lg capitalize ${
                  stage.portrayal.sentiment.dominant === "positive" ? "text-green-600" :
                  stage.portrayal.sentiment.dominant === "negative" ? "text-red-600" :
                  "text-gray-600"
                }`}>
                  {stage.portrayal.sentiment.dominant}
                </strong>
              </div>
            </div>

            {/* Example Extract */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-r-xl shadow-sm">
              <div className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="text-lg">Example AI Response:</span>
              </div>
              <blockquote className="text-gray-700 italic text-base leading-relaxed pl-4 border-l-2 border-yellow-400">
                "{stage.portrayal.exampleExtract}"
              </blockquote>
            </div>

            {/* Competitor Comparison */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
              <div className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <span className="text-2xl">🏆</span>
                Competitor Comparison in {stage.stageLabel}:
              </div>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{brandName} (You)</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{stage.portrayal.mentionRate}%</div>
                      <div className="text-sm opacity-90">mention rate</div>
                    </div>
                  </div>
                </div>
                
                {stage.portrayal.competitorComparison.map((comp: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">{comp.competitorName}</span>
                        <span className={`ml-3 px-2 py-1 rounded text-xs font-bold ${
                          comp.sentiment === "positive" ? "bg-green-100 text-green-700" :
                          comp.sentiment === "negative" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {comp.sentiment}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{comp.mentionRate}%</div>
                        <div className="text-sm text-gray-600">mention rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-sm text-gray-600">
                  <strong>Gap Analysis:</strong> {brandName} is {
                    stage.portrayal.mentionRate < stage.portrayal.competitorComparison[0]?.mentionRate
                      ? `${(stage.portrayal.competitorComparison[0].mentionRate - stage.portrayal.mentionRate).toFixed(1)}% behind`
                      : `${(stage.portrayal.mentionRate - stage.portrayal.competitorComparison[0].mentionRate).toFixed(1)}% ahead of`
                  } top competitor in this stage.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-10"></div>

        {/* Q2: What can I do to be more visible? */}
        <div>
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
              What can I do to be more visible in the {stage.stage} stage?
            </h3>
          </div>
          
          <div className="space-y-6 pl-4">
            {/* Common Pattern */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🔍</span>
                Common Pattern Identified:
              </div>
              <p className="text-gray-800 text-base leading-relaxed pl-8">
                {stage.recommendation.commonPattern}
              </p>
            </div>

            {/* Content Type */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">📚</span>
                Content Type Needed:
              </div>
              <p className="text-gray-800 text-base leading-relaxed pl-8">
                {stage.recommendation.contentType}
              </p>
            </div>

            {/* Focused Action - HERO */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-sm opacity-30"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-3 text-xl">✅ Recommended Action:</div>
                    <p className="text-xl leading-relaxed font-medium">
                      {stage.recommendation.focusedAction}
                    </p>
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
