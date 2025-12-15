/**
 * WPP Demo Analysis Script
 * 
 * Runs real AI queries against ChatGPT and Gemini for the Quality Group analysis.
 * 
 * Usage:
 *   OPENAI_API_KEY=xxx GEMINI_API_KEY=xxx npx ts-node scripts/run-wpp-analysis.ts
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

// Configuration
const BRANDS = {
  client: ["More Nutrition", "ESN"],
  competitors: ["Myprotein", "Foodspring", "Rocka Nutrition"],
};
const ALL_BRANDS = [...BRANDS.client, ...BRANDS.competitors];

const QUESTIONS = [
  // AWARENESS
  { question: "Sind Proteinriegel gesund?", searchVolume: 900, stage: "awareness", persona: "Beginner/General" },
  { question: "Ist Proteinpulver schädlich?", searchVolume: 600, stage: "awareness", persona: "Beginner/General" },
  { question: "Wie viel Proteinpulver am Tag?", searchVolume: 450, stage: "awareness", persona: "Bodybuilder" },
  // CONSIDERATION
  { question: "Proteinpulver Test", searchVolume: 4600, stage: "consideration", persona: "Sports Enthusiast" },
  { question: "Welches Proteinpulver ist das beste?", searchVolume: 1000, stage: "consideration", persona: "Bodybuilder" },
  { question: "Veganes Proteinpulver Test", searchVolume: 1200, stage: "consideration", persona: "Beauty Affinity" },
  // DECISION
  { question: "DM Proteinpulver", searchVolume: 3200, stage: "decision", persona: "Beginner/General" },
  { question: "Rossmann Proteinriegel", searchVolume: 2000, stage: "decision", persona: "Beginner/General" },
  { question: "Wo kann man ESN kaufen?", searchVolume: 100, stage: "decision", persona: "Bodybuilder" },
];

type Platform = "ChatGPT" | "Gemini";
type Sentiment = "positive" | "neutral" | "negative";

interface BrandMention {
  brand: string;
  position: number;
  sentiment: Sentiment;
  context: string;
}

interface PlatformResponse {
  platform: Platform;
  question: string;
  fullResponse: string;
  brandMentions: BrandMention[];
  timestamp: string;
}

// Sentiment analysis
function analyzeSentiment(response: string, brand: string): Sentiment {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  
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

// Extract brand mentions from response
function extractBrandMentions(response: string): BrandMention[] {
  const mentions: BrandMention[] = [];
  const lowerResponse = response.toLowerCase();
  
  // Find all brand positions
  const brandPositions = ALL_BRANDS
    .map(brand => ({ brand, pos: lowerResponse.indexOf(brand.toLowerCase()) }))
    .filter(p => p.pos !== -1)
    .sort((a, b) => a.pos - b.pos);
  
  brandPositions.forEach((bp, index) => {
    const brand = bp.brand;
    const pos = bp.pos;
    
    // Extract context
    const start = Math.max(0, pos - 50);
    const end = Math.min(response.length, pos + brand.length + 150);
    let context = response.substring(start, end).trim();
    if (start > 0) context = "..." + context;
    if (end < response.length) context = context + "...";
    
    mentions.push({
      brand,
      position: index + 1,
      sentiment: analyzeSentiment(response, brand),
      context,
    });
  });
  
  return mentions;
}

async function queryOpenAI(openai: OpenAI, question: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      max_tokens: 500,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error(`  ❌ OpenAI error: ${error.message}`);
    return "";
  }
}

async function queryGemini(gemini: GoogleGenerativeAI, question: string): Promise<string> {
  try {
    const model = gemini.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });
    const result = await model.generateContent(question);
    const response = await result.response;
    return response.text() || "";
  } catch (error: any) {
    console.error(`  ❌ Gemini error: ${error.message}`);
    return "";
  }
}

async function runAnalysis() {
  console.log("🚀 Starting WPP Demo Analysis with REAL AI data...\n");
  
  // Check for API keys
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!openaiKey) {
    console.error("❌ OPENAI_API_KEY not set. Please set it and retry.");
    process.exit(1);
  }
  
  const openai = new OpenAI({ apiKey: openaiKey });
  const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
  
  console.log(`✅ OpenAI API configured`);
  console.log(gemini ? `✅ Gemini API configured` : `⚠️ Gemini API not configured - will skip`);
  console.log("");
  
  const platforms: Platform[] = gemini ? ["ChatGPT", "Gemini"] : ["ChatGPT"];
  const allResponses: PlatformResponse[] = [];
  const testsPerPlatform = 3;
  
  // Run analysis for each question
  for (const q of QUESTIONS) {
    console.log(`\n📝 Question: "${q.question}" (${q.stage})`);
    
    for (const platform of platforms) {
      console.log(`  Testing ${platform}...`);
      
      for (let i = 0; i < testsPerPlatform; i++) {
        let response = "";
        
        if (platform === "ChatGPT") {
          response = await queryOpenAI(openai, q.question);
        } else if (platform === "Gemini" && gemini) {
          response = await queryGemini(gemini, q.question);
        }
        
        if (response) {
          const brandMentions = extractBrandMentions(response);
          allResponses.push({
            platform,
            question: q.question,
            fullResponse: response,
            brandMentions,
            timestamp: new Date().toISOString(),
          });
          
          const mentionedBrands = brandMentions.map(m => m.brand).join(", ") || "None";
          console.log(`    Test ${i + 1}: ${mentionedBrands}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log(`\n\n📊 Analysis complete! ${allResponses.length} responses collected.`);
  
  // Calculate aggregated metrics
  const results = calculateMetrics(allResponses);
  
  // Build final data structure
  const analysisData = {
    analysisDate: new Date().toISOString().split("T")[0],
    client: "Quality Group",
    primaryBrand: "More Nutrition",
    brands: BRANDS,
    platforms,
    questions: QUESTIONS,
    totalSearchVolume: QUESTIONS.reduce((a, q) => a + q.searchVolume, 0),
    totalResponses: allResponses.length,
    ...results,
    rawResponses: allResponses,
  };
  
  // Save to file
  const outputPath = path.join(__dirname, "../app/wpp-demo/data/quality-group-results-real.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysisData, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}`);
  
  // Print summary
  console.log("\n📈 Summary:");
  console.log(`   Overall Score: ${results.overallScore}`);
  console.log(`   Awareness Stage: ${results.stageMetrics.awareness.score}`);
  console.log(`   Consideration Stage: ${results.stageMetrics.consideration.score}`);
  console.log(`   Decision Stage: ${results.stageMetrics.decision.score}`);
  
  return analysisData;
}

function calculateMetrics(responses: PlatformResponse[]) {
  // Share of Voice by Platform
  const shareOfVoiceByPlatform: Record<string, Record<string, number>> = {};
  const platforms = [...new Set(responses.map(r => r.platform))];
  
  platforms.forEach(platform => {
    const platformResponses = responses.filter(r => r.platform === platform);
    const brandCounts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { brandCounts[b] = 0; });
    
    platformResponses.forEach(r => {
      r.brandMentions.forEach(m => {
        brandCounts[m.brand]++;
      });
    });
    
    const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);
    shareOfVoiceByPlatform[platform] = {};
    ALL_BRANDS.forEach(b => {
      shareOfVoiceByPlatform[platform][b] = total > 0 
        ? Math.round((brandCounts[b] / total) * 1000) / 10 
        : 0;
    });
  });
  
  // Top Questions analysis
  const topQuestions = QUESTIONS.map(q => {
    const qResponses = responses.filter(r => r.question === q.question);
    const brandCounts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { brandCounts[b] = 0; });
    
    qResponses.forEach(r => {
      r.brandMentions.forEach(m => {
        brandCounts[m.brand]++;
      });
    });
    
    const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
    const winner = sorted[0][1] > 0 ? sorted[0][0] : null;
    const winnerShare = winner && total > 0 ? Math.round((sorted[0][1] / total) * 1000) / 10 : 0;
    
    return {
      ...q,
      winner,
      winnerShare,
      moreNutrition: total > 0 ? Math.round((brandCounts["More Nutrition"] / total) * 1000) / 10 : 0,
      esn: total > 0 ? Math.round((brandCounts["ESN"] / total) * 1000) / 10 : 0,
      myprotein: total > 0 ? Math.round((brandCounts["Myprotein"] / total) * 1000) / 10 : 0,
      foodspring: total > 0 ? Math.round((brandCounts["Foodspring"] / total) * 1000) / 10 : 0,
      rockaNutrition: total > 0 ? Math.round((brandCounts["Rocka Nutrition"] / total) * 1000) / 10 : 0,
    };
  });
  
  // Sentiment by brand
  const sentiment: Record<string, { positive: number; neutral: number; negative: number }> = {};
  ALL_BRANDS.forEach(brand => {
    const brandMentions = responses.flatMap(r => r.brandMentions).filter(m => m.brand === brand);
    const total = brandMentions.length;
    sentiment[brand] = {
      positive: total > 0 ? Math.round((brandMentions.filter(m => m.sentiment === "positive").length / total) * 1000) / 10 : 0,
      neutral: total > 0 ? Math.round((brandMentions.filter(m => m.sentiment === "neutral").length / total) * 1000) / 10 : 0,
      negative: total > 0 ? Math.round((brandMentions.filter(m => m.sentiment === "negative").length / total) * 1000) / 10 : 0,
    };
  });
  
  // Persona visibility
  const personas = [...new Set(QUESTIONS.map(q => q.persona))];
  const personaVisibility: Record<string, Record<string, number>> = {};
  
  personas.forEach(persona => {
    const personaQuestions = QUESTIONS.filter(q => q.persona === persona).map(q => q.question);
    const personaResponses = responses.filter(r => personaQuestions.includes(r.question));
    
    const brandCounts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { brandCounts[b] = 0; });
    
    personaResponses.forEach(r => {
      r.brandMentions.forEach(m => {
        brandCounts[m.brand]++;
      });
    });
    
    const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);
    personaVisibility[persona] = {};
    ALL_BRANDS.forEach(b => {
      personaVisibility[persona][b] = total > 0 
        ? Math.round((brandCounts[b] / total) * 1000) / 10 
        : 0;
    });
  });
  
  // Stage metrics
  const stages = ["awareness", "consideration", "decision"] as const;
  const stageMetrics: Record<string, any> = {};
  
  stages.forEach(stage => {
    const stageQuestions = QUESTIONS.filter(q => q.stage === stage).map(q => q.question);
    const stageResponses = responses.filter(r => stageQuestions.includes(r.question));
    
    // More Nutrition metrics
    let mentionCount = 0;
    const positions: number[] = [];
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    stageResponses.forEach(r => {
      const mnMention = r.brandMentions.find(m => m.brand === "More Nutrition");
      if (mnMention) {
        mentionCount++;
        positions.push(mnMention.position);
        sentiments[mnMention.sentiment]++;
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
    
    // Calculate score
    const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const sentimentScore = Math.max(0, Math.min(100, ((sentimentPcts.positive - sentimentPcts.negative + 100) / 2)));
    const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));
    
    stageMetrics[stage] = {
      score: visibilityScore,
      mentionRate,
      avgPosition,
      sentiment: sentimentPcts,
      questionCount: stageQuestions.length,
      responseCount: stageResponses.length,
    };
  });
  
  // Overall score
  const overallScore = Math.round(
    (stageMetrics.awareness.score * 0.3) +
    (stageMetrics.consideration.score * 0.4) +
    (stageMetrics.decision.score * 0.3)
  );
  
  // Competitive landscape
  const competitiveLandscape = {
    overall: {} as Record<string, number>,
    byStage: {} as Record<string, Record<string, number>>,
  };
  
  // Overall
  const allBrandCounts: Record<string, number> = {};
  ALL_BRANDS.forEach(b => { allBrandCounts[b] = 0; });
  responses.forEach(r => {
    r.brandMentions.forEach(m => {
      allBrandCounts[m.brand]++;
    });
  });
  const totalMentions = Object.values(allBrandCounts).reduce((a, b) => a + b, 0);
  ALL_BRANDS.forEach(b => {
    competitiveLandscape.overall[b] = totalMentions > 0 
      ? Math.round((allBrandCounts[b] / totalMentions) * 1000) / 10 
      : 0;
  });
  
  // By stage
  stages.forEach(stage => {
    const stageQuestions = QUESTIONS.filter(q => q.stage === stage).map(q => q.question);
    const stageResponses = responses.filter(r => stageQuestions.includes(r.question));
    
    const stageBrandCounts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { stageBrandCounts[b] = 0; });
    stageResponses.forEach(r => {
      r.brandMentions.forEach(m => {
        stageBrandCounts[m.brand]++;
      });
    });
    
    const stageTotal = Object.values(stageBrandCounts).reduce((a, b) => a + b, 0);
    competitiveLandscape.byStage[stage] = {};
    ALL_BRANDS.forEach(b => {
      competitiveLandscape.byStage[stage][b] = stageTotal > 0 
        ? Math.round((stageBrandCounts[b] / stageTotal) * 1000) / 10 
        : 0;
    });
  });
  
  // Sample responses for each stage
  const sampleResponses: Record<string, any[]> = {};
  stages.forEach(stage => {
    const stageQuestions = QUESTIONS.filter(q => q.stage === stage).map(q => q.question);
    const stageResponses = responses.filter(r => stageQuestions.includes(r.question));
    
    sampleResponses[stage] = stageResponses.slice(0, 3).map(r => ({
      platform: r.platform,
      question: r.question,
      response: r.fullResponse.substring(0, 500) + (r.fullResponse.length > 500 ? "..." : ""),
      sentiment: r.brandMentions.length > 0 ? r.brandMentions[0].sentiment : "neutral",
      brandMentions: r.brandMentions.map(m => m.brand),
    }));
  });
  
  return {
    overallScore,
    stageMetrics,
    results: {
      shareOfVoiceByPlatform,
      topQuestions,
      sentiment,
      personaVisibility,
    },
    sampleResponses,
    competitiveLandscape,
    recommendations: {
      awareness: {
        pattern: "Based on real AI responses analyzing safety and dosage queries.",
        contentType: "Educational content addressing health concerns and dosage guidance.",
        action: "Create comprehensive FAQ content addressing common safety questions with scientific backing.",
      },
      consideration: {
        pattern: "Based on real AI responses analyzing test and comparison queries.",
        contentType: "Comparison content with test results, reviews, and social proof.",
        action: "Develop authoritative product comparison content with third-party validation.",
      },
      decision: {
        pattern: "Based on real AI responses analyzing retail and purchase queries.",
        contentType: "Purchase-enabling content with availability and retail partner information.",
        action: "Create dedicated 'Where to buy' content and optimize for retail-related queries.",
      },
    },
  };
}

// Run the analysis
runAnalysis().catch(console.error);
