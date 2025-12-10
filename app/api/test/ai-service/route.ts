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
        category: "general", // Include category
        maxQuestionsPerStage: 3,
        minSearchVolume: 100,
      });
      results.questions = questions.map(q => ({
        question: q.question,
        searchVolume: q.searchVolume,
        category: q.category,
        source: q.source,
      }));
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
      
      // Test the raw API call
      const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
      
      try {
        const rawResponse = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live", {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            keywords: [brand],
            location_code: 2840,
            language_code: "en",
            include_seed_keyword: true,
            limit: 20,
          }]),
        });

        const rawData = await rawResponse.json();
        
        // Debug: Check the actual structure
        const taskResult = rawData.tasks?.[0]?.result || [];
        const firstResult = taskResult[0] || {};
        
        // Try different possible locations for keywords
        const keywords = 
          firstResult.keywords ||  // keywords_for_keywords
          firstResult.items ||     // keyword_ideas  
          taskResult;              // result array itself might be keywords
        
        results.dataforseo = {
          httpStatus: rawResponse.status,
          apiStatusCode: rawData.status_code,
          resultCount: taskResult.length,
          resultKeys: Object.keys(firstResult),
          keywordsFound: Array.isArray(keywords) ? keywords.length : 0,
          sampleData: taskResult.slice(0, 3).map((r: any) => ({
            keyword: r.keyword,
            searchVolume: r.search_volume,
            keys: Object.keys(r).slice(0, 10),
          })),
          cost: rawData.cost,
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
