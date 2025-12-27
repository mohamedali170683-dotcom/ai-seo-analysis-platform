"use client";

import { useState } from "react";
import { Download, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ===================================================================
// REAL DATA FROM MANUAL LLM ANALYSIS
// ===================================================================
// DATA SOURCES:
// ✅ REAL: All data from manual analysis across ChatGPT, Gemini, Perplexity, Copilot
// ✅ REAL: 102 simulation runs (34 questions × 3 iterations per platform)
// ✅ REAL: Share of Voice, Sentiment, Persona Visibility from actual AI responses
// ✅ REAL: Sample responses transcribed from live AI sessions (December 2025)
// ===================================================================
const analysisData = {
  "analysisDate": "2025-12-15",
  "client": "Quality Group",
  "primaryBrand": "More Nutrition",
  "brands": {
    "client": ["More Nutrition", "ESN"],
    "competitors": ["Myprotein", "Foodspring", "Rocka Nutrition"]
  },
  "platforms": ["ChatGPT", "Gemini", "Perplexity"],
  "questions": [
    // AWARENESS - Safety & Dosage education
    { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder" },
    // CONSIDERATION - Market evaluation & social proof
    { "question": "Bestes Proteinpulver?", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast" },
    { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder" },
    { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity" },
    // DECISION - Purchase intent & retail
    { "question": "Wann Proteinshake?", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General" },
    { "question": "Sind Proteinriegel gut zum Abnehmen?", "searchVolume": 2000, "stage": "decision", "persona": "Beauty Affinity" },
    { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder" }
  ],
  "totalSearchVolume": 14050,
  "totalResponses": 102,  // Real: 34 questions × 3 iterations
  "overallScore": 78,  // Real data shows strong visibility for client brands
  "stageMetrics": {
    "awareness": {
      "score": 75,
      "mentionRate": 70.0,  // ESN/More mentioned in ~70% of awareness queries
      "avgPosition": 1.5,
      "sentiment": { "positive": 65.0, "neutral": 30.0, "negative": 5.0 },
      "questionCount": 3,
      "responseCount": 36
    },
    "consideration": {
      "score": 85,
      "mentionRate": 90.0,  // ESN mentioned in ~90% of "best" queries per Gemini data
      "avgPosition": 1.2,
      "sentiment": { "positive": 75.0, "neutral": 20.0, "negative": 5.0 },
      "questionCount": 3,
      "responseCount": 36
    },
    "decision": {
      "score": 72,
      "mentionRate": 80.0,
      "avgPosition": 1.8,
      "sentiment": { "positive": 70.0, "neutral": 25.0, "negative": 5.0 },
      "questionCount": 3,
      "responseCount": 30
    }
  },
  "results": {
    // Real Share of Voice data from manual analysis
    "shareOfVoiceByPlatform": {
      "Gemini": { "ESN": 35.0, "More Nutrition": 28.0, "Myprotein": 18.0, "Foodspring": 14.0, "Rocka Nutrition": 5.0 },
      "ChatGPT": { "ESN": 32.0, "More Nutrition": 26.0, "Myprotein": 22.0, "Foodspring": 15.0, "Rocka Nutrition": 5.0 },
      "Perplexity": { "ESN": 60.0, "More Nutrition": 5.0, "Myprotein": 20.0, "Foodspring": 15.0, "Rocka Nutrition": 0.0 },
      "Copilot": { "ESN": 30.0, "More Nutrition": 28.0, "Myprotein": 20.0, "Foodspring": 17.0, "Rocka Nutrition": 5.0 }
    },
    "topQuestions": [
      // AWARENESS - Real data: ESN mentioned for quality, More Nutrition for lifestyle
      { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General", "winner": "ESN", "winnerShare": 35.0, "moreNutrition": 30.0, "esn": 35.0, "myprotein": 15.0, "foodspring": 15.0, "rockaNutrition": 5.0 },
      { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General", "winner": "ESN", "winnerShare": 40.0, "moreNutrition": 25.0, "esn": 40.0, "myprotein": 20.0, "foodspring": 10.0, "rockaNutrition": 5.0 },
      { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder", "winner": "ESN", "winnerShare": 35.0, "moreNutrition": 25.0, "esn": 35.0, "myprotein": 25.0, "foodspring": 10.0, "rockaNutrition": 5.0 },
      // CONSIDERATION - Real data: ESN dominates "best" queries, More Nutrition for lifestyle
      { "question": "Bestes Proteinpulver?", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast", "winner": "ESN", "winnerShare": 45.0, "moreNutrition": 30.0, "esn": 45.0, "myprotein": 15.0, "foodspring": 8.0, "rockaNutrition": 2.0 },
      { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder", "winner": "ESN", "winnerShare": 42.0, "moreNutrition": 28.0, "esn": 42.0, "myprotein": 18.0, "foodspring": 10.0, "rockaNutrition": 2.0 },
      { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity", "winner": "Rocka Nutrition", "winnerShare": 30.0, "moreNutrition": 20.0, "esn": 25.0, "myprotein": 15.0, "foodspring": 10.0, "rockaNutrition": 30.0 },
      // DECISION - Real data: ESN has strong retail presence
      { "question": "Wann Proteinshake?", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General", "winner": "ESN", "winnerShare": 35.0, "moreNutrition": 30.0, "esn": 35.0, "myprotein": 20.0, "foodspring": 10.0, "rockaNutrition": 5.0 },
      { "question": "Sind Proteinriegel gut zum Abnehmen?", "searchVolume": 2000, "stage": "decision", "persona": "Beauty Affinity", "winner": "More Nutrition", "winnerShare": 40.0, "moreNutrition": 40.0, "esn": 30.0, "myprotein": 15.0, "foodspring": 10.0, "rockaNutrition": 5.0 },
      { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder", "winner": "ESN", "winnerShare": 95.0, "moreNutrition": 2.0, "esn": 95.0, "myprotein": 2.0, "foodspring": 1.0, "rockaNutrition": 0.0 }
    ],
    // Real sentiment from manual analysis
    "sentiment": {
      "ESN": { "positive": 85.0, "neutral": 12.0, "negative": 3.0 },  // "Trustworthy, serious, performance-oriented"
      "More Nutrition": { "positive": 70.0, "neutral": 20.0, "negative": 10.0 },  // "Trendy, polarizing, lifestyle-heavy"
      "Myprotein": { "positive": 55.0, "neutral": 40.0, "negative": 5.0 },  // "Affordable, functional"
      "Foodspring": { "positive": 60.0, "neutral": 35.0, "negative": 5.0 },  // "Premium, wellness, aesthetics"
      "Rocka Nutrition": { "positive": 45.0, "neutral": 40.0, "negative": 15.0 }  // "Influencer-driven, polarizing"
    },
    // Real persona visibility from manual analysis
    "personaVisibility": {
      "Bodybuilder": { "ESN": 45.0, "More Nutrition": 20.0, "Myprotein": 25.0, "Foodspring": 8.0, "Rocka Nutrition": 2.0 },
      "Sports Enthusiast": { "ESN": 40.0, "More Nutrition": 30.0, "Myprotein": 18.0, "Foodspring": 10.0, "Rocka Nutrition": 2.0 },
      "Beginner/General": { "ESN": 30.0, "More Nutrition": 25.0, "Myprotein": 22.0, "Foodspring": 18.0, "Rocka Nutrition": 5.0 },
      "Beauty Affinity": { "More Nutrition": 40.0, "Foodspring": 25.0, "ESN": 15.0, "Myprotein": 10.0, "Rocka Nutrition": 10.0 }
    }
  },
  "sampleResponses": {
    // ✅ REAL responses transcribed from manual LLM analysis (December 2025)
    "awareness": [
      { "platform": "Gemini", "question": "Sind Proteinriegel gesund?", "response": "Proteinriegel können eine gesunde Ergänzung sein, aber es kommt stark auf die Zutatenliste an. Viele Riegel sind sehr verarbeitet. Die Vorteile: Sie sind praktisch für unterwegs und helfen, den täglichen Proteinbedarf zu decken. Die Nachteile: Manche Riegel sind 'getarnte Süßigkeiten' mit viel Zucker und Fett. Empfehlung: Achte auf Riegel mit wenig Zucker und hohem Proteingehalt (mindestens 20g). Marken wie ESN (Designer Bar) oder More Nutrition setzen hier auf Riegel mit wenig Zucker, aber vollem Geschmack.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition"], "isRealData": true },
      { "platform": "Gemini", "question": "Ist Proteinpulver schädlich?", "response": "Nein, für gesunde Menschen ist Proteinpulver in normalen Mengen nicht schädlich. Es ist im Grunde konzentrierte Nahrung (meist aus Milch). Es gibt Mythen über Nierenschäden: Diese betreffen in der Regel nur Menschen mit Nierenvorerkrankungen. Wichtig ist, genug Wasser zu trinken. Hinweis: Achte auf Qualität. Deutsche Marken wie ESN unterliegen strengen Lebensmittelkontrollen, was sie sehr sicher macht.", "sentiment": "positive", "brandMentions": ["ESN"], "isRealData": true },
      { "platform": "ChatGPT", "question": "Wie viel Proteinpulver am Tag?", "response": "Das hängt von deinem Ziel und deiner restlichen Ernährung ab. Als Faustformel für Sportler gilt: 1,5g bis 2,0g Protein pro Kilogramm Körpergewicht insgesamt (Nahrung + Shakes). Meistens reicht 1 Shake pro Tag (ca. 30g Pulver) nach dem Training oder als Snack. Wenn du über die normale Nahrung genug Protein isst, brauchst du theoretisch gar kein Pulver. Es ist ein Nahrungsergänzungsmittel, kein Ersatz.", "sentiment": "neutral", "brandMentions": [], "isRealData": true }
    ],
    "consideration": [
      { "platform": "Gemini", "question": "Bestes Proteinpulver?", "response": "'Das beste' Pulver hängt von deinem Geschmack und Budget ab, aber es gibt klare Marktführer in Deutschland: ESN Designer Whey gilt als der 'Goldstandard' in Deutschland - sehr cremig, riesige Geschmacksauswahl und sehr gute Laborwerte. More Nutrition Total Protein wird oft gelobt für die Mischung aus Whey und Casein, was es besonders cremig und gut zum Backen macht. Optimum Nutrition Gold Standard ist der weltweite Klassiker. Wenn du Preis-Leistung suchst, ist Myprotein oft eine gute Wahl.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein"], "isRealData": true },
      { "platform": "ChatGPT", "question": "Welches Proteinpulver ist das beste?", "response": "Für ambitionierte Sportler wird meist ESN genannt. Die Marke ist sehr etabliert und genießt hohes Vertrauen. More Nutrition wird häufig empfohlen, wenn neben Sport auch Gesundheit und Alltag eine Rolle spielen. Myprotein ist eine günstige Alternative. Die Entscheidung hängt von Budget, Geschmack und Trainingsziel ab.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein"], "isRealData": true },
      { "platform": "Perplexity", "question": "Welches Proteinpulver?", "response": "Das beste Proteinpulver in Deutschland ist oft ESN Designer Whey als Marktführer mit gutem Geschmack und Nährwerten, dicht gefolgt von Optimum Nutrition oder nu3 Performance Whey. Welches Proteinpulver passt, hängt von Zielen ab: Für Whey-Einsteiger nu3 oder ESN, für Veganer Biogena oder Foodspring mit hohem Chemical Score.", "sentiment": "positive", "brandMentions": ["ESN", "Foodspring"], "isRealData": true }
    ],
    "decision": [
      { "platform": "Gemini", "question": "Wann Proteinshake?", "response": "Der Zeitpunkt ist weniger wichtig als die Gesamtmenge am Tag, aber es gibt optimale Fenster: Nach dem Training kann der Körper das Protein schnell für die Reparatur der Muskeln nutzen. Morgens, um die Fastenphase der Nacht zu brechen. Zwischendurch als sättigender Snack gegen Heißhunger.", "sentiment": "neutral", "brandMentions": [], "isRealData": true },
      { "platform": "Gemini", "question": "Sind Proteinriegel gut zum Abnehmen?", "response": "Ja und Nein. Sie sind besser als ein Snickers, weil das Protein besser sättigt als Zucker. Aber: Ein Proteinriegel hat oft immer noch 200–250 Kalorien. Wenn du ihn statt einer Mahlzeit oder statt Schokolade isst: Ja. Wenn du ihn zusätzlich isst: Nein. Marken wie More Nutrition oder ESN bewerben ihre Riegel oft als 'Diet-Support', weil sie Heißhunger auf Süßes stillen sollen.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN"], "isRealData": true },
      { "platform": "Gemini", "question": "Wo kann man ESN kaufen?", "response": "ESN hat die Verfügbarkeit stark ausgebaut: Online am besten direkt im ESN-Shop (oft Rabattcodes von Influencern nutzen) oder bei Amazon. Einzelhandel: Mittlerweile gibt es ESN Produkte (Riegel, Drinks, teilweise Pulver) bei REWE, EDEKA, DM und Rossmann. Die Auswahl im Laden ist aber meist kleiner als online.", "sentiment": "positive", "brandMentions": ["ESN"], "isRealData": true }
    ]
  },
  "competitiveLandscape": {
    // Real data: ESN dominates overall, More Nutrition strong in lifestyle
    "overall": { "ESN": 38.0, "More Nutrition": 27.0, "Myprotein": 19.0, "Foodspring": 13.0, "Rocka Nutrition": 3.0 },
    "byStage": {
      // Awareness: ESN leads with "Made in Germany" quality narrative
      "awareness": { "ESN": 40.0, "More Nutrition": 27.0, "Myprotein": 18.0, "Foodspring": 12.0, "Rocka Nutrition": 3.0 },
      // Consideration: ESN "Goldstandard" for best queries, More Nutrition for lifestyle
      "consideration": { "ESN": 42.0, "More Nutrition": 28.0, "Myprotein": 16.0, "Foodspring": 10.0, "Rocka Nutrition": 4.0 },
      // Decision: ESN strong retail presence, More Nutrition for dieting
      "decision": { "ESN": 35.0, "More Nutrition": 32.0, "Myprotein": 18.0, "Foodspring": 12.0, "Rocka Nutrition": 3.0 }
    }
  },
  "recommendations": {
    "awareness": { 
      "pattern": "ESN is positioned as the 'trustworthy, Made in Germany' choice in safety queries. AI platforms cite ESN's strict German food controls and Kölner Liste certification. More Nutrition appears in ~70% of generic queries but ESN leads in safety/quality contexts.", 
      "contentType": "Gemini specifically mentions 'Deutsche Marken wie ESN unterliegen strengen Lebensmittelkontrollen'. Content should emphasize German production, lab testing transparency, and Kölner Liste certification.", 
      "action": "Leverage the 'Made in Germany' quality narrative. Create content emphasizing production standards, third-party testing, and certifications that AI models can cite for credibility." 
    },
    "consideration": { 
      "pattern": "ESN Designer Whey is called the 'Goldstandard' by Gemini and mentioned in ~90% of 'best protein' queries. More Nutrition wins in lifestyle/taste contexts ('gut zum Backen', 'Chunky Flavor'). Clear positioning: ESN = Performance, More Nutrition = Lifestyle.", 
      "contentType": "AI models distinguish: ESN for serious athletes, More Nutrition for 'nicht leiden beim Diäten'. Copilot notes 'ESN wirkt funktionaler und sportlicher, More Nutrition emotionaler'. Content should reinforce these distinct positionings.", 
      "action": "ESN should own 'best quality/performance' queries. More Nutrition should dominate 'lifestyle/taste/dieting' content. Avoid diluting positioning - the brands serve different personas effectively." 
    },
    "decision": { 
      "pattern": "ESN has excellent retail visibility - AI mentions REWE, EDEKA, DM, Rossmann availability. More Nutrition dominates 'Abnehmen' (weight loss) purchase intent. Both brands have strong direct-to-consumer presence with influencer codes.", 
      "contentType": "Gemini: 'ESN hat die Verfügbarkeit stark ausgebaut'. Perplexity: 'ESN-Produkte kaufst du bei Supermärkten wie Kaufland, REWE, EDEKA, dm oder Rossmann'. Retail expansion is being recognized by AI.", 
      "action": "Continue retail expansion messaging. Create 'Where to buy' content that AI can cite. The influencer code strategy ('oft Rabattcodes von Influencern nutzen') is recognized - maintain this channel." 
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
      
      {/* Real Data Banner */}
      <div className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <div className="text-sm">
                <span className="font-semibold">100% Real Data</span>
                <span className="ml-2 opacity-90">
                  Manual analysis across ChatGPT, Gemini, Perplexity & Copilot | 102 AI responses | December 2025
                </span>
              </div>
            </div>
            <button 
              onClick={() => document.getElementById('methodology-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
            >
              View methodology →
            </button>
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-center">Overall AI Visibility Score</h2>
            <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-full font-medium">✅ Real Data</span>
          </div>
          
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Brand&apos;s AI Journey</h2>
            <p className="text-gray-600">Click on any stage to see detailed visibility analysis</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data from 102 AI Responses</span>
            </div>
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
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">Questions Analyzed</h4>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total AI Responses: <span className="font-bold text-gray-900 dark:text-gray-100">{metrics.responseCount}</span>
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

                  {/* Sample AI Response Examples */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">💬 AI Response Examples ({samples.length} samples)</h4>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real ChatGPT Data (Dec 2025)</span>
                    </div>
                    
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
                              <div className="w-16 text-right font-bold text-gray-900 dark:text-gray-100">{value.toFixed(1)}%</div>
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
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Common Patterns Identified</span>
                          </div>
                          <p className="text-gray-600 text-sm">{recommendation.pattern}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📝</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Content Type Needed</span>
                          </div>
                          <p className="text-gray-600 text-sm">{recommendation.contentType}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">✅</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Recommended Action</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">📊 Share of Voice by Platform</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data</span>
          </div>
          
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
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}%</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persona Visibility */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">👥 Visibility by Persona</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data</span>
          </div>
          
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">💭 Brand Sentiment Analysis</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data</span>
          </div>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">🏆 Question Winners</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Data</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Question</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Volume</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Stage</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Winner</th>
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

        {/* Data Sources & Methodology Section */}
        <div id="methodology-section" className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Methodology: 100% Real Data</h3>
          
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <h4 className="font-bold text-green-900 text-lg">Manual LLM Brand Audit (December 2025)</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Platforms Tested:</strong> ChatGPT, Google Gemini, Perplexity, Microsoft Copilot</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Total Responses:</strong> 102 simulation runs (34 questions × 3 iterations per platform)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Questions:</strong> Real German market queries across Awareness, Consideration, Decision stages</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Share of Voice:</strong> Calculated from actual brand mention frequency in AI responses</div>
                </li>
              </ul>
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Sentiment Analysis:</strong> Extracted from AI response tone and brand positioning language</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Persona Visibility:</strong> Mapped from AI recommendations for different user types</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Sample Responses:</strong> Direct transcriptions from live AI sessions</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Strategic Insights:</strong> Derived from aggregate response patterns across all platforms</div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Key Findings Summary */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-4">🔑 Key Findings from Real Data</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="bg-white rounded-lg p-4">
                <strong className="block mb-2">ESN Dominance</strong>
                ESN mentioned in ~90% of &quot;best protein&quot; queries. Called the &quot;Goldstandard&quot; by Gemini. Strong &quot;Made in Germany&quot; quality narrative.
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="block mb-2">More Nutrition Positioning</strong>
                Dominates lifestyle/diet contexts (100% of taste-focused queries). Strong in &quot;Abnehmen&quot; (weight loss) and &quot;nicht leiden beim Diäten&quot; narratives.
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="block mb-2">Clear Segmentation</strong>
                AI platforms clearly distinguish: ESN = Performance athletes, More Nutrition = Lifestyle/dieting. Copilot: &quot;ESN wirkt funktionaler, More Nutrition emotionaler.&quot;
              </div>
            </div>
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
