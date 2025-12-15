"use client";

import { useState } from "react";
import { Download, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ===================================================================
// ANALYSIS DATA WITH TRANSPARENCY LABELS
// ===================================================================
// DATA SOURCES:
// ✅ REAL: Questions, search volumes, personas (from provided brief)
// ✅ REAL: Sample ChatGPT responses for Decision stage "Wo kann man ESN kaufen?"
// 🎨 CRAFTED: Share of voice %, sentiment scores, competitive metrics
// 🎨 CRAFTED: Sample AI responses (illustrative of expected AI behavior)
// 🎨 CRAFTED: Recommendations and pattern analysis
// ===================================================================
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
    // AWARENESS - Safety & Dosage education
    { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General" },
    { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder" },
    // CONSIDERATION - Market evaluation & social proof
    { "question": "Proteinpulver Test", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast" },
    { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder" },
    { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity" },
    // DECISION - Purchase intent & retail
    { "question": "DM Proteinpulver", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General" },
    { "question": "Rossmann Proteinriegel", "searchVolume": 2000, "stage": "decision", "persona": "Beginner/General" },
    { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder" }
  ],
  "totalSearchVolume": 14050,
  "totalResponses": 108,
  "overallScore": 64,
  "stageMetrics": {
    "awareness": {
      "score": 72,
      "mentionRate": 75.0,
      "avgPosition": 2.3,
      "sentiment": { "positive": 58.3, "neutral": 33.3, "negative": 8.4 },
      "questionCount": 3,
      "responseCount": 36
    },
    "consideration": {
      "score": 68,
      "mentionRate": 83.3,
      "avgPosition": 1.8,
      "sentiment": { "positive": 66.7, "neutral": 25.0, "negative": 8.3 },
      "questionCount": 3,
      "responseCount": 36
    },
    "decision": {
      "score": 52,
      "mentionRate": 41.7,
      "avgPosition": 3.2,
      "sentiment": { "positive": 45.8, "neutral": 45.8, "negative": 8.4 },
      "questionCount": 3,
      "responseCount": 36
    }
  },
  "results": {
    "shareOfVoiceByPlatform": {
      "ChatGPT": { "More Nutrition": 26.5, "ESN": 28.2, "Myprotein": 24.1, "Foodspring": 13.8, "Rocka Nutrition": 7.4 },
      "Gemini": { "More Nutrition": 29.2, "ESN": 25.8, "Myprotein": 23.6, "Foodspring": 14.4, "Rocka Nutrition": 7.0 },
      "Copilot": { "More Nutrition": 24.8, "ESN": 27.1, "Myprotein": 26.3, "Foodspring": 12.2, "Rocka Nutrition": 9.6 },
      "Perplexity": { "More Nutrition": 27.4, "ESN": 26.5, "Myprotein": 25.8, "Foodspring": 11.9, "Rocka Nutrition": 8.4 }
    },
    "topQuestions": [
      // AWARENESS
      { "question": "Sind Proteinriegel gesund?", "searchVolume": 900, "stage": "awareness", "persona": "Beginner/General", "winner": "ESN", "winnerShare": 29.2, "moreNutrition": 25.0, "esn": 29.2, "myprotein": 25.0, "foodspring": 12.5, "rockaNutrition": 8.3 },
      { "question": "Ist Proteinpulver schädlich?", "searchVolume": 600, "stage": "awareness", "persona": "Beginner/General", "winner": "More Nutrition", "winnerShare": 30.8, "moreNutrition": 30.8, "esn": 26.9, "myprotein": 23.1, "foodspring": 11.5, "rockaNutrition": 7.7 },
      { "question": "Wie viel Proteinpulver am Tag?", "searchVolume": 450, "stage": "awareness", "persona": "Bodybuilder", "winner": "More Nutrition", "winnerShare": 28.6, "moreNutrition": 28.6, "esn": 25.7, "myprotein": 25.7, "foodspring": 11.4, "rockaNutrition": 8.6 },
      // CONSIDERATION
      { "question": "Proteinpulver Test", "searchVolume": 4600, "stage": "consideration", "persona": "Sports Enthusiast", "winner": "ESN", "winnerShare": 31.5, "moreNutrition": 28.2, "esn": 31.5, "myprotein": 22.4, "foodspring": 10.8, "rockaNutrition": 7.1 },
      { "question": "Welches Proteinpulver ist das beste?", "searchVolume": 1000, "stage": "consideration", "persona": "Bodybuilder", "winner": "More Nutrition", "winnerShare": 32.5, "moreNutrition": 32.5, "esn": 27.5, "myprotein": 22.5, "foodspring": 10.0, "rockaNutrition": 7.5 },
      { "question": "Veganes Proteinpulver Test", "searchVolume": 1200, "stage": "consideration", "persona": "Beauty Affinity", "winner": "Foodspring", "winnerShare": 28.3, "moreNutrition": 21.7, "esn": 18.3, "myprotein": 23.3, "foodspring": 28.3, "rockaNutrition": 8.4 },
      // DECISION
      { "question": "DM Proteinpulver", "searchVolume": 3200, "stage": "decision", "persona": "Beginner/General", "winner": "Foodspring", "winnerShare": 35.0, "moreNutrition": 15.0, "esn": 12.5, "myprotein": 25.0, "foodspring": 35.0, "rockaNutrition": 12.5 },
      { "question": "Rossmann Proteinriegel", "searchVolume": 2000, "stage": "decision", "persona": "Beginner/General", "winner": "Foodspring", "winnerShare": 33.3, "moreNutrition": 16.7, "esn": 16.7, "myprotein": 20.8, "foodspring": 33.3, "rockaNutrition": 12.5 },
      { "question": "Wo kann man ESN kaufen?", "searchVolume": 100, "stage": "decision", "persona": "Bodybuilder", "winner": "ESN", "winnerShare": 83.3, "moreNutrition": 8.3, "esn": 83.3, "myprotein": 4.2, "foodspring": 2.1, "rockaNutrition": 2.1 }
    ],
    "sentiment": {
      "More Nutrition": { "positive": 62.5, "neutral": 29.2, "negative": 8.3 },
      "ESN": { "positive": 64.2, "neutral": 27.5, "negative": 8.3 },
      "Myprotein": { "positive": 54.2, "neutral": 37.5, "negative": 8.3 },
      "Foodspring": { "positive": 50.0, "neutral": 41.7, "negative": 8.3 },
      "Rocka Nutrition": { "positive": 45.8, "neutral": 45.8, "negative": 8.4 }
    },
    "personaVisibility": {
      "Bodybuilder": { "More Nutrition": 29.8, "ESN": 32.5, "Myprotein": 22.6, "Foodspring": 8.5, "Rocka Nutrition": 6.6 },
      "Sports Enthusiast": { "More Nutrition": 28.2, "ESN": 31.5, "Myprotein": 22.4, "Foodspring": 10.8, "Rocka Nutrition": 7.1 },
      "Beginner/General": { "More Nutrition": 21.8, "ESN": 21.0, "Myprotein": 24.2, "Foodspring": 22.4, "Rocka Nutrition": 10.6 },
      "Beauty Affinity": { "More Nutrition": 21.7, "ESN": 18.3, "Myprotein": 23.3, "Foodspring": 28.3, "Rocka Nutrition": 8.4 }
    }
  },
  "sampleResponses": {
    "awareness": [
      { "platform": "ChatGPT", "question": "Sind Proteinriegel gesund?", "response": "Proteinriegel können eine gesunde Ergänzung sein, wenn sie hochwertige Zutaten enthalten. ESN und More Nutrition bieten Riegel mit hohem Proteingehalt und wenig Zucker an. Achten Sie auf die Zutatenliste - viele Riegel enthalten versteckten Zucker. Myprotein bietet günstige Alternativen, während Foodspring auf Bio-Qualität setzt.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein", "Foodspring"] },
      { "platform": "Gemini", "question": "Ist Proteinpulver schädlich?", "response": "Hochwertiges Proteinpulver ist bei normaler Dosierung nicht schädlich. More Nutrition und ESN sind für ihre transparente Zusammensetzung und laborgeprüfte Qualität bekannt. Wichtig ist, die empfohlene Tagesdosis nicht zu überschreiten. Bei Nierenerkrankungen sollte man ärztlichen Rat einholen.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN"] },
      { "platform": "Perplexity", "question": "Wie viel Proteinpulver am Tag?", "response": "Die empfohlene Menge liegt bei 1-2 Portionen (25-50g) pro Tag, abhängig vom Trainingsumfang. Deutsche Premium-Marken wie More Nutrition und ESN bieten klare Dosierungsempfehlungen. Für Sportler können bis zu 2g Protein pro kg Körpergewicht sinnvoll sein. Myprotein und Foodspring haben ebenfalls gute Anleitungen.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN", "Myprotein", "Foodspring"] }
    ],
    "consideration": [
      { "platform": "ChatGPT", "question": "Proteinpulver Test", "response": "Im aktuellen Proteinpulver-Test schneiden ESN und More Nutrition besonders gut ab. ESN Designer Whey überzeugt mit hervorragender Löslichkeit und Geschmack. More Nutrition Total Protein punktet bei der Aminosäurenzusammensetzung. Myprotein Impact Whey bietet das beste Preis-Leistungs-Verhältnis. Foodspring ist die Bio-Alternative.", "sentiment": "positive", "brandMentions": ["ESN", "More Nutrition", "Myprotein", "Foodspring"] },
      { "platform": "Copilot", "question": "Welches Proteinpulver ist das beste?", "response": "Das beste Proteinpulver hängt von Ihren Zielen ab. Für Geschmack und Innovation: More Nutrition. Für deutsche Qualität und Transparenz: ESN. Für Preis-Leistung: Myprotein. Für Bio-Qualität: Foodspring. Rocka Nutrition ist bei veganen Optionen beliebt.", "sentiment": "positive", "brandMentions": ["More Nutrition", "ESN", "Myprotein", "Foodspring", "Rocka Nutrition"] },
      { "platform": "Perplexity", "question": "Veganes Proteinpulver Test", "response": "Im Test für veganes Proteinpulver führt Foodspring mit seinem Bio Vegan Protein. Rocka Nutrition No Whey punktet bei Geschmack. Myprotein Vegan Blend bietet guten Wert. More Nutrition und ESN haben kleinere vegane Sortimente, sind aber auf Whey spezialisiert.", "sentiment": "neutral", "brandMentions": ["Foodspring", "Rocka Nutrition", "Myprotein", "More Nutrition", "ESN"] }
    ],
    "decision": [
      { "platform": "ChatGPT", "question": "DM Proteinpulver", "response": "Bei DM finden Sie hauptsächlich Eigenmarken und Foodspring-Produkte. Premium-Marken wie ESN oder More Nutrition sind dort nicht erhältlich - diese kaufen Sie am besten direkt im Online-Shop oder bei Partnerunternehmen. Myprotein gibt es ebenfalls nicht bei DM.", "sentiment": "neutral", "brandMentions": ["Foodspring", "ESN", "More Nutrition", "Myprotein"] },
      { "platform": "Gemini", "question": "Rossmann Proteinriegel", "response": "Rossmann bietet Proteinriegel von Foodspring und verschiedenen Eigenmarken. Für ESN oder More Nutrition Riegel müssen Sie online bestellen oder spezialisierte Fitness-Shops besuchen. Die Rossmann-Auswahl ist auf massenmarktfähige Produkte beschränkt.", "sentiment": "neutral", "brandMentions": ["Foodspring", "ESN", "More Nutrition"] },
      { "platform": "Perplexity", "question": "Wo kann man ESN kaufen?", "response": "ESN können Sie direkt unter esn.com kaufen oder bei autorisierten Partnern wie Fitmart, Amazon und ausgewählten Fitnessshops. In Drogerien wie DM oder Rossmann ist ESN nicht erhältlich. Der Online-Shop bietet oft Bundles und Rabattaktionen.", "sentiment": "positive", "brandMentions": ["ESN"] }
    ]
  },
  "competitiveLandscape": {
    "overall": { "More Nutrition": 27.0, "ESN": 26.9, "Myprotein": 24.5, "Foodspring": 13.6, "Rocka Nutrition": 8.0 },
    "byStage": {
      "awareness": { "More Nutrition": 28.1, "ESN": 27.3, "Myprotein": 24.6, "Foodspring": 11.8, "Rocka Nutrition": 8.2 },
      "consideration": { "More Nutrition": 27.5, "ESN": 25.8, "Myprotein": 22.7, "Foodspring": 16.4, "Rocka Nutrition": 7.6 },
      "decision": { "More Nutrition": 13.3, "ESN": 37.5, "Myprotein": 16.7, "Foodspring": 23.5, "Rocka Nutrition": 9.0 }
    }
  },
  "recommendations": {
    "awareness": { 
      "pattern": "In safety and dosage queries, More Nutrition and ESN are frequently cited as trusted German brands. AI platforms associate them with transparency and quality when users express health concerns about protein supplements.", 
      "contentType": "Objection-handling content addressing common fears about protein supplements. Scientific studies, expert endorsements, and clear dosage guidelines are prioritized by AI models.", 
      "action": "Create comprehensive FAQ content addressing 'Is protein powder harmful?' and similar safety queries. Include clinical studies, nutrition expert quotes, and transparent lab testing results." 
    },
    "consideration": { 
      "pattern": "ESN leads in 'Test' queries due to strong social proof content. More Nutrition wins selection queries. The vegan segment is dominated by Foodspring - a gap for More Nutrition and ESN.", 
      "contentType": "Test/comparison content with structured data, star ratings, and customer reviews. Third-party test results and certifications strengthen AI visibility in this stage.", 
      "action": "Develop authoritative product comparison content. Consider expanding vegan protein offerings or creating educational content about plant-based protein to capture the growing vegan market segment." 
    },
    "decision": { 
      "pattern": "CRITICAL GAP: Drugstore retail queries (DM, Rossmann) represent 5,200 monthly searches but More Nutrition and ESN have minimal visibility. Foodspring dominates due to physical retail presence.", 
      "contentType": "Purchase-enabling content highlighting online availability, retail partners, and where-to-buy information. Clear CTAs and delivery information are essential.", 
      "action": "Create dedicated 'Where to buy' landing pages. Consider retail partnerships or optimize content to appear as premium online alternatives when users search for drugstore options. The ESN direct purchase query shows brand loyalty - leverage this across more channels." 
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
      
      {/* Data Transparency Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <div className="text-sm">
                <span className="font-semibold text-amber-900">Data Transparency:</span>
                <span className="text-amber-800 ml-2">
                  <span className="inline-flex items-center gap-1"><span className="text-green-600">✅</span> Real Data</span>
                  <span className="mx-2">|</span>
                  <span className="inline-flex items-center gap-1"><span className="text-purple-600">🎨</span> Crafted/Illustrative</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => document.getElementById('methodology-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs text-amber-700 underline hover:text-amber-900"
            >
              View full methodology →
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
            <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-full font-medium">🎨 Illustrative</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Your Brand&apos;s AI Journey</h2>
            <p className="text-gray-600">Click on any stage to see detailed visibility analysis</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Stage Classification</span>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative Scores</span>
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
                        <h4 className="text-lg font-bold text-gray-900">Questions Analyzed</h4>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Questions</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total AI Responses: <span className="font-bold text-gray-900">{metrics.responseCount}</span>
                        <span className="text-xs ml-2 text-purple-600">(illustrative)</span>
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
                      <h4 className="text-lg font-bold text-gray-900">💬 Sample AI Response Examples ({samples.length} samples)</h4>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative Responses</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">📊 Share of Voice by Platform</h3>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative Data</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">👥 Visibility by Persona</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Personas</span>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative %</span>
            </div>
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
            <h3 className="text-xl font-bold text-gray-900">💭 Brand Sentiment Analysis</h3>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative Data</span>
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
            <h3 className="text-xl font-bold text-gray-900">🏆 Question Winners</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">✅ Real Questions & Volumes</span>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">🎨 Illustrative Winners</span>
            </div>
          </div>
          
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

        {/* Data Sources & Methodology Section */}
        <div id="methodology-section" className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Data Sources & Methodology</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Real Data Column */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h4 className="font-bold text-green-900 text-lg">Real Data</h4>
              </div>
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Questions & Search Volumes:</strong> Provided by client brief - actual German market search queries with monthly volumes from keyword research</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Persona Mapping:</strong> Based on search intent analysis of each query (Bodybuilder, Sports Enthusiast, Beauty Affinity, Beginner/General)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Funnel Stage Classification:</strong> Real categorization based on user intent (Awareness → Consideration → Decision)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div><strong>Brand List:</strong> Actual client brands (More Nutrition, ESN) and real German market competitors</div>
                </li>
              </ul>
            </div>
            
            {/* Crafted Data Column */}
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎨</span>
                <h4 className="font-bold text-purple-900 text-lg">Crafted / Illustrative Data</h4>
              </div>
              <ul className="space-y-3 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <div><strong>Share of Voice Percentages:</strong> Illustrative metrics showing how brand visibility would be measured across AI platforms</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <div><strong>Sentiment Scores:</strong> Example sentiment distribution to demonstrate the analysis framework</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <div><strong>Sample AI Responses:</strong> Representative examples of how AI platforms might respond (actual responses would vary)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <div><strong>Competitive Landscape:</strong> Illustrative positioning to show analysis capabilities</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <div><strong>Recommendations:</strong> Strategic insights based on market knowledge and AI visibility best practices</div>
                </li>
              </ul>
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
