import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 5 minutes for analysis
export const maxDuration = 300;

// Try to import waitUntil for Vercel, but don't fail if not available
let waitUntil: ((promise: Promise<unknown>) => void) | null = null;
try {
  // Dynamic import to avoid issues when not on Vercel
  const vercelFunctions = require("@vercel/functions");
  waitUntil = vercelFunctions.waitUntil;
} catch {
  // Not on Vercel or package not available - will run inline
  console.log("ℹ️ [API] @vercel/functions not available - running analysis inline");
}

export async function POST(request: Request) {
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

    console.log(`🚀 [API] Starting analysis for: ${brandOrKeyword}${category ? ` (category: ${category})` : ''}`);

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

    console.log(`✅ [API] Created analysis ${analysis.id}`);

    // Capture env vars
    const envVars = {
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      dataForSEOLogin: process.env.DATAFORSEO_LOGIN,
      dataForSEOPassword: process.env.DATAFORSEO_PASSWORD,
    };
    
    console.log(`🔧 [API] Captured env vars:`);
    console.log(`🔧 [API] - OPENAI: ${envVars.openaiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - GEMINI: ${envVars.geminiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - PERPLEXITY: ${envVars.perplexityApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - DATAFORSEO_LOGIN: ${envVars.dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    
    // Execute analysis - either in background (Vercel) or inline (local)
    const analysisPromise = executeAnalysis(analysis.id, brandOrKeyword, domain, competitorsArray, category, envVars);
    
    if (waitUntil) {
      // On Vercel: Use waitUntil to run in background
      console.log(`🔄 [API] Using Vercel waitUntil for background execution`);
      waitUntil(analysisPromise);
      
      // Return immediately so frontend can start polling
      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        message: "Analysis started (background)",
      });
    } else {
      // Local/non-Vercel: Run inline and wait for completion
      console.log(`🔄 [API] Running analysis inline (not on Vercel)`);
      
      // Run inline but don't block the response for too long
      // Start the analysis but return immediately, let it run in the Node.js event loop
      analysisPromise.catch((err) => {
        console.error(`❌ [API] Analysis failed:`, err);
      });
      
      // Return immediately - the analysis will continue in the background
      // This works in Node.js because the promise continues to execute
      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        message: "Analysis started",
      });
    }
  } catch (error: any) {
    console.error("❌ [API] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function executeAnalysis(
  analysisId: string,
  brandOrKeyword: string,
  domain: string | undefined,
  competitors: string[],
  category?: string,
  envVars?: {
    openaiApiKey: string;
    geminiApiKey?: string;
    perplexityApiKey?: string;
    dataForSEOLogin?: string;
    dataForSEOPassword?: string;
  }
) {
  const startTime = Date.now();
  console.log(`🔄 [EXEC] Starting execution for ${analysisId}`);
  console.log(`🔧 [EXEC] envVars passed: DATAFORSEO_LOGIN=${envVars?.dataForSEOLogin ? 'SET' : 'NOT SET'}`);

  try {
    // Progress callback
    const onProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { progress, currentStep: step },
        });
        console.log(`📊 [EXEC] Progress: ${progress}% - ${step}`);
      } catch (e) {
        console.error(`⚠️ [EXEC] Progress update failed: ${e}`);
      }
    };

    // Use passed env vars (from closure before waitUntil)
    const apiKey = envVars?.openaiApiKey || process.env.OPENAI_API_KEY!;
    const geminiKey = envVars?.geminiApiKey || process.env.GEMINI_API_KEY;
    const perplexityKey = envVars?.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
    const dataForSEOLogin = envVars?.dataForSEOLogin || process.env.DATAFORSEO_LOGIN;
    const dataForSEOPassword = envVars?.dataForSEOPassword || process.env.DATAFORSEO_PASSWORD;
    
    console.log(`🔧 [EXEC] Using credentials:`);
    console.log(`🔧 [EXEC] - OPENAI: ${apiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - GEMINI: ${geminiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - PERPLEXITY: ${perplexityKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - DATAFORSEO_LOGIN: ${dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - DATAFORSEO_PASSWORD: ${dataForSEOPassword ? 'SET' : 'NOT SET'}`);
    
    // Run analysis with statistical significance
    // 3 questions per stage × 3 platforms × 3 tests = 27 AI calls per stage = 81 total
    const service = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors,
      category,
      openaiApiKey: apiKey,
      geminiApiKey: geminiKey,
      perplexityApiKey: perplexityKey,
      dataForSEOLogin,
      dataForSEOPassword,
      testsPerPlatform: 3,    // 3 tests per platform for statistical significance
      questionsPerStage: 3,   // 3 questions per funnel stage
      onProgress,
    });

    const result = await service.runAnalysis();
    console.log(`✅ [EXEC] Analysis complete, saving results...`);

    // Save questions
    for (const q of result.rawData.questions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: q.difficulty,
          intent: q.intent,
          category: q.category,
          score: q.score,
        },
      });
    }

    // Save AI results
    for (const a of result.rawData.analyses) {
      for (const response of a.responses) {
        await prisma.aITestResult.create({
          data: {
            analysisId,
            questionId: null,
            question: response.question,
            platform: response.platform,
            brandMentioned: response.brandMentioned,
            position: response.brandPosition,
            sentiment: response.sentiment,
            context: response.contextExtract,
            fullResponse: response.fullResponse?.substring(0, 5000) || "",
            citations: response.citedUrls,
          },
        });
      }
    }

    // Save competitors
    for (const comp of competitors) {
      await prisma.detectedCompetitor.create({
        data: { analysisId, competitorName: comp, domain: comp, overlapScore: 0 },
      });
    }

    // Save insights
    for (const stage of result.journeyStages) {
      await prisma.aIInsight.create({
        data: {
          analysisId,
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
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Analysis complete!",
        completedAt: new Date(),
      },
    });

    console.log(`🎉 [EXEC] Completed ${analysisId} in ${(Date.now() - startTime) / 1000}s`);
  } catch (error: any) {
    console.error(`❌ [EXEC] Failed ${analysisId}:`, error.message);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "failed",
        progress: 0,
        currentStep: `Failed: ${error.message?.substring(0, 200) || "Unknown error"}`,
      },
    }).catch(e => console.error(`❌ [EXEC] Failed to update failure status: ${e}`));
  }
}
