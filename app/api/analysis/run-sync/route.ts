import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 5 minutes for analysis
export const maxDuration = 300;

/**
 * Synchronous analysis endpoint - runs the full analysis inline
 * More reliable for local development and debugging
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors, category } = body;

    if (!brandOrKeyword) {
      return NextResponse.json({ success: false, error: "Brand is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // Parse competitors
    let competitorsArray: string[] = [];
    if (competitors) {
      if (typeof competitors === "string") {
        competitorsArray = competitors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      } else if (Array.isArray(competitors)) {
        competitorsArray = competitors;
      }
    }

    console.log(`🚀 [SYNC] Starting synchronous analysis for: ${brandOrKeyword}`);

    // Create user
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: { email: "demo@example.com" },
    });

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        brandOrKeyword,
        domain: domain || null,
        competitors: competitorsArray,
        status: "running",
        progress: 1,
        currentStep: "Starting...",
      },
    });

    console.log(`✅ [SYNC] Created analysis ${analysis.id}`);

    // Log env vars
    console.log(`🔧 [SYNC] Environment:`);
    console.log(`   - OPENAI: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   - GEMINI: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   - PERPLEXITY: ${process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET'}`);

    // Progress callback
    const onProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { progress, currentStep: step },
        });
        console.log(`📊 [SYNC] Progress: ${progress}% - ${step}`);
      } catch (e) {
        console.error(`⚠️ [SYNC] Progress update failed: ${e}`);
      }
    };

    // Run the analysis synchronously
    const service = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors: competitorsArray,
      category,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      dataForSEOLogin: process.env.DATAFORSEO_LOGIN,
      dataForSEOPassword: process.env.DATAFORSEO_PASSWORD,
      testsPerPlatform: 2,    // Fewer tests for faster results
      questionsPerStage: 3,   // 3 questions per funnel stage
      onProgress,
    });

    const result = await service.runAnalysis();
    console.log(`✅ [SYNC] Analysis complete, saving results...`);

    // Save questions
    for (const q of result.rawData.questions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId: analysis.id,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: q.difficulty,
          intent: q.intent,
          category: q.category,
          score: q.score,
        },
      });
    }

    // Save AI results with sources
    for (const a of result.rawData.analyses) {
      for (const response of a.responses) {
        await prisma.aITestResult.create({
          data: {
            analysisId: analysis.id,
            questionId: null,
            question: response.question,
            platform: response.platform,
            brandMentioned: response.brandMentioned,
            position: response.brandPosition,
            sentiment: response.sentiment,
            context: response.contextExtract,
            fullResponse: response.fullResponse || "",  // Store full response - no truncation
            citations: response.citedUrls,
            sources: (response.sources || []) as any,
            hasGrounding: response.hasGrounding || false,
            isRealAPI: response.isRealAPI || false,
          },
        });
      }
    }

    // Save competitors
    for (const comp of competitorsArray) {
      await prisma.detectedCompetitor.create({
        data: { analysisId: analysis.id, competitorName: comp, domain: comp, overlapScore: 0 },
      });
    }

    // Save insights
    for (const stage of result.journeyStages) {
      await prisma.aIInsight.create({
        data: {
          analysisId: analysis.id,
          category: "journey_stage",
          priority: stage.stage === "awareness" ? 1 : stage.stage === "consideration" ? 2 : 3,
          title: `${stage.stageLabel} Analysis`,
          finding: stage.recommendation.commonPattern,
          dataEvidence: `${stage.portrayal.totalTests} tests, ${stage.portrayal.mentionRate}% mention rate`,
          aiReasoning: stage.recommendation.contentType,
          actions: [stage.recommendation.focusedAction],
          expectedImpact: {
            stage: stage.stage,
            stageLabel: stage.stageLabel,
            stageDescription: stage.stageDescription,
            icon: stage.icon,
            color: stage.color,
            questions: stage.questions,
            portrayal: stage.portrayal,
            recommendation: stage.recommendation,
          },
          effort: "medium",
          timeline: "4-8 weeks",
          confidence: "high",
        },
      });
    }

    // Mark completed
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Analysis complete!",
        completedAt: new Date(),
      },
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`🎉 [SYNC] Completed ${analysis.id} in ${elapsed}s`);

    // Return the full result
    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      elapsed: `${elapsed}s`,
      result: {
        overallScore: result.overallScore,
        totalTests: result.totalTests,
        totalQuestions: result.totalQuestions,
        journeyStages: result.journeyStages.map(s => ({
          stage: s.stage,
          stageLabel: s.stageLabel,
          visibilityScore: s.portrayal.visibilityScore,
          mentionRate: s.portrayal.mentionRate,
        })),
      },
      viewUrl: `/analysis/${analysis.id}`,
    });

  } catch (error: any) {
    console.error("❌ [SYNC] Error:", error.message);
    console.error(error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Synchronous Analysis Endpoint",
    description: "Runs the full analysis inline and returns the result when complete",
    usage: {
      method: "POST",
      body: {
        brandOrKeyword: "string (required) - e.g., 'Nike', 'Shopify'",
        domain: "string (optional) - e.g., 'nike.com'",
        competitors: "string or array (optional) - e.g., 'Adidas, Puma'",
        category: "string (optional) - e.g., 'running shoes'",
      },
    },
    note: "This endpoint waits for the full analysis to complete (30-60 seconds). Use /api/analysis/run for async execution.",
  });
}
