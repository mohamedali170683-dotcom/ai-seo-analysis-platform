import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 5 minutes for analysis
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors } = body;

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

    console.log(`🚀 [API] Starting analysis for: ${brandOrKeyword}`);

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

    // Run analysis in background (don't await)
    executeAnalysis(analysis.id, brandOrKeyword, domain, competitorsArray);

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started",
    });
  } catch (error: any) {
    console.error("❌ [API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function executeAnalysis(
  analysisId: string,
  brandOrKeyword: string,
  domain: string | undefined,
  competitors: string[]
) {
  const startTime = Date.now();
  console.log(`🔄 [EXEC] Starting execution for ${analysisId}`);

  try {
    // Progress callback
    const onProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { progress, currentStep: step },
        });
      } catch (e) {
        console.error(`⚠️ [EXEC] Progress update failed: ${e}`);
      }
    };

    // Run analysis
    const service = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      testsPerPlatform: 2,
      questionsPerStage: 3,
      onProgress,
    });

    const result = await service.runAnalysis();
    console.log(`✅ [EXEC] Analysis complete, saving results...`);

    // Save questions
    for (const q of result.rawData.questions) {
      try {
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
      } catch (e) {
        console.error(`⚠️ [EXEC] Failed to save question: ${e}`);
      }
    }

    // Save AI results
    for (const analysis of result.rawData.analyses) {
      for (const response of analysis.responses) {
        try {
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
        } catch (e) {
          console.error(`⚠️ [EXEC] Failed to save AI result: ${e}`);
        }
      }
    }

    // Save competitors
    for (const comp of competitors) {
      try {
        await prisma.detectedCompetitor.create({
          data: { analysisId, competitorName: comp, domain: comp, overlapScore: 0 },
        });
      } catch (e) {
        console.error(`⚠️ [EXEC] Failed to save competitor: ${e}`);
      }
    }

    // Save insights
    for (const stage of result.journeyStages) {
      try {
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
      } catch (e) {
        console.error(`⚠️ [EXEC] Failed to save insight: ${e}`);
      }
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
    console.error(`❌ [EXEC] Failed ${analysisId}:`, error.message, error.stack);

    try {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "failed",
          progress: 0,
          currentStep: `Failed: ${error.message?.substring(0, 200) || "Unknown error"}`,
        },
      });
    } catch (e) {
      console.error(`❌ [EXEC] Failed to update failure status: ${e}`);
    }
  }
}
