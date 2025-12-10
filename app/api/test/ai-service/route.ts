import { NextResponse } from "next/server";
import { MultiPlatformAIService } from "@/lib/services/multi-platform-ai-service";
import { EnhancedQuestionService } from "@/lib/services/enhanced-question-service";
import { DataForSEOService } from "@/lib/services/dataforseo-service";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, testType = "quick" } = body;

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const results: any = { brand };

    // Test question discovery
    if (testType === "questions" || testType === "full") {
      console.log("🔍 Testing question discovery...");
      const questionService = new EnhancedQuestionService(process.env.AHREFS_API_KEY);
      const questions = await questionService.discoverQuestions({
        brandName: brand,
        maxQuestionsPerStage: 2, // Just 2 per stage for quick test
      });
      results.questions = questions;
      console.log(`✅ Discovered ${questions.length} questions`);
    }

    // Test AI platform querying
    if (testType === "ai" || testType === "full") {
      console.log("🤖 Testing AI platform querying...");
      const aiService = new MultiPlatformAIService(
        process.env.OPENAI_API_KEY!,
        process.env.GEMINI_API_KEY,
        1 // Just 1 test per platform for quick test
      );

      const testQuestion = `What is ${brand} known for?`;
      const analysis = await aiService.testQuestion(testQuestion, brand, [], 1);
      
      results.aiTest = {
        question: testQuestion,
        totalResponses: analysis.totalResponses,
        mentionRate: analysis.aggregated.mentionRate,
        avgPosition: analysis.aggregated.avgPosition,
        sentiment: analysis.aggregated.sentimentBreakdown,
        platformBreakdown: analysis.aggregated.platformBreakdown.map(p => ({
          platform: p.platform,
          mentionRate: p.mentionRate,
        })),
        sampleResponses: analysis.responses.slice(0, 3).map(r => ({
          platform: r.platform,
          brandMentioned: r.brandMentioned,
          sentiment: r.sentiment,
          excerpt: r.fullResponse.substring(0, 200) + "...",
        })),
      };
      console.log(`✅ AI test complete - ${analysis.aggregated.mentionRate}% mention rate`);
    }

    // Test DataForSEO directly
    if (testType === "dataforseo") {
      if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        return NextResponse.json({
          success: false,
          error: "DataForSEO credentials not configured",
          configured: {
            login: !!process.env.DATAFORSEO_LOGIN,
            password: !!process.env.DATAFORSEO_PASSWORD,
          }
        }, { status: 500 });
      }

      console.log("🔍 Testing DataForSEO API directly...");
      const dataForSEO = new DataForSEOService(
        process.env.DATAFORSEO_LOGIN,
        process.env.DATAFORSEO_PASSWORD
      );

      // Get ALL keywords first (not just questions) to see what's available
      const allKeywords = await dataForSEO.getBrandQuestions(brand, 15, false);
      // Also try with question filter
      const questions = await dataForSEO.getBrandQuestions(brand, 15, true);
      
      results.dataforseo = {
        allKeywordsFound: allKeywords.length,
        questionsFound: questions.length,
        sampleKeywords: allKeywords.slice(0, 8).map(q => ({
          keyword: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
        })),
        sampleQuestions: questions.slice(0, 5).map(q => ({
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
        })),
      };
      console.log(`✅ DataForSEO: ${allKeywords.length} keywords, ${questions.length} questions`);
    }

    // Quick test - just verify services are initialized
    if (testType === "quick") {
      results.status = "Services initialized successfully";
      results.openaiConfigured = !!process.env.OPENAI_API_KEY;
      results.geminiConfigured = !!process.env.GEMINI_API_KEY;
      results.dataForSEOConfigured = !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
    }

    return NextResponse.json({
      success: true,
      testType,
      results,
    });
  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Test failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "AI Service Test Endpoint",
    usage: {
      method: "POST",
      body: {
        brand: "string (required)",
        testType: "quick | questions | ai | full (optional, default: quick)",
      },
    },
    configured: {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      dataforseo: !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
      ahrefs: !!process.env.AHREFS_API_KEY,
    },
  });
}
