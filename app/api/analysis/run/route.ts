import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService, ComprehensiveAnalysisResult } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 10 minutes for comprehensive analysis (Pro plan)
export const maxDuration = 600;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors, testsPerPlatform, questionsPerStage } = body;

    if (!brandOrKeyword) {
      return NextResponse.json(
        { success: false, error: "Brand or keyword is required" },
        { status: 400 }
      );
    }

    // Check for required API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    // Parse competitors to array
    let competitorsArray: string[] = [];
    if (competitors) {
      if (typeof competitors === "string") {
        competitorsArray = competitors
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);
      } else if (Array.isArray(competitors)) {
        competitorsArray = competitors;
      }
    }

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
        progress: 0,
        currentStep: "Initializing...",
      },
    });

    console.log(`🚀 [ANALYSIS] Started analysis ${analysis.id} for: ${brandOrKeyword}`);

    // Run comprehensive analysis in background
    runComprehensiveAnalysis(
      analysis.id,
      brandOrKeyword,
      domain,
      competitorsArray,
      testsPerPlatform || 5,
      questionsPerStage || 4
    ).catch((error) => {
      console.error(`❌ [ANALYSIS] Failed for ${analysis.id}:`, error);
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started successfully",
    });
  } catch (error: any) {
    console.error("Error starting analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start analysis" },
      { status: 500 }
    );
  }
}

/**
 * Run the comprehensive analysis and save results
 */
async function runComprehensiveAnalysis(
  analysisId: string,
  brandOrKeyword: string,
  domain: string | undefined,
  competitors: string[],
  testsPerPlatform: number,
  questionsPerStage: number
) {
  const startTime = Date.now();

  try {
    // Progress callback
    const onProgress = async (progress: number, step: string) => {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { progress, currentStep: step },
      });
    };

    // Initialize comprehensive analysis service
    const analysisService = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      ahrefsApiKey: process.env.AHREFS_API_KEY,
      testsPerPlatform,
      questionsPerStage,
      onProgress,
    });

    // Run the analysis
    const result = await analysisService.runAnalysis();

    // Save discovered questions
    for (const question of result.rawData.questions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId,
          question: question.question,
          searchVolume: question.searchVolume,
          difficulty: question.difficulty,
          intent: question.intent,
          category: question.category,
          score: question.score,
        },
      });
    }

    // Save AI test results
    for (const analysis of result.rawData.analyses) {
      for (const response of analysis.responses) {
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
            fullResponse: response.fullResponse,
            citations: response.citedUrls,
          },
        });
      }
    }

    // Save competitors
    for (const competitor of competitors) {
      await prisma.detectedCompetitor.create({
        data: {
          analysisId,
          competitorName: competitor,
          domain: competitor,
          overlapScore: 0,
        },
      });
    }

    // Save journey stage insights
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
    console.log(`🎉 [ANALYSIS] Completed ${analysisId} in ${totalTime.toFixed(1)}s`);
  } catch (error: any) {
    console.error(`❌ [ANALYSIS] Error in ${analysisId}:`, error);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "failed",
        progress: 0,
        currentStep: `Failed: ${error.message}`,
      },
    });

    throw error;
  }
}
