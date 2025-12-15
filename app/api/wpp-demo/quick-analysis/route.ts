import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; // 60 seconds max

const ALL_BRANDS = ["More Nutrition", "ESN", "Myprotein", "Foodspring", "Rocka Nutrition"];

const QUESTIONS = [
  { question: "Sind Proteinriegel gesund?", searchVolume: 900, stage: "awareness", persona: "Beginner/General" },
  { question: "Ist Proteinpulver schädlich?", searchVolume: 600, stage: "awareness", persona: "Beginner/General" },
  { question: "Wie viel Proteinpulver am Tag?", searchVolume: 450, stage: "awareness", persona: "Bodybuilder" },
  { question: "Proteinpulver Test", searchVolume: 4600, stage: "consideration", persona: "Sports Enthusiast" },
  { question: "Welches Proteinpulver ist das beste?", searchVolume: 1000, stage: "consideration", persona: "Bodybuilder" },
  { question: "Veganes Proteinpulver Test", searchVolume: 1200, stage: "consideration", persona: "Beauty Affinity" },
  { question: "DM Proteinpulver", searchVolume: 3200, stage: "decision", persona: "Beginner/General" },
  { question: "Rossmann Proteinriegel", searchVolume: 2000, stage: "decision", persona: "Beginner/General" },
  { question: "Wo kann man ESN kaufen?", searchVolume: 100, stage: "decision", persona: "Bodybuilder" },
];

type Sentiment = "positive" | "neutral" | "negative";

function analyzeSentiment(response: string, brand: string): Sentiment {
  const sentences = response.split(/[.!?]+/).filter(s => 
    s.toLowerCase().includes(brand.toLowerCase())
  );
  if (sentences.length === 0) return "neutral";
  
  const positiveWords = ["beste", "empfohlen", "hochwertig", "premium", "beliebt", "trusted", "quality", "recommended", "top"];
  const negativeWords = ["teuer", "überteuert", "probleme", "bedenken", "avoid", "expensive"];
  
  let pos = 0, neg = 0;
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    positiveWords.forEach(w => { if (lower.includes(w)) pos++; });
    negativeWords.forEach(w => { if (lower.includes(w)) neg++; });
  });
  
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function extractBrands(response: string) {
  const lower = response.toLowerCase();
  return ALL_BRANDS
    .map(brand => ({ brand, pos: lower.indexOf(brand.toLowerCase()) }))
    .filter(b => b.pos !== -1)
    .sort((a, b) => a.pos - b.pos)
    .map((b, i) => ({
      brand: b.brand,
      position: i + 1,
      sentiment: analyzeSentiment(response, b.brand),
    }));
}

export async function GET() {
  console.log("🚀 Quick Analysis - Real AI data");
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY!, timeout: 15000 });
  const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  
  const results: any[] = [];
  
  // Query each question once per platform
  for (const q of QUESTIONS) {
    console.log(`📝 ${q.question}`);
    
    // ChatGPT
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: q.question }],
        max_tokens: 400,
        temperature: 0.7,
      });
      const response = completion.choices[0]?.message?.content || "";
      if (response) {
        results.push({
          platform: "ChatGPT",
          question: q.question,
          stage: q.stage,
          persona: q.persona,
          response: response.substring(0, 600),
          brands: extractBrands(response),
        });
      }
    } catch (e: any) {
      console.error(`ChatGPT error: ${e.message}`);
    }
    
    // Gemini
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(q.question);
        const response = result.response.text() || "";
        if (response) {
          results.push({
            platform: "Gemini",
            question: q.question,
            stage: q.stage,
            persona: q.persona,
            response: response.substring(0, 600),
            brands: extractBrands(response),
          });
        }
      } catch (e: any) {
        console.error(`Gemini error: ${e.message}`);
      }
    }
  }
  
  // Calculate metrics
  const platforms = [...new Set(results.map(r => r.platform))];
  
  // Share of Voice by Platform
  const shareOfVoiceByPlatform: Record<string, Record<string, number>> = {};
  platforms.forEach(p => {
    const pResults = results.filter(r => r.platform === p);
    const counts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { counts[b] = 0; });
    pResults.forEach(r => r.brands.forEach((b: any) => { counts[b.brand]++; }));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    shareOfVoiceByPlatform[p] = {};
    ALL_BRANDS.forEach(b => {
      shareOfVoiceByPlatform[p][b] = total > 0 ? Math.round((counts[b] / total) * 1000) / 10 : 0;
    });
  });
  
  // Top Questions
  const topQuestions = QUESTIONS.map(q => {
    const qResults = results.filter(r => r.question === q.question);
    const counts: Record<string, number> = {};
    ALL_BRANDS.forEach(b => { counts[b] = 0; });
    qResults.forEach(r => r.brands.forEach((b: any) => { counts[b.brand]++; }));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      ...q,
      winner: sorted[0][1] > 0 ? sorted[0][0] : null,
      winnerShare: total > 0 ? Math.round((sorted[0][1] / total) * 1000) / 10 : 0,
      moreNutrition: total > 0 ? Math.round((counts["More Nutrition"] / total) * 1000) / 10 : 0,
      esn: total > 0 ? Math.round((counts["ESN"] / total) * 1000) / 10 : 0,
      myprotein: total > 0 ? Math.round((counts["Myprotein"] / total) * 1000) / 10 : 0,
      foodspring: total > 0 ? Math.round((counts["Foodspring"] / total) * 1000) / 10 : 0,
      rockaNutrition: total > 0 ? Math.round((counts["Rocka Nutrition"] / total) * 1000) / 10 : 0,
    };
  });
  
  // Sentiment
  const sentiment: Record<string, any> = {};
  ALL_BRANDS.forEach(brand => {
    const mentions = results.flatMap(r => r.brands).filter((b: any) => b.brand === brand);
    const total = mentions.length;
    sentiment[brand] = {
      positive: total > 0 ? Math.round((mentions.filter((m: any) => m.sentiment === "positive").length / total) * 1000) / 10 : 0,
      neutral: total > 0 ? Math.round((mentions.filter((m: any) => m.sentiment === "neutral").length / total) * 1000) / 10 : 0,
      negative: total > 0 ? Math.round((mentions.filter((m: any) => m.sentiment === "negative").length / total) * 1000) / 10 : 0,
    };
  });
  
  // Sample responses for each stage
  const sampleResponses: Record<string, any[]> = { awareness: [], consideration: [], decision: [] };
  ["awareness", "consideration", "decision"].forEach(stage => {
    sampleResponses[stage] = results
      .filter(r => r.stage === stage)
      .slice(0, 3)
      .map(r => ({
        platform: r.platform,
        question: r.question,
        response: r.response,
        sentiment: r.brands.length > 0 ? r.brands[0].sentiment : "neutral",
        brandMentions: r.brands.map((b: any) => b.brand),
      }));
  });
  
  console.log(`✅ Complete: ${results.length} responses`);
  
  return NextResponse.json({
    success: true,
    analysisDate: new Date().toISOString().split("T")[0],
    platforms,
    totalResponses: results.length,
    shareOfVoiceByPlatform,
    topQuestions,
    sentiment,
    sampleResponses,
    rawResults: results,
  });
}
