import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService, ComprehensiveAnalysisResult } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 5 minutes for comprehensive analysis
export const maxDuration = 300;

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors } = body;

    if (!brandOrKeyword) {
      return NextResponse.json(
        { success: false, error: "Brand or keyword is required" },
        { status: 400 }
      );
    }

    // Check for required API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Parse competitors to array
    let competitorsArray: string[] = [];
    if (competitors) {
      if (typeof competitors === "string") {
        competitorsArray = competitors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      } else if (Array.isArray(competitors)) {
        competitorsArray = competitors;
      }
    }

    console.log(`🚀 [API] Starting analysis for: ${brandOrKeyword}`);

    // Create or get user
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

    // Run analysis directly (NOT in background - keeps function alive)
    runAnalysisAndSave(analysis.id, brandOrKeyword, domain, competitorsArray)
      .then(() => {
        console.log(`🎉 [API] Analysis ${analysis.id} completed successfully`);
      })
      .catch((error) => {
        console.error(`❌ [API] Analysis ${analysis.id} failed:`, error.message);
      });

    // Return immediately - analysis runs in background
    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started successfully",
    });
  } catch (error: any) {
    console.error("❌ [API] Error starting analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start analysis" },
      { status: 500 }
    );
  }
}

/**
 * Run the comprehensive analysis and save results
 */
async function runAnalysisAndSave(
  analysisId: string,
  brandOrKeyword: string,
  domain: string | undefined,
  competitors: string[]
) {
  const startTime = Date.now();

  try {
    // Progress callback with error handling
    const onProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { progress, currentStep: step },
        });
      } catch (error) {
        console.error(`⚠️ [PROGRESS] Failed to update: ${error}`);
      }
    };

    // Initialize comprehensive analysis service
    const analysisService = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      testsPerPlatform: 2, // Reduced for speed
      questionsPerStage: 3, // Reduced for speed
      onProgress,
    });

    // Run the analysis
    const result = await analysisService.runAnalysis();
    console.log(`✅ [SAVE] Analysis complete, saving ${result.rawData.questions.length} questions and ${result.rawData.analyses.length} analyses`);

    // Save discovered questions (batch for speed)
    await Promise.all(
      result.rawData.questions.map((question) =>
        prisma.discoveredQuestion.create({
          data: {
            analysisId,
            question: question.question,
            searchVolume: question.searchVolume,
            difficulty: question.difficulty,
            intent: question.intent,
            category: question.category,
            score: question.score,
          },
        })
      )
    );

    // Save AI test results (batch for speed)
    const testResults = result.rawData.analyses.flatMap((analysis) =>
      analysis.responses.map((response) => ({
        analysisId,
        questionId: null,
        question: response.question,
        platform: response.platform,
        brandMentioned: response.brandMentioned,
        position: response.brandPosition,
        sentiment: response.sentiment,
        context: response.contextExtract,
        fullResponse: response.fullResponse.substring(0, 5000), // Limit length
        citations: response.citedUrls,
      }))
    );

    // Save in batches of 20 for database performance
    for (let i = 0; i < testResults.length; i += 20) {
      const batch = testResults.slice(i, i + 20);
      await Promise.all(batch.map((data) => prisma.aITestResult.create({ data })));
    }

    // Save competitors
    await Promise.all(
      competitors.map((competitor) =>
        prisma.detectedCompetitor.create({
          data: {
            analysisId,
            competitorName: competitor,
            domain: competitor,
            overlapScore: 0,
          },
        })
      )
    );

    // Save journey stage insights
    await Promise.all(
      result.journeyStages.map((stage) =>
        prisma.aIInsight.create({
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
        })
      )
    );

    // Mark as completed
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Analysis complete!",
        completedAt: new Date(),
      },
    });

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`🎉 [SAVE] Completed ${analysisId} in ${totalTime.toFixed(1)}s`);
  } catch (error: any) {
    console.error(`❌ [SAVE] Error in ${analysisId}:`, error.message, error.stack);

    try {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "failed",
          progress: 0,
          currentStep: `Failed: ${error.message?.substring(0, 200) || "Unknown error"}`,
        },
      });
    } catch (updateError) {
      console.error(`❌ [SAVE] Failed to update status:`, updateError);
    }

    throw error;
  }
}
