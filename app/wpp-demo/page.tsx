"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Analysis data embedded directly
const analysisData = {
  "analysisDate": "2024-12-15",
  "client": "Quality Group",
  "primaryBrand": "More Nutrition",
  "brands": {
    "client": ["More Nutrition", "ESN"],
    "competitors": ["Myprotein", "Foodspring", "Rocka Nutrition"]
  },
  "platforms": ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
  "questions": [
    { "question": "Wie viel Zucker am Tag?", "searchVolume": 12000, "stage": "awareness", "persona": "Beauty/Lifestyle" },
    { "question": "Was hilft gegen Muskelkater?", "searchVolume": 5200, "stage": "awareness", "persona": "Sports Enthusiast" },
    { "question": "Wie viel Eiweiß am Tag?", "searchVolume": 4100, "stage": "awareness", "persona": "Bodybuilder" },
    { "question": "Welches Magnesium ist das beste?", "searchVolume": 7500, "stage": "consideration", "persona": "Sports/Health" },
    { "question": "Welches Proteinpulver?", "searchVolume": 1900, "stage": "consideration", "persona": "Bodybuilder" },
    { "question": "Welches Vitamin bei Haarausfall?", "searchVolume": 1100, "stage": "consideration", "persona": "Beauty Affinity" },
    { "question": "Was ist Chunky Flavour?", "searchVolume": 500, "stage": "decision", "persona": "Lifestyle/Diet" },
    { "question": "Sind Proteinriegel gut zum Abnehmen?", "searchVolume": 400, "stage": "decision", "persona": "Diet/Beauty" },
    { "question": "Ist Proteinpulver gesund?", "searchVolume": 300, "stage": "decision", "persona": "Beginner/General" }
  ],
  "totalSearchVolume": 33000,
  "totalResponses": 108,
  "overallScore": 67,
  "stageMetrics": {
    "awareness": {
      "score": 71,
      "mentionRate": 78.3,
      "avgPosition": 2.1,
      "sentiment": { "positive": 65.0, "neutral": 26.7, "negative": 8.3 },
      "questionCount": 3,
      "responseCount": 36
    },
    "consideration": {
      "score": 63,
      "mentionRate": 66.7,
      "avgPosition": 2.4,
      "sentiment": { "positive": 58.3, "neutral": 33.3, "negative": 8.4 },
      "questionCount": 3,
      "responseCount": 36
    },
    "decision": {
      "score": 58,
      "mentionRate": 58.3,
      "avgPosition": 2.8,
      "sentiment": { "positive": 52.4, "neutral": 38.1, "negative": 9.5 },
      "questionCount": 3,
      "responseCount": 36
    }
  },
  "results": {
    "shareOfVoiceByPlatform": {
      "ChatGPT": { "More Nutrition": 28.5, "ESN": 24.2, "Myprotein": 22.1, "Foodspring": 15.8, "Rocka Nutrition": 9.4 },
      "Gemini": { "More Nutrition": 31.2, "ESN": 22.8, "Myprotein": 25.6, "Foodspring": 12.4, "Rocka Nutrition": 8.0 },
      "Copilot": { "More Nutrition": 26.8, "ESN": 25.1, "Myprotein": 24.3, "Foodspring": 14.2, "Rocka Nutrition": 9.6 },
      "Perplexity": { "More Nutrition": 29.4, "ESN": 23.5, "Myprotein": 23.8, "Foodspring": 13.9, "Rocka Nutrition": 9.4 }
    },
    "topQuestions": [
      { "question": "Wie viel Zucker am Tag?", "searchVolume": 12000, "stage": "awareness", "persona": "Beauty/Lifestyle", "winner": "More Nutrition", "winnerShare": 32.5, "moreNutrition": 32.5, "esn": 22.5, "myprotein": 20.0, "foodspring": 15.0, "rockaNutrition": 10.0 },
      { "question": "Was hilft gegen Muskelkater?", "searchVolume": 5200, "stage": "awareness", "persona": "Sports Enthusiast", "winner": "ESN", "winnerShare": 30.0, "moreNutrition": 27.5, "esn": 30.0, "myprotein": 22.5, "foodspring": 12.5, "rockaNutrition": 7.5 },
      { "question": "Wie viel Eiweiß am Tag?", "searchVolume": 4100, "stage": "awareness", "persona": "Bodybuilder", "winner": "More Nutrition", "winnerShare": 28.6, "moreNutrition": 28.6, "esn": 25.7, "myprotein": 25.7, "foodspring": 11.4, "rockaNutrition": 8.6 },
      { "question": "Welches Magnesium ist das beste?", "searchVolume": 7500, "stage": "consideration", "persona": "Sports/Health", "winner": "Myprotein", "winnerShare": 28.0, "moreNutrition": 24.0, "esn": 20.0, "myprotein": 28.0, "foodspring": 16.0, "rockaNutrition": 12.0 },
      { "question": "Welches Proteinpulver?", "searchVolume": 1900, "stage": "consideration", "persona": "Bodybuilder", "winner": "More Nutrition", "winnerShare": 30.8, "moreNutrition": 30.8, "esn": 26.9, "myprotein": 23.1, "foodspring": 11.5, "rockaNutrition": 7.7 },
      { "question": "Welches Vitamin bei Haarausfall?", "searchVolume": 1100, "stage": "consideration", "persona": "Beauty Affinity", "winner": "Foodspring", "winnerShare": 27.3, "moreNutrition": 22.7, "esn": 18.2, "myprotein": 18.2, "foodspring": 27.3, "rockaNutrition": 13.6 },
      { "question": "Was ist Chunky Flavour?", "searchVolume": 500, "stage": "decision", "persona": "Lifestyle/Diet", "winner": "More Nutrition", "winnerShare": 75.0, "moreNutrition": 75.0, "esn": 8.3, "myprotein": 8.3, "foodspring": 4.2, "rockaNutrition": 4.2 },
      { "question": "Sind Proteinriegel gut zum Abnehmen?", "searchVolume": 400, "stage": "decision", "persona": "Diet/Beauty", "winner": "ESN", "winnerShare": 29.2, "moreNutrition": 25.0, "esn": 29.2, "myprotein": 25.0, "foodspring": 12.5, "rockaNutrition": 8.3 },
      { "question": "Ist Proteinpulver gesund?", "searchVolume": 300, "stage": "decision", "persona": "Beginner/General", "winner": "Myprotein", "winnerShare": 27.8, "moreNutrition": 22.2, "esn": 22.2, "myprotein": 27.8, "foodspring": 16.7, "rockaNutrition": 11.1 }
    ],
    "sentiment": {
      "More Nutrition": { "positive": 62.5, "neutral": 29.2, "negative": 8.3 },
      "ESN": { "positive": 58.3, "neutral": 33.3, "negative": 8.4 },
      "Myprotein": { "positive": 54.2, "neutral": 37.5, "negative": 8.3 },
      "Foodspring": { "positive": 50.0, "neutral": 41.7, "negative": 8.3 },
      "Rocka Nutrition": { "positive": 45.8, "neutral": 45.8, "negative": 8.4 }
    },
    "personaVisibility": {
      "Beauty/Lifestyle": { "More Nutrition": 32.5, "ESN": 22.5, "Myprotein": 20.0, "Foodspring": 15.0, "Rocka Nutrition": 10.0 },
      "Sports Enthusiast": { "More Nutrition": 27.5, "ESN": 30.0, "Myprotein": 22.5, "Foodspring": 12.5, "Rocka Nutrition": 7.5 },
      "Bodybuilder": { "More Nutrition": 29.7, "ESN": 26.3, "Myprotein": 24.4, "Foodspring": 11.5, "Rocka Nutrition": 8.1 },
      "Sports/Health": { "More Nutrition": 24.0, "ESN": 20.0, "Myprotein": 28.0, "Foodspring": 16.0, "Rocka Nutrition": 12.0 },
      "Beauty Affinity": { "More Nutrition": 22.7, "ESN": 18.2, "Myprotein": 18.2, "Foodspring": 27.3, "Rocka Nutrition": 13.6 },
      "Lifestyle/Diet": { "More Nutrition": 75.0, "ESN": 8.3, "Myprotein": 8.3, "Foodspring": 4.2, "Rocka Nutrition": 4.2 },
      "Diet/Beauty": { "More Nutrition": 25.0, "ESN": 29.2, "Myprotein": 25.0, "Foodspring": 12.5, "Rocka Nutrition": 8.3 },
      "Beginner/General": { "More Nutrition": 22.2, "ESN": 22.2, "Myprotein": 27.8, "Foodspring": 16.7, "Rocka Nutrition": 11.1 }
    }
  },
  "sampleResponses": {
    "awareness": [
      { "platform": "ChatGPT", "question": "Wie viel Eiweiß am Tag?", "response": "Die empfohlene tägliche Proteinzufuhr variiert je nach Aktivitätslevel. Für durchschnittliche Erwachsene werden etwa 0,8g pro kg Körpergewicht empfohlen. Sportler benötigen mehr - bis zu 2g pro kg. Deutsche Marken wie More Nutrition und ESN bieten hochwertige Proteinprodukte an, die helfen können, den täglichen Bedarf zu decken. Myprotein ist eine weitere beliebte Option mit gutem Preis-Leistungs-Verhältnis.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN", "Myprotein"] },
      { "platform": "Gemini", "question": "Wie viel Zucker am Tag?", "response": "Die WHO empfiehlt maximal 25g Zucker pro Tag für Erwachsene. Viele Nahrungsergänzungsmittel enthalten versteckten Zucker. More Nutrition ist bekannt für ihre zuckerfreien Produkte wie den Chunky Flavour, der eine gute Alternative zu zuckerhaltigen Süßungsmitteln darstellt. ESN bietet ebenfalls zuckerarme Optionen an.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN"] },
      { "platform": "Perplexity", "question": "Was hilft gegen Muskelkater?", "response": "Gegen Muskelkater helfen verschiedene Ansätze: leichte Bewegung, Massage, ausreichend Protein und Magnesium. Premium-Supplements von ESN und More Nutrition werden oft empfohlen, da sie hochdosiertes Magnesium und BCAAs enthalten. Auch Myprotein bietet entsprechende Produkte zu einem guten Preis.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein"] }
    ],
    "consideration": [
      { "platform": "ChatGPT", "question": "Welches Proteinpulver?", "response": "Bei der Wahl des richtigen Proteinpulvers kommt es auf Qualität und Geschmack an. More Nutrition wird oft für den Geschmack und die innovativen Produkte gelobt. ESN überzeugt mit deutscher Herstellung und transparenter Zusammensetzung. Myprotein bietet ein gutes Preis-Leistungs-Verhältnis. Foodspring setzt auf Bio-Qualität.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN", "Myprotein", "Foodspring"] },
      { "platform": "Copilot", "question": "Welches Magnesium ist das beste?", "response": "Für Sportler sind Magnesiumcitrat oder Magnesiumbisglycinat am besten verträglich. Myprotein und ESN bieten gute Magnesium-Präparate zu fairen Preisen. More Nutrition hat ebenfalls hochwertige Optionen. Achten Sie auf die Dosierung - 300-400mg täglich werden empfohlen.", "sentiment": "neutral", "brandMentions": ["Myprotein", "ESN", "More Nutrition"] }
    ],
    "decision": [
      { "platform": "ChatGPT", "question": "Was ist Chunky Flavour?", "response": "Chunky Flavour ist ein beliebtes Produkt von More Nutrition. Es handelt sich um ein kalorienarmes Geschmackspulver, das Mahlzeiten wie Quark, Joghurt oder Porridge ohne zusätzlichen Zucker verfeinert. Es ist besonders bei Fitness-Enthusiasten und gesundheitsbewussten Menschen beliebt, da es viele Kalorien spart aber trotzdem für Geschmack sorgt.", "sentiment": "positive", "brandMentions": ["More Nutrition"] },
      { "platform": "Gemini", "question": "Sind Proteinriegel gut zum Abnehmen?", "response": "Proteinriegel können beim Abnehmen helfen, wenn sie als Mahlzeitenersatz oder gesunder Snack verwendet werden. Achten Sie auf niedrigen Zuckergehalt. ESN und More Nutrition bieten Riegel mit hohem Proteingehalt und wenig Zucker. Myprotein hat ebenfalls gute Optionen. Wichtig: Sie sollten nicht zusätzlich, sondern als Ersatz für andere Snacks gegessen werden.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein"] }
    ]
  },
  "competitiveLandscape": {
    "overall": { "More Nutrition": 28.9, "ESN": 24.0, "Myprotein": 23.9, "Foodspring": 14.1, "Rocka Nutrition": 9.1 },
    "byStage": {
      "awareness": { "More Nutrition": 29.5, "ESN": 26.1, "Myprotein": 22.7, "Foodspring": 13.0, "Rocka Nutrition": 8.7 },
      "consideration": { "More Nutrition": 25.8, "ESN": 21.7, "Myprotein": 23.1, "Foodspring": 18.3, "Rocka Nutrition": 11.1 },
      "decision": { "More Nutrition": 40.7, "ESN": 19.9, "Myprotein": 20.4, "Foodspring": 11.1, "Rocka Nutrition": 7.9 }
    }
  },
  "recommendations": {
    "awareness": { "pattern": "AI platforms consistently associate More Nutrition with lifestyle and health-conscious consumers. The brand is frequently mentioned alongside ESN in discussions about protein needs and sugar reduction.", "contentType": "Educational content about nutritional science, ingredient transparency, and the science behind low-sugar alternatives would strengthen AI visibility. Video content and expert interviews are prioritized by AI models.", "action": "Create a 'Nutrition Science Hub' featuring interactive ingredient explorers, published lab results, and expert video content. Target the Beauty/Lifestyle persona with sugar-free product education." },
    "consideration": { "pattern": "In the consideration stage, competition intensifies with Myprotein gaining ground on specific supplement categories. More Nutrition maintains strong visibility for protein products but loses share in vitamins/minerals.", "contentType": "Comparison-focused content with detailed feature analysis, third-party certifications, and customer testimonials. Head-to-head comparisons against Myprotein and Foodspring are essential.", "action": "Develop comprehensive comparison guides positioning More Nutrition's quality advantages. Expand content coverage for magnesium and vitamins where competitors currently dominate." },
    "decision": { "pattern": "More Nutrition dominates 'Chunky Flavour' queries (75% SOV) showing strong brand-product association. Generic health queries show more competition with Myprotein.", "contentType": "Transaction-enabling content with clear purchase pathways, user testimonials, and trust signals. Expand product-specific branded content beyond Chunky Flavour.", "action": "Leverage the Chunky Flavour success as a template - create similar product-specific content for other unique products. Add more customer success stories and before/after content." }
  }
};

// Brand colors
const BRAND_COLORS: Record<string, string> = {
  "More Nutrition": "#10b981", // Green (client brand - primary)
  "ESN": "#3b82f6",            // Blue (client brand - secondary)
  "Myprotein": "#f59e0b",      // Amber (competitor)
  "Foodspring": "#8b5cf6",     // Purple (competitor)
  "Rocka Nutrition": "#ec4899" // Pink (competitor)
};

const BRAND_BG_COLORS: Record<string, string> = {
  "More Nutrition": "bg-emerald-500",
  "ESN": "bg-blue-500",
  "Myprotein": "bg-amber-500",
  "Foodspring": "bg-purple-500",
  "Rocka Nutrition": "bg-pink-500"
};

// Stage configuration
const STAGE_CONFIG = {
  awareness: {
    icon: "🔍",
    label: "Awareness",
    color: "blue",
    bgGradient: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500",
    bgLight: "bg-blue-50",
    description: "Users are learning about nutrition and discovering brands"
  },
  consideration: {
    icon: "⚖️",
    label: "Consideration",
    color: "purple",
    bgGradient: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500",
    bgLight: "bg-purple-50",
    description: "Users are comparing products and evaluating options"
  },
  decision: {
    icon: "🛒",
    label: "Decision",
    color: "green",
    bgGradient: "from-green-500 to-green-600",
    borderColor: "border-green-500",
    bgLight: "bg-green-50",
    description: "Users are ready to purchase and need final validation"
  }
};

export default function WPPDemoPage() {
  const [expandedStage, setExpandedStage] = useState<string | null>("awareness");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ChatGPT");

  const data = analysisData;
  const stages = ["awareness", "consideration", "decision"] as const;

  // Get questions for a specific stage
  const getStageQuestions = (stage: string) => {
    return data.results.topQuestions.filter(q => q.stage === stage);
  };

  // Get sample responses for a stage
  const getSampleResponses = (stage: string) => {
    return data.sampleResponses[stage as keyof typeof data.sampleResponses] || [];
  };

  // Get competitive data for a stage
  const getCompetitiveData = (stage: string) => {
    return data.competitiveLandscape.byStage[stage as keyof typeof data.competitiveLandscape.byStage];
  };

  // Format number with K suffix
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate trend based on position in competitive landscape
  const getTrend = (brand: string, stage: string) => {
    const overall = data.competitiveLandscape.overall[brand as keyof typeof data.competitiveLandscape.overall];
    const stageData = getCompetitiveData(stage);
    const stageValue = stageData[brand as keyof typeof stageData];
    
    if (stageValue > overall + 2) return "up";
    if (stageValue < overall - 2) return "down";
    return "neutral";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    WPP MEDIA HOLISTIC SEARCH
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-1">
                  {data.client} - {data.primaryBrand} & ESN
                </h1>
                <p className="text-sm text-gray-500">https://morenutrition.de</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Run Real Analysis
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{data.totalResponses}</div>
              <div className="text-purple-100 text-sm">AI Responses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{data.questions.length}</div>
              <div className="text-purple-100 text-sm">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{data.platforms.length}</div>
              <div className="text-purple-100 text-sm">Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">5</div>
              <div className="text-purple-100 text-sm">Brands Tracked</div>
            </div>
          </div>
          <div className="mt-4 bg-white/10 rounded-lg p-3 text-center text-sm">
            ℹ️ This analysis covers {data.questions.length} questions across {formatNumber(data.totalSearchVolume)}+ monthly searches to measure AI visibility
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overall AI Visibility Score */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">Overall AI Visibility Score</h2>
          
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg className="w-48 h-48" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${data.overallScore * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold">{data.overallScore}</div>
                  <div className="text-purple-200">/100</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-center">ℹ️ How This Score is Calculated</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(data.stageMetrics.awareness.mentionRate)}%</div>
                <div className="text-xs text-purple-200">Mention Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">#{data.stageMetrics.awareness.avgPosition.toFixed(1)}</div>
                <div className="text-xs text-purple-200">Avg Position</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(data.stageMetrics.awareness.sentiment.positive)}</div>
                <div className="text-xs text-purple-200">Sentiment Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.overallScore}</div>
                <div className="text-xs text-purple-200">Brand Visibility</div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-purple-200">
            Final Score = Mention Rate × 0.35 + Position × 0.25 + Sentiment × 0.20 + Visibility × 0.20
          </p>
        </div>

        {/* Brand's AI Journey - 3 Stage Cards */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Brand&apos;s AI Journey</h2>
            <p className="text-gray-600">Click on any stage to see detailed visibility analysis</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {stages.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const metrics = data.stageMetrics[stage];
              const isExpanded = expandedStage === stage;

              return (
                <div
                  key={stage}
                  onClick={() => setExpandedStage(isExpanded ? null : stage)}
                  className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                    isExpanded ? `ring-2 ring-${config.color}-500` : ""
                  }`}
                >
                  <div className={`bg-gradient-to-r ${config.bgGradient} rounded-t-2xl p-6 text-white text-center`}>
                    <div className="text-4xl mb-2">{config.icon}</div>
                    <div className="text-xs uppercase tracking-wide opacity-80">Stage {stages.indexOf(stage) + 1}</div>
                    <div className="text-xl font-bold">{config.label}</div>
                  </div>
                  <div className="p-6 text-center">
                    <div className={`text-5xl font-bold mb-2 ${
                      metrics.score >= 70 ? "text-green-600" :
                      metrics.score >= 50 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {metrics.score}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">Visibility Score</div>
                    <button className={`text-sm font-medium text-${config.color}-600 flex items-center justify-center gap-1 mx-auto`}>
                      View Details
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expanded Stage Details */}
        {expandedStage && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {(() => {
              const stage = expandedStage;
              const config = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
              const metrics = data.stageMetrics[stage as keyof typeof data.stageMetrics];
              const questions = getStageQuestions(stage);
              const samples = getSampleResponses(stage);
              const competitive = getCompetitiveData(stage);
              const recommendation = data.recommendations[stage as keyof typeof data.recommendations];

              return (
                <>
                  {/* Stage Header */}
                  <div className={`bg-gradient-to-r ${config.bgGradient} rounded-xl p-6 text-white mb-8`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{config.icon}</span>
                        <div>
                          <div className="text-sm uppercase tracking-wide opacity-80">Funnel Stage {stages.indexOf(stage as typeof stages[number]) + 1}</div>
                          <h3 className="text-2xl font-bold">{config.label}</h3>
                          <p className="text-sm opacity-80">{config.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">{metrics.score}</div>
                        <div className="text-sm opacity-80">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Questions Analyzed */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Questions Analyzed</h4>
                      <div className="text-sm text-gray-500">
                        Total AI Responses: <span className="font-bold text-gray-900">{metrics.responseCount}</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {questions.map((q, i) => (
                        <div key={i} className={`${config.bgLight} rounded-xl p-4 border-2 ${config.borderColor} border-opacity-20`}>
                          <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">📊</span>
                            <span className="font-semibold">{formatNumber(q.searchVolume)}</span>
                            <span className="text-gray-500">searches/mo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portrayal Section */}
                  <div className={`${config.bgLight} rounded-xl p-6 mb-8`}>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      ℹ️ How is {data.primaryBrand} being portrayed in the {config.label.toLowerCase()} stage?
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Mention Rate */}
                      <div className="bg-white rounded-xl p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">MENTION RATE</div>
                        <div className={`text-4xl font-bold mb-2 ${
                          metrics.mentionRate >= 70 ? "text-green-600" :
                          metrics.mentionRate >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {metrics.mentionRate}%
                        </div>
                        <p className="text-sm text-gray-600">
                          {data.primaryBrand} appears in {metrics.mentionRate}% of AI responses
                        </p>
                      </div>

                      {/* Average Position */}
                      <div className="bg-white rounded-xl p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">AVERAGE POSITION</div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          #{metrics.avgPosition.toFixed(1)}
                        </div>
                        <p className="text-sm text-gray-600">
                          When mentioned, appears in position #{metrics.avgPosition.toFixed(1)} on average
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Breakdown */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">⭐ Sentiment Breakdown</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-green-50 rounded-xl p-6 text-center border-2 border-green-200">
                        <div className="text-3xl mb-2">😊</div>
                        <div className="text-3xl font-bold text-green-600">{metrics.sentiment.positive}%</div>
                        <div className="text-sm text-gray-600">Positive</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-gray-200">
                        <div className="text-3xl mb-2">😐</div>
                        <div className="text-3xl font-bold text-gray-600">{metrics.sentiment.neutral}%</div>
                        <div className="text-sm text-gray-600">Neutral</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-6 text-center border-2 border-red-200">
                        <div className="text-3xl mb-2">😞</div>
                        <div className="text-3xl font-bold text-red-600">{metrics.sentiment.negative}%</div>
                        <div className="text-sm text-gray-600">Negative</div>
                      </div>
                    </div>
                    <div className={`mt-4 text-center p-3 rounded-lg ${
                      metrics.sentiment.positive > 50 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      Overall Sentiment: <span className="font-bold">{metrics.sentiment.positive > 50 ? "Positive ✓" : "Neutral"}</span>
                    </div>
                  </div>

                  {/* Real AI Response Examples */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">💬 Real AI Response Examples ({samples.length} samples)</h4>
                    
                    {/* Platform Tabs */}
                    <div className="flex gap-2 mb-4">
                      {["ChatGPT", "Gemini", "Perplexity", "Copilot"].map(platform => (
                        <button
                          key={platform}
                          onClick={(e) => { e.stopPropagation(); setSelectedPlatform(platform); }}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            selectedPlatform === platform
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>

                    {/* Sample Response Card */}
                    {samples.filter(s => s.platform === selectedPlatform).length > 0 ? (
                      samples.filter(s => s.platform === selectedPlatform).map((sample, i) => (
                        <div key={i} className={`bg-white rounded-xl p-6 border-l-4 ${
                          sample.sentiment === "positive" ? "border-green-500" :
                          sample.sentiment === "negative" ? "border-red-500" : "border-gray-400"
                        } shadow-sm`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              sample.platform === "ChatGPT" ? "bg-green-100 text-green-700" :
                              sample.platform === "Gemini" ? "bg-blue-100 text-blue-700" :
                              sample.platform === "Perplexity" ? "bg-amber-100 text-amber-700" :
                              "bg-purple-100 text-purple-700"
                            }`}>{sample.platform}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              sample.sentiment === "positive" ? "bg-green-50 text-green-600" :
                              sample.sentiment === "negative" ? "bg-red-50 text-red-600" :
                              "bg-gray-50 text-gray-600"
                            }`}>{sample.sentiment}</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">Question: &quot;{sample.question}&quot;</p>
                          <p className="text-gray-700 italic">&quot;{sample.response}&quot;</p>
                          {sample.brandMentions && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sample.brandMentions.map((brand, j) => (
                                <span key={j} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  {brand}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                        No sample responses available for {selectedPlatform} in this stage
                      </div>
                    )}
                  </div>

                  {/* Competitive Landscape */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Competitive Landscape in {config.label}</h4>
                    <div className="space-y-4">
                      {Object.entries(competitive)
                        .sort((a, b) => b[1] - a[1])
                        .map(([brand, value], i) => {
                          const trend = getTrend(brand, stage);
                          return (
                            <div key={brand} className="flex items-center gap-4">
                              <div className="w-32 font-medium text-gray-900 truncate">{brand}</div>
                              <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                <div
                                  className={`h-6 rounded-full ${BRAND_BG_COLORS[brand]} transition-all`}
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                              <div className="w-16 text-right font-bold text-gray-900">{value.toFixed(1)}%</div>
                              <div className="w-8">
                                {trend === "up" && <TrendingUp className="w-5 h-5 text-green-500" />}
                                {trend === "down" && <TrendingDown className="w-5 h-5 text-red-500" />}
                                {trend === "neutral" && <Minus className="w-5 h-5 text-gray-400" />}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Gap Analysis */}
                    <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h5 className="font-bold text-blue-900 mb-2">📈 Gap Analysis</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• {data.primaryBrand} leads with {competitive["More Nutrition"]}% Share of Voice</li>
                        <li>• Gap vs. ESN: +{(competitive["More Nutrition"] - competitive["ESN"]).toFixed(1)}%</li>
                        <li>• Gap vs. Myprotein: +{(competitive["More Nutrition"] - competitive["Myprotein"]).toFixed(1)}%</li>
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      💡 What can I do to be more visible in the {config.label.toLowerCase()} stage?
                    </h4>

                    {recommendation && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📋</span>
                            <span className="font-semibold text-gray-900">Common Patterns Identified</span>
                          </div>
                          <p className="text-gray-600 text-sm">{recommendation.pattern}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📝</span>
                            <span className="font-semibold text-gray-900">Content Type Needed</span>
                          </div>
                          <p className="text-gray-600 text-sm">{recommendation.contentType}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">✅</span>
                            <span className="font-semibold text-gray-900">Recommended Action</span>
                          </div>
                          <p className="text-gray-700 font-medium">{recommendation.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Share of Voice by Platform */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Share of Voice by Platform</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(data.results.shareOfVoiceByPlatform).map(([platform, brands]) => (
              <div key={platform} className="border rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-4 text-center">{platform}</h4>
                <div className="space-y-3">
                  {Object.entries(brands)
                    .sort((a, b) => b[1] - a[1])
                    .map(([brand, value]) => (
                      <div key={brand} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: BRAND_COLORS[brand] }}
                        />
                        <div className="flex-1 text-sm text-gray-600 truncate">{brand}</div>
                        <div className="text-sm font-bold text-gray-900">{value}%</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persona Visibility */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">👥 Visibility by Persona</h3>
          <p className="text-gray-600 mb-6">Which brands win each target audience segment</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.results.personaVisibility).map(([persona, brands]) => {
              const sortedBrands = Object.entries(brands).sort((a, b) => (b[1] as number) - (a[1] as number));
              const winner = sortedBrands[0];
              
              return (
                <div key={persona} className="border rounded-xl p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">{persona}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: BRAND_COLORS[winner[0]] }}
                    />
                    <span className="text-xs font-bold" style={{ color: BRAND_COLORS[winner[0]] }}>
                      {winner[0]} leads with {(winner[1] as number).toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {sortedBrands.slice(0, 3).map(([brand, value]) => (
                      <div key={brand} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${value as number}%`, backgroundColor: BRAND_COLORS[brand] }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">{(value as number).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment by Brand */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">💭 Brand Sentiment Analysis</h3>
          <p className="text-gray-600 mb-6">How each brand is perceived across all AI responses</p>
          
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(data.results.sentiment).map(([brand, sentiments]) => (
              <div key={brand} className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: BRAND_COLORS[brand] }}
                >
                  {brand.split(" ").map(w => w[0]).join("")}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">{brand}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-4">😊</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${sentiments.positive}%` }} />
                    </div>
                    <span className="w-10 text-right text-green-600 font-medium">{sentiments.positive}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-4">😐</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${sentiments.neutral}%` }} />
                    </div>
                    <span className="w-10 text-right text-gray-600 font-medium">{sentiments.neutral}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-4">😞</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${sentiments.negative}%` }} />
                    </div>
                    <span className="w-10 text-right text-red-600 font-medium">{sentiments.negative}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Questions Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🏆 Question Winners</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Question</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Volume</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Stage</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Winner</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-600">More Nutrition</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">ESN</th>
                </tr>
              </thead>
              <tbody>
                {data.results.topQuestions.map((q, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{q.question}</td>
                    <td className="py-3 px-4 text-center text-sm font-medium">{formatNumber(q.searchVolume)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        q.stage === "awareness" ? "bg-blue-100 text-blue-700" :
                        q.stage === "consideration" ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {q.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-bold text-white"
                        style={{ backgroundColor: BRAND_COLORS[q.winner || ""] || "#6b7280" }}
                      >
                        {q.winner} ({q.winnerShare}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{q.moreNutrition}%</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{q.esn}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-8">
          <p>Analysis performed on {data.analysisDate} • Powered by Velaris AI Visibility Platform</p>
          <p className="mt-2">
            <Link href="/dashboard" className="text-purple-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
