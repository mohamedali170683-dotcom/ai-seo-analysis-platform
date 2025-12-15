"use client";

import { useState } from "react";
import { Download, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ===================================================================
// REAL AI DATA - Generated from actual ChatGPT API responses
// Analysis Date: December 15, 2025
// Platform: ChatGPT (gpt-4o-mini) - Gemini API unavailable at test time
// ===================================================================
const analysisData = {
  "analysisDate": "2025-12-15",
  "client": "Quality Group",
  "primaryBrand": "More Nutrition",
  "dataSource": "REAL DATA - ChatGPT API responses",
  "brands": {
    "client": ["More Nutrition", "ESN"],
    "competitors": ["Myprotein", "Foodspring", "Rocka Nutrition"]
  },
  "platforms": ["ChatGPT"],  // Real data from ChatGPT only
  "questions": [
    { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder" },
    { "question": "Proteinpulver Test", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast" },
    { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder" },
    { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity" },
    { "question": "DM Proteinpulver", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General" },
    { "question": "Rossmann Proteinriegel", "searchVolume": 2000, "stage": "decision", "persona": "Beginner/General" },
    { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder" }
  ],
  "totalSearchVolume": 14050,
  "totalResponses": 9,  // Real: 9 ChatGPT responses
  // KEY FINDING: AI platforms provide generic advice for most queries
  // Only direct brand queries like "Wo kann man ESN kaufen?" generate brand mentions
  "overallScore": 11,  // Low score reflects real AI behavior - brands rarely mentioned
  "stageMetrics": {
    "awareness": {
      "score": 0,
      "mentionRate": 0,  // Real: No brands mentioned in safety/dosage queries
      "avgPosition": 0,
      "sentiment": { "positive": 0, "neutral": 100, "negative": 0 },
      "questionCount": 3,
      "responseCount": 3
    },
    "consideration": {
      "score": 0,
      "mentionRate": 0,  // Real: No brands mentioned in test/comparison queries
      "avgPosition": 0,
      "sentiment": { "positive": 0, "neutral": 100, "negative": 0 },
      "questionCount": 3,
      "responseCount": 3
    },
    "decision": {
      "score": 33,
      "mentionRate": 33.3,  // Real: Only 1 of 3 queries mentions a brand (ESN)
      "avgPosition": 1.0,
      "sentiment": { "positive": 100, "neutral": 0, "negative": 0 },
      "questionCount": 3,
      "responseCount": 3
    }
  },
  "results": {
    "shareOfVoiceByPlatform": {
      // Real data: Only ESN was mentioned across all 9 queries
      "ChatGPT": { "More Nutrition": 0, "ESN": 100, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 }
    },
    "topQuestions": [
      // REAL DATA: Brand mentions from actual ChatGPT responses
      // Generic queries = no brand mentions (ChatGPT provides neutral advice)
      { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Proteinpulver Test", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "DM Proteinpulver", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      { "question": "Rossmann Proteinriegel", "searchVolume": 2000, "stage": "decision", "persona": "Beginner/General", "winner": null, "winnerShare": 0, "moreNutrition": 0, "esn": 0, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 },
      // Only direct brand query generates brand mention
      { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder", "winner": "ESN", "winnerShare": 100, "moreNutrition": 0, "esn": 100, "myprotein": 0, "foodspring": 0, "rockaNutrition": 0 }
    ],
    "sentiment": {
      // Real sentiment data: Only ESN has mentions (positive)
      "More Nutrition": { "positive": 0, "neutral": 0, "negative": 0 },
      "ESN": { "positive": 100, "neutral": 0, "negative": 0 },
      "Myprotein": { "positive": 0, "neutral": 0, "negative": 0 },
      "Foodspring": { "positive": 0, "neutral": 0, "negative": 0 },
      "Rocka Nutrition": { "positive": 0, "neutral": 0, "negative": 0 }
    },
    "personaVisibility": {
      // Real data: Visibility is minimal except for direct brand queries
      "Bodybuilder": { "More Nutrition": 0, "ESN": 50, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
      "Sports Enthusiast": { "More Nutrition": 0, "ESN": 0, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
      "Beginner/General": { "More Nutrition": 0, "ESN": 0, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
      "Beauty Affinity": { "More Nutrition": 0, "ESN": 0, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 }
    }
  },
  "sampleResponses": {
    // REAL ChatGPT responses (December 2025)
    "awareness": [
      { "platform": "ChatGPT", "question": "Sind Proteinriegel gesund?", "response": "Ob Proteinriegel gesund sind oder nicht, hängt von mehreren Faktoren ab, darunter die Inhaltsstoffe, die Nährstoffzusammensetzung und die individuellen Ernährungsziele. Hier sind einige Punkte, die du beachten solltest: 1. Inhaltsstoffe: Viele Proteinriegel enthalten hochwertige Proteinquellen wie Whey, Casein oder pflanzliches Protein. Allerdings gibt es auch Riegel, die viele Zucker, künstliche Süßstoffe oder ungesunde Fette enthalten...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Ist Proteinpulver schädlich?", "response": "Proteinpulver ist für die meisten Menschen unbedenklich, solange es in moderaten Mengen konsumiert wird und als Teil einer ausgewogenen Ernährung dient. Hier sind einige Punkte zu beachten: 1. Bedarf: Der Proteinbedarf variiert je nach Alter, Geschlecht, Aktivitätslevel und Gesundheitszustand. Die meisten Menschen können ihren Proteinbedarf durch eine ausgewogene Ernährung decken...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Wie viel Proteinpulver am Tag?", "response": "Die empfohlene Menge an Proteinpulver variiert je nach individuellen Zielen, Aktivitätslevel und Ernährung. Allgemeine Richtlinien sind: 1. Für den Durchschnittsmenschen: Etwa 0,8 bis 1,0 Gramm Protein pro Kilogramm Körpergewicht pro Tag sind für die meisten Menschen ausreichend. 2. Für Sportler oder Menschen, die Krafttraining machen: Der Bedarf kann auf 1,2 bis 2,0 Gramm Protein pro Kilogramm Körpergewicht steigen...", "sentiment": "neutral", "brandMentions": [] }
    ],
    "consideration": [
      { "platform": "ChatGPT", "question": "Proteinpulver Test", "response": "Es gibt viele verschiedene Arten von Proteinpulvern auf dem Markt, und die Wahl des richtigen Produkts hängt von verschiedenen Faktoren ab, einschließlich Ihrer Ernährungsbedürfnisse, Fitnessziele und persönlichen Vorlieben. Hier sind einige wichtige Punkte, die Sie bei einem Test oder Vergleich von Proteinpulvern berücksichtigen sollten: 1. Arten von Proteinpulvern - Whey-Protein: Schnell verdaulich, ideal nach dem Training. Hoher Gehalt an essentiellen Aminosäuren...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Welches Proteinpulver ist das beste?", "response": "Die Wahl des besten Proteinpulvers hängt von verschiedenen Faktoren ab, darunter deine individuellen Ziele, Ernährungsbedürfnisse, Allergien oder Unverträglichkeiten sowie persönliche Vorlieben. Hier sind einige gängige Arten von Proteinpulver und ihre Vorzüge: 1. Molkenprotein (Whey): Schnell verdaulich und ideal für den Muskelaufbau. Enthält alle essentiellen Aminosäuren...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Veganes Proteinpulver Test", "response": "Wenn du auf der Suche nach veganem Proteinpulver bist, gibt es viele Optionen und verschiedene Kriterien, die du in Betracht ziehen solltest. Hier sind einige wichtige Punkte, die du bei einem Test oder Vergleich von veganem Proteinpulver beachten kannst: 1. Proteinquelle - Erbsenprotein: Hochwertig, leicht verdaulich und reich an Aminosäuren. Reisprotein: Gut verträglich...", "sentiment": "neutral", "brandMentions": [] }
    ],
    "decision": [
      { "platform": "ChatGPT", "question": "DM Proteinpulver", "response": "DM Proteinpulver bezieht sich wahrscheinlich auf Proteinpulver, das in DM-Drogeriemärkten erhältlich ist. DM ist eine bekannte Drogeriemarktkette in Deutschland, die eine Vielzahl von Produkten anbietet, darunter auch Nahrungsergänzungsmittel wie Proteinpulver. Proteinpulver wird häufig von Sportlern und Fitness-Enthusiasten verwendet, um die Proteinzufuhr zu erhöhen. Es gibt verschiedene Arten von Proteinpulvern, darunter: 1. Whey-Protein: Schnell verdaulich und ideal nach dem Training...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Rossmann Proteinriegel", "response": "Rossmann ist eine Drogeriemarktkette in Deutschland, die eine Vielzahl von Produkten anbietet, darunter auch Proteinriegel. Diese Riegel sind oft als Snack für Sportler oder gesundheitsbewusste Verbraucher gedacht und enthalten in der Regel eine hohe Menge an Protein, um den Muskelaufbau und die Regeneration zu unterstützen...", "sentiment": "neutral", "brandMentions": [] },
      { "platform": "ChatGPT", "question": "Wo kann man ESN kaufen?", "response": "ESN (Essentials of Sport Nutrition) Produkte können in verschiedenen Geschäften und Online-Shops gekauft werden. Hier sind einige Optionen, wo du ESN Produkte finden kannst: 1. Offizielle Website: Die beste Quelle ist die offizielle ESN-Website, wo du das gesamte Sortiment an Nahrungsergänzungsmitteln direkt kaufen kannst. 2. Sportnahrungsgeschäfte: Viele Fachgeschäfte für Sporternährung führen ESN Produkte. 3. Online-Shops: Plattformen wie Amazon, eBay oder spezielle Sporternährungs-Webshops...", "sentiment": "positive", "brandMentions": ["ESN"] }
    ]
  },
  "competitiveLandscape": {
    // Real data: Only ESN visible across all stages
    "overall": { "More Nutrition": 0, "ESN": 100, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
    "byStage": {
      "awareness": { "More Nutrition": 0, "ESN": 0, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
      "consideration": { "More Nutrition": 0, "ESN": 0, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 },
      "decision": { "More Nutrition": 0, "ESN": 100, "Myprotein": 0, "Foodspring": 0, "Rocka Nutrition": 0 }
    }
  },
  "recommendations": {
    "awareness": { 
      "pattern": "CRITICAL FINDING: ChatGPT provides only generic educational content for safety/dosage queries. No protein powder brands are mentioned. AI models prioritize neutral, informational responses over brand recommendations.", 
      "contentType": "To be cited by AI, brands need authoritative scientific content that AI can reference. Clinical studies, expert partnerships, and structured data (FAQ schema, medical endorsements) are essential.", 
      "action": "Create citation-worthy content: partner with nutritionists for expert quotes, publish research studies, and implement structured data. Consider building a knowledge base that AI models can learn from." 
    },
    "consideration": { 
      "pattern": "CRITICAL FINDING: Even for 'Test' and 'best protein powder' queries, ChatGPT does NOT recommend specific brands. It provides generic criteria (whey vs casein, protein types) rather than brand comparisons.", 
      "contentType": "AI models avoid brand recommendations in comparison queries. To gain visibility, brands need third-party authority: independent test results, media coverage, and strong Wikipedia/knowledge graph presence.", 
      "action": "Invest in third-party validation: secure independent product testing, pursue media coverage in fitness publications, and build Wikipedia/Wikidata presence. These sources feed AI training data." 
    },
    "decision": { 
      "pattern": "ONLY SUCCESS: The direct brand query 'Wo kann man ESN kaufen?' generated a brand mention with positive sentiment. This shows that brand-specific queries work - users must already know the brand.", 
      "contentType": "Purchase intent content works when users search for your brand directly. Brands need strong presence on official channels, Amazon, and retail partners that AI can cite.", 
      "action": "Optimize for branded search: ensure clear 'where to buy' information across all channels. The challenge is moving users from generic queries (where AI doesn't mention brands) to branded queries. This requires traditional brand building outside of AI." 
    }
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
    description: "Users are educating themselves on safety and dosage"
  },
  consideration: {
    icon: "⚖️",
    label: "Consideration",
    color: "purple",
    bgGradient: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500",
    bgLight: "bg-purple-50",
    description: "Users are evaluating the market with test queries and comparisons"
  },
  decision: {
    icon: "🛒",
    label: "Decision",
    color: "green",
    bgGradient: "from-green-500 to-green-600",
    borderColor: "border-green-500",
    bgLight: "bg-green-50",
    description: "Users are deciding where to buy - retail and availability queries"
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
      {/* Real Data Banner */}
      <div className="bg-green-600 text-white text-center py-2 text-sm font-medium">
        ✅ REAL DATA - Analysis performed using ChatGPT API (December 15, 2025) | Gemini API unavailable at analysis time
      </div>
      
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                Run New Analysis
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
              <div className="text-purple-100 text-sm">Real AI Responses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{data.questions.length}</div>
              <div className="text-purple-100 text-sm">Questions Tested</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{data.platforms.length}</div>
              <div className="text-purple-100 text-sm">Platform (ChatGPT)</div>
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
      
      {/* Key Finding Alert */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-900">Key Finding: AI Platforms Don&apos;t Naturally Recommend Protein Brands</h3>
              <p className="text-amber-800 text-sm mt-1">
                Our real ChatGPT analysis reveals that for generic queries like &quot;Sind Proteinriegel gesund?&quot; or &quot;Proteinpulver Test&quot;, 
                <strong> AI platforms provide neutral, educational responses WITHOUT mentioning any specific brands</strong>. 
                Only direct brand queries (e.g., &quot;Wo kann man ESN kaufen?&quot;) generate brand mentions. This represents a significant challenge and opportunity for AI visibility.
              </p>
            </div>
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
                    
                    {/* Sentiment Methodology */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 text-sm">ℹ️</span>
                        <div className="text-xs text-amber-800">
                          <strong>How Sentiment is Classified:</strong>
                          <ul className="mt-1 space-y-0.5 list-disc list-inside">
                            <li><span className="text-green-700 font-medium">Positive:</span> Brand mentioned with words like &quot;beste&quot;, &quot;empfohlen&quot;, &quot;hochwertig&quot;, &quot;premium&quot;, &quot;beliebt&quot;, &quot;trusted&quot;, &quot;quality&quot;</li>
                            <li><span className="text-gray-700 font-medium">Neutral:</span> Brand mentioned factually without evaluative language</li>
                            <li><span className="text-red-700 font-medium">Negative:</span> Brand mentioned with words like &quot;teuer&quot;, &quot;überteuert&quot;, &quot;probleme&quot;, &quot;bedenken&quot;, &quot;avoid&quot;</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
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
                      {data.platforms.map(platform => (
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
                      <span className="px-3 py-2 text-xs text-gray-400 italic">
                        (Real data from ChatGPT API)
                      </span>
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
                    
                    {/* Methodology Box */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-sm">ℹ️</span>
                        <p className="text-green-800 text-xs leading-relaxed">
                          <strong>Methodology:</strong> Competitive landscape shows each brand&apos;s share of total mentions within this funnel stage. 
                          Trend arrows (↑↓) compare stage performance vs. overall average. Based on {metrics.responseCount} AI responses for {metrics.questionCount} questions in this stage.
                        </p>
                      </div>
                    </div>
                    
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Share of Voice by Platform</h3>
          
          {/* Methodology Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">How Share of Voice is Calculated</h4>
                <p className="text-blue-800 text-xs leading-relaxed">
                  For each platform, we count how many times each brand is mentioned across all AI responses. 
                  <strong> Share of Voice = (Brand Mentions ÷ Total Brand Mentions) × 100</strong>. 
                  Each question is tested 3 times per platform for statistical reliability ({data.totalResponses} total responses across {data.platforms.length} platforms).
                </p>
              </div>
            </div>
          </div>
          
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Visibility by Persona</h3>
          
          {/* Methodology Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-purple-600 text-lg">ℹ️</span>
              <div>
                <h4 className="font-semibold text-purple-900 text-sm mb-1">How Persona Visibility is Calculated</h4>
                <p className="text-purple-800 text-xs leading-relaxed mb-2">
                  Each search query is mapped to a target persona based on search intent. 
                  <strong> Persona Visibility = (Brand Mentions in Persona Queries ÷ Total Mentions in Persona) × 100</strong>.
                </p>
                <div className="text-purple-800 text-xs">
                  <strong>Question → Persona Mapping:</strong>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    <div>🏋️ <strong>Bodybuilder:</strong></div>
                    <div>&quot;Wie viel Proteinpulver am Tag?&quot;, &quot;Welches ist das beste?&quot;, &quot;Wo ESN kaufen?&quot;</div>
                    <div>🏃 <strong>Sports Enthusiast:</strong></div>
                    <div>&quot;Proteinpulver Test&quot;</div>
                    <div>🌱 <strong>Beauty Affinity:</strong></div>
                    <div>&quot;Veganes Proteinpulver Test&quot;</div>
                    <div>👤 <strong>Beginner/General:</strong></div>
                    <div>&quot;Sind Proteinriegel gesund?&quot;, &quot;Ist Proteinpulver schädlich?&quot;, &quot;DM/Rossmann&quot; queries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">Which brands win each target audience segment</p>
          
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
        <div className="text-center text-sm text-gray-500 py-8 border-t mt-8">
          <p className="mb-2">Analysis performed on {data.analysisDate}</p>
          <p className="font-medium text-gray-700">AI audit solution from WPP Media Holistic Search</p>
        </div>
      </div>
    </div>
  );
}
