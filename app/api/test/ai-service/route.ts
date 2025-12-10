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
      
      const questionService = new EnhancedQuestionService(
        process.env.DATAFORSEO_LOGIN,
        process.env.DATAFORSEO_PASSWORD
      );
      
      const questions = await questionService.discoverQuestions({
        brandName: brand,
        category: "sportswear", // Example category
        maxQuestionsPerStage: 3,
        minSearchVolume: 50,
      });
      
      results.questions = questions.map(q => ({
        question: q.question,
        searchVolume: q.searchVolume,
        category: q.category,
        source: q.source,
        type: q.questionType,
      }));
      results.summary = {
        total: questions.length,
        byCategory: {
          awareness: questions.filter(q => q.category === "awareness").length,
          consideration: questions.filter(q => q.category === "consideration").length,
          decision: questions.filter(q => q.category === "decision").length,
        },
        bySource: questions.reduce((acc, q) => {
          acc[q.source || 'unknown'] = (acc[q.source || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
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

    // Test DataForSEO question generation
    if (testType === "dataforseo") {
      if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        return NextResponse.json({
          success: false,
          error: "DataForSEO credentials not configured",
        }, { status: 500 });
      }

      console.log("🔍 Testing DataForSEO question generation...");
      
      try {
        const dataForSEO = new DataForSEOService(
          process.env.DATAFORSEO_LOGIN,
          process.env.DATAFORSEO_PASSWORD
        );
        
        // Test brand questions
        const brandQuestions = await dataForSEO.getBrandQuestions(brand, 8);
        
        // Test category questions
        const categoryQuestions = await dataForSEO.getCategoryQuestions("general products", 5);
        
        results.dataforseo = {
          brandQuestions: brandQuestions.map(q => ({
            question: q.question,
            searchVolume: q.searchVolume,
            category: q.category,
          })),
          categoryQuestions: categoryQuestions.map(q => ({
            question: q.question,
            searchVolume: q.searchVolume,
            category: q.category,
          })),
        };
      } catch (error: any) {
        results.dataforseo = {
          error: error.message,
        };
      }
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
