import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export const maxDuration = 300; // 5 minutes

// Brand configuration
const BRANDS = {
  client: ["More Nutrition", "ESN"],
  competitors: ["Myprotein", "Foodspring", "Rocka Nutrition"],
};

const ALL_BRANDS = [...BRANDS.client, ...BRANDS.competitors];

// Questions organized by funnel stage (German market)
const QUESTIONS = [
  // AWARENESS STAGE
  { question: "Wie viel Zucker am Tag?", searchVolume: 12000, stage: "awareness", persona: "Beauty/Lifestyle" },
  { question: "Was hilft gegen Muskelkater?", searchVolume: 5200, stage: "awareness", persona: "Sports Enthusiast" },
  { question: "Wie viel Eiweiß am Tag?", searchVolume: 4100, stage: "awareness", persona: "Bodybuilder" },
  // CONSIDERATION STAGE
  { question: "Welches Magnesium ist das beste?", searchVolume: 7500, stage: "consideration", persona: "Sports/Health" },
  { question: "Welches Proteinpulver?", searchVolume: 1900, stage: "consideration", persona: "Bodybuilder" },
  { question: "Welches Vitamin bei Haarausfall?", searchVolume: 1100, stage: "consideration", persona: "Beauty Affinity" },
  // DECISION STAGE
  { question: "Was ist Chunky Flavour?", searchVolume: 500, stage: "decision", persona: "Lifestyle/Diet" },
  { question: "Sind Proteinriegel gut zum Abnehmen?", searchVolume: 400, stage: "decision", persona: "Diet/Beauty" },
  { question: "Ist Proteinpulver gesund?", searchVolume: 300, stage: "decision", persona: "Beginner/General" },
];

type Platform = "ChatGPT" | "Gemini" | "Copilot" | "Perplexity";
type Sentiment = "positive" | "neutral" | "negative";

interface BrandMention {
  brand: string;
  position: number;
  sentiment: Sentiment;
  context: string;
}

interface PlatformResponse {
  platform: Platform;
  fullResponse: string;
  brandMentions: BrandMention[];
  winner: string | null;
}

interface QuestionResult {
  question: string;
  searchVolume: number;
  stage: string;
  persona: string;
  responses: PlatformResponse[];
  aggregated: {
    shareOfVoice: { [brand: string]: number };
    winner: string | null;
    winnerShare: number;
    totalMentions: number;
  };
}

// Initialize OpenAI client
function createOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: 20000,
    maxRetries: 1,
  });
}

// Initialize Gemini client
function createGemini() {
  const key = process.env.GEMINI_API_KEY;
  return key ? new GoogleGenerativeAI(key) : null;
}

// Analyze response for brand mentions
function analyzeResponse(response: string): BrandMention[] {
  const mentions: BrandMention[] = [];
  const lowerResponse = response.toLowerCase();
  
  ALL_BRANDS.forEach(brand => {
    const lowerBrand = brand.toLowerCase();
    const index = lowerResponse.indexOf(lowerBrand);
    
    if (index !== -1) {
      // Calculate position (which brand appears first)
      const allPositions = ALL_BRANDS
        .map(b => ({ brand: b, pos: lowerResponse.indexOf(b.toLowerCase()) }))
        .filter(p => p.pos !== -1)
        .sort((a, b) => a.pos - b.pos);
      
      const position = allPositions.findIndex(p => p.brand === brand) + 1;
      
      // Extract context (50 chars before and 150 after)
      const start = Math.max(0, index - 50);
      const end = Math.min(response.length, index + brand.length + 150);
      let context = response.substring(start, end).trim();
      if (start > 0) context = "..." + context;
      if (end < response.length) context = context + "...";
      
      // Analyze sentiment
      const sentiment = analyzeSentiment(response, brand);
      
      mentions.push({ brand, position, sentiment, context });
    }
  });
  
  return mentions;
}

// Analyze sentiment for a specific brand mention
function analyzeSentiment(response: string, brand: string): Sentiment {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  
  // Find sentences containing the brand
  const sentences = response.split(/[.!?]+/).filter(s => 
    s.toLowerCase().includes(lowerBrand)
  );
  
  if (sentences.length === 0) return "neutral";
  
  const positiveWords = [
    "beste", "empfohlen", "hochwertig", "premium", "beliebt", "führend",
    "vertrauenswürdig", "qualität", "innovativ", "excellent", "great",
    "recommended", "top", "popular", "trusted", "quality", "best"
  ];
  
  const negativeWords = [
    "teuer", "überteuert", "vermeiden", "schlecht", "enttäuschend",
    "bedenken", "probleme", "expensive", "overpriced", "avoid", "poor",
    "disappointing", "concerns", "issues", "problems"
  ];
  
  let positiveScore = 0, negativeScore = 0;
  
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    positiveWords.forEach(w => { if (lower.includes(w)) positiveScore++; });
    negativeWords.forEach(w => { if (lower.includes(w)) negativeScore++; });
  });
  
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

// Query a single platform
async function queryPlatform(
  platform: Platform,
  question: string,
  openai: OpenAI,
  gemini: GoogleGenerativeAI | null
): Promise<PlatformResponse> {
  let fullResponse = "";
  
  try {
    if (platform === "Gemini" && gemini) {
      // Use real Gemini API
      const model = gemini.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
      });
      const result = await Promise.race([
        model.generateContent(question),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
      ]);
      if (result) {
        const response = await (result as any).response;
        fullResponse = response.text() || "";
      }
    } else {
      // Use OpenAI for ChatGPT, Copilot (sim), Perplexity (sim)
      const systemPrompts: Record<string, string> = {
        "ChatGPT": "",
        "Copilot": "You are Microsoft Copilot. Provide helpful, balanced answers. When discussing nutrition or supplements in Germany, be specific about available brands.",
        "Perplexity": "You are Perplexity AI. Provide comprehensive, well-researched answers about nutrition and supplements, especially for the German market.",
      };
      
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompts[platform]) {
        messages.push({ role: "system", content: systemPrompts[platform] });
      }
      messages.push({ role: "user", content: question });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages,
          max_tokens: 400,
          temperature: 0.7,
        },
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      fullResponse = completion?.choices?.[0]?.message?.content || "";
    }
  } catch (error: any) {
    console.error(`Error querying ${platform}: ${error.message}`);
  }
  
  const brandMentions = analyzeResponse(fullResponse);
  const winner = brandMentions.length > 0 
    ? brandMentions.sort((a, b) => a.position - b.position)[0].brand 
    : null;
  
  return {
    platform,
    fullResponse,
    brandMentions,
    winner,
  };
}

// Run analysis for a single question across all platforms
async function analyzeQuestion(
  questionData: typeof QUESTIONS[0],
  openai: OpenAI,
  gemini: GoogleGenerativeAI | null,
  testsPerPlatform: number = 3
): Promise<QuestionResult> {
  const platforms: Platform[] = ["ChatGPT", "Gemini", "Copilot", "Perplexity"];
  const allResponses: PlatformResponse[] = [];
  
  // Run all platforms in parallel, each with multiple tests
  for (const platform of platforms) {
    console.log(`  Testing ${platform}...`);
    
    // Run multiple tests per platform for statistical significance
    for (let i = 0; i < testsPerPlatform; i++) {
      try {
        const response = await queryPlatform(platform, questionData.question, openai, gemini);
        if (response.fullResponse) {
          allResponses.push(response);
        }
      } catch (e) {
        console.error(`  Error on ${platform} test ${i + 1}`);
      }
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Calculate Share of Voice
  const brandMentionCounts: { [brand: string]: number } = {};
  ALL_BRANDS.forEach(b => { brandMentionCounts[b] = 0; });
  
  allResponses.forEach(r => {
    r.brandMentions.forEach(m => {
      brandMentionCounts[m.brand]++;
    });
  });
  
  const totalMentions = Object.values(brandMentionCounts).reduce((a, b) => a + b, 0);
  const shareOfVoice: { [brand: string]: number } = {};
  ALL_BRANDS.forEach(b => {
    shareOfVoice[b] = totalMentions > 0 
      ? Math.round((brandMentionCounts[b] / totalMentions) * 1000) / 10 
      : 0;
  });
  
  // Determine winner
  const sortedBrands = Object.entries(brandMentionCounts).sort((a, b) => b[1] - a[1]);
  const winner = sortedBrands[0][1] > 0 ? sortedBrands[0][0] : null;
  const winnerShare = winner ? shareOfVoice[winner] : 0;
  
  return {
    question: questionData.question,
    searchVolume: questionData.searchVolume,
    stage: questionData.stage,
    persona: questionData.persona,
    responses: allResponses,
    aggregated: {
      shareOfVoice,
      winner,
      winnerShare,
      totalMentions,
    },
  };
}

export async function POST(request: Request) {
  console.log("🚀 Starting Quality Group analysis...");
  
  const openai = createOpenAI();
  const gemini = createGemini();
  
  const results: QuestionResult[] = [];
  const testsPerPlatform = 3; // 3 tests per platform for reliability
  
  // Run analysis for each question
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    console.log(`\n📝 Question ${i + 1}/${QUESTIONS.length}: "${q.question}"`);
    
    const result = await analyzeQuestion(q, openai, gemini, testsPerPlatform);
    results.push(result);
    
    console.log(`   Winner: ${result.aggregated.winner || "None"} (${result.aggregated.winnerShare}%)`);
  }
  
  // Calculate aggregated metrics
  const shareOfVoiceByPlatform: { [platform: string]: { [brand: string]: number } } = {};
  const platformMentionCounts: { [platform: string]: { [brand: string]: number } } = {};
  
  ["ChatGPT", "Gemini", "Copilot", "Perplexity"].forEach(p => {
    platformMentionCounts[p] = {};
    ALL_BRANDS.forEach(b => { platformMentionCounts[p][b] = 0; });
  });
  
  results.forEach(qResult => {
    qResult.responses.forEach(r => {
      r.brandMentions.forEach(m => {
        platformMentionCounts[r.platform][m.brand]++;
      });
    });
  });
  
  // Calculate Share of Voice per platform
  Object.keys(platformMentionCounts).forEach(platform => {
    const counts = platformMentionCounts[platform];
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    shareOfVoiceByPlatform[platform] = {};
    ALL_BRANDS.forEach(b => {
      shareOfVoiceByPlatform[platform][b] = total > 0 
        ? Math.round((counts[b] / total) * 1000) / 10 
        : 0;
    });
  });
  
  // Calculate sentiment by brand
  const sentimentByBrand: { [brand: string]: { positive: number; neutral: number; negative: number; total: number } } = {};
  ALL_BRANDS.forEach(b => {
    sentimentByBrand[b] = { positive: 0, neutral: 0, negative: 0, total: 0 };
  });
  
  results.forEach(qResult => {
    qResult.responses.forEach(r => {
      r.brandMentions.forEach(m => {
        sentimentByBrand[m.brand][m.sentiment]++;
        sentimentByBrand[m.brand].total++;
      });
    });
  });
  
  // Calculate percentage sentiments
  const sentimentPercentages: { [brand: string]: { positive: number; neutral: number; negative: number } } = {};
  ALL_BRANDS.forEach(b => {
    const s = sentimentByBrand[b];
    sentimentPercentages[b] = {
      positive: s.total > 0 ? Math.round((s.positive / s.total) * 1000) / 10 : 0,
      neutral: s.total > 0 ? Math.round((s.neutral / s.total) * 1000) / 10 : 0,
      negative: s.total > 0 ? Math.round((s.negative / s.total) * 1000) / 10 : 0,
    };
  });
  
  // Calculate visibility by persona
  const personaVisibility: { [persona: string]: { [brand: string]: number } } = {};
  const personaMentionCounts: { [persona: string]: { [brand: string]: number } } = {};
  
  results.forEach(qResult => {
    if (!personaMentionCounts[qResult.persona]) {
      personaMentionCounts[qResult.persona] = {};
      ALL_BRANDS.forEach(b => { personaMentionCounts[qResult.persona][b] = 0; });
    }
    qResult.responses.forEach(r => {
      r.brandMentions.forEach(m => {
        personaMentionCounts[qResult.persona][m.brand]++;
      });
    });
  });
  
  Object.keys(personaMentionCounts).forEach(persona => {
    const counts = personaMentionCounts[persona];
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    personaVisibility[persona] = {};
    ALL_BRANDS.forEach(b => {
      personaVisibility[persona][b] = total > 0 
        ? Math.round((counts[b] / total) * 1000) / 10 
        : 0;
    });
  });
  
  // Calculate stage metrics
  const stageMetrics: { [stage: string]: {
    score: number;
    mentionRate: number;
    avgPosition: number;
    sentiment: { positive: number; neutral: number; negative: number };
    questionCount: number;
    responseCount: number;
  }} = {};
  
  ["awareness", "consideration", "decision"].forEach(stage => {
    const stageResults = results.filter(r => r.stage === stage);
    const stageResponses = stageResults.flatMap(r => r.responses);
    
    // Calculate More Nutrition metrics for this stage
    let mentionCount = 0;
    let positions: number[] = [];
    let sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    stageResponses.forEach(r => {
      const moreNutritionMention = r.brandMentions.find(m => m.brand === "More Nutrition");
      if (moreNutritionMention) {
        mentionCount++;
        positions.push(moreNutritionMention.position);
        sentiments[moreNutritionMention.sentiment]++;
      }
    });
    
    const mentionRate = stageResponses.length > 0 
      ? Math.round((mentionCount / stageResponses.length) * 1000) / 10 
      : 0;
    
    const avgPosition = positions.length > 0 
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 
      : 0;
    
    const sentimentTotal = Object.values(sentiments).reduce((a, b) => a + b, 0);
    const sentimentPcts = {
      positive: sentimentTotal > 0 ? Math.round((sentiments.positive / sentimentTotal) * 1000) / 10 : 0,
      neutral: sentimentTotal > 0 ? Math.round((sentiments.neutral / sentimentTotal) * 1000) / 10 : 0,
      negative: sentimentTotal > 0 ? Math.round((sentiments.negative / sentimentTotal) * 1000) / 10 : 0,
    };
    
    // Calculate visibility score (weighted)
    const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const sentimentScore = Math.max(0, Math.min(100, ((sentimentPcts.positive - sentimentPcts.negative + 100) / 2)));
    const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));
    
    stageMetrics[stage] = {
      score: visibilityScore,
      mentionRate,
      avgPosition,
      sentiment: sentimentPcts,
      questionCount: stageResults.length,
      responseCount: stageResponses.length,
    };
  });
  
  // Calculate overall visibility score
  const overallScore = Math.round(
    (stageMetrics.awareness.score * 0.3) +
    (stageMetrics.consideration.score * 0.4) +
    (stageMetrics.decision.score * 0.3)
  );
  
  // Build final data structure
  const analysisData = {
    analysisDate: new Date().toISOString().split("T")[0],
    client: "Quality Group",
    primaryBrand: "More Nutrition",
    brands: BRANDS,
    platforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    questions: QUESTIONS,
    totalSearchVolume: QUESTIONS.reduce((a, q) => a + q.searchVolume, 0),
    totalResponses: results.reduce((a, r) => a + r.responses.length, 0),
    overallScore,
    stageMetrics,
    results: {
      shareOfVoiceByPlatform,
      topQuestions: results.map(r => ({
        question: r.question,
        searchVolume: r.searchVolume,
        stage: r.stage,
        persona: r.persona,
        winner: r.aggregated.winner,
        winnerShare: r.aggregated.winnerShare,
        moreNutrition: r.aggregated.shareOfVoice["More Nutrition"],
        esn: r.aggregated.shareOfVoice["ESN"],
        myprotein: r.aggregated.shareOfVoice["Myprotein"],
        foodspring: r.aggregated.shareOfVoice["Foodspring"],
        rockaNutrition: r.aggregated.shareOfVoice["Rocka Nutrition"],
      })),
      sentiment: sentimentPercentages,
      personaVisibility,
    },
    rawResponses: results,
  };
  
  // Save to JSON file
  const filePath = path.join(process.cwd(), "app/wpp-demo/data/quality-group-results.json");
  fs.writeFileSync(filePath, JSON.stringify(analysisData, null, 2));
  
  console.log("\n✅ Analysis complete! Results saved to:", filePath);
  
  return NextResponse.json({
    success: true,
    message: "Analysis complete",
    summary: {
      questionsAnalyzed: results.length,
      totalResponses: analysisData.totalResponses,
      overallScore,
      stageMetrics,
    },
  });
}

export async function GET() {
  // Return existing results if available
  try {
    const filePath = path.join(process.cwd(), "app/wpp-demo/data/quality-group-results.json");
    const data = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    return NextResponse.json({ error: "No analysis results found. Run POST to generate." }, { status: 404 });
  }
}
