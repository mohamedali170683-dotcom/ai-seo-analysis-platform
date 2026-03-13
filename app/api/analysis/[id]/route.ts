import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { detectPatterns, generateExecutiveSummary } from "@/lib/services/analysis-insights-engine";
import { AIResponse } from "@/lib/services/multi-platform-ai-service";

// Stage weights for weighted scoring
const STAGE_WEIGHTS = {
  awareness: 0.20,
  consideration: 0.35,
  decision: 0.45,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Fetch analysis with all related data
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        discoveredQuestions: {
          orderBy: { createdAt: "asc" },
        },
        aiTestResults: {
          orderBy: { createdAt: "asc" },
        },
        detectedCompetitors: {
          orderBy: { createdAt: "asc" },
        },
        aiInsights: {
          orderBy: { priority: "asc" },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // --- STALE ANALYSIS RECOVERY ---
    // If analysis has been "running" for more than 8 minutes, the serverless function
    // likely timed out silently. Recover by marking it based on saved results.
    const STALE_THRESHOLD_MS = 8 * 60 * 1000; // 8 minutes
    if (
      analysis.status === "running" &&
      Date.now() - analysis.createdAt.getTime() > STALE_THRESHOLD_MS
    ) {
      const savedResults = analysis.aiTestResults.length;
      console.warn(`⏱️ [API] Analysis ${id} stuck in "running" for >8min. Saved results: ${savedResults}`);

      if (savedResults > 0) {
        // Has partial results — mark as completed so the user can see what was collected
        await prisma.analysis.update({
          where: { id },
          data: {
            status: "completed",
            progress: 100,
            currentStep: `Partial results (${savedResults} responses) — server timed out`,
            completedAt: new Date(),
          },
        });
        analysis.status = "completed" as any;
        analysis.progress = 100;
        analysis.currentStep = `Partial results (${savedResults} responses) — server timed out`;
        analysis.completedAt = new Date();
        console.log(`♻️ [API] Recovered analysis ${id} with ${savedResults} partial results`);
      } else {
        // No results at all — mark as failed
        await prisma.analysis.update({
          where: { id },
          data: {
            status: "failed",
            currentStep: "Analysis timed out — no results were saved. Please try with fewer questions.",
          },
        });
        analysis.status = "failed" as any;
        analysis.currentStep = "Analysis timed out — no results were saved. Please try with fewer questions.";
        console.log(`❌ [API] Marked analysis ${id} as failed (no results after timeout)`);
      }
    }

    // Transform aiInsights to journeyStages format
    const journeyStages = analysis.aiInsights
      .filter((i: any) => i.category === "journey_stage")
      .map((insight: any) => {
        // expectedImpact contains the full journey stage data
        const stageData = typeof insight.expectedImpact === 'string' 
          ? JSON.parse(insight.expectedImpact)
          : insight.expectedImpact;
        return stageData;
      })
      .filter((s: any) => s && s.stage); // Filter out any invalid entries

    // Calculate overall stats
    const totalTests = analysis.aiTestResults.length;
    const totalMentions = analysis.aiTestResults.filter((t: any) => t.brandMentioned).length;
    const mentionRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0;
    
    // Calculate position score (average position when mentioned)
    const positions = analysis.aiTestResults
      .filter((t: any) => t.position !== null)
      .map((t: any) => t.position as number);
    const avgPosition = positions.length > 0 
      ? positions.reduce((a: number, b: number) => a + b, 0) / positions.length 
      : 0;
    const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    
    // Calculate sentiment score
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    analysis.aiTestResults.forEach((t: any) => {
      if (t.sentiment && Object.prototype.hasOwnProperty.call(sentimentCounts, t.sentiment)) {
        sentimentCounts[t.sentiment as keyof typeof sentimentCounts]++;
      }
    });
    const sentimentTotal = Object.values(sentimentCounts).reduce((a: number, b: number) => a + b, 0);
    const positivePct = sentimentTotal > 0 ? (sentimentCounts.positive / sentimentTotal) * 100 : 0;
    const negativePct = sentimentTotal > 0 ? (sentimentCounts.negative / sentimentTotal) * 100 : 0;
    const sentimentScore = Math.max(0, Math.min(100, ((positivePct - negativePct + 100) / 2)));
    
    // Calculate overall visibility score
    const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));
    
    // Count responses by platform for debugging
    const platformCounts: Record<string, number> = {};
    analysis.aiTestResults.forEach((t: any) => {
      platformCounts[t.platform] = (platformCounts[t.platform] || 0) + 1;
    });
    console.log(`[API] Analysis ${id} platform breakdown:`, platformCounts);

    // Generate executive summary from analysis results
    let executiveSummary = null;
    let patterns = null;
    
    try {
      // Convert aiTestResults to AIResponse format for pattern detection
      const aiResponses: AIResponse[] = analysis.aiTestResults.map((t: any) => ({
        platform: t.platform,
        question: t.question,
        brandMentioned: t.brandMentioned,
        brandPosition: t.position,
        sentiment: t.sentiment || 'neutral',
        contextExtract: t.context || '',
        fullResponse: t.fullResponse || '',
        citedUrls: t.citations || [],
        competitorsMentioned: [],
        hasGrounding: t.hasGrounding || false,
        sources: t.sources || [],
        // Additional required fields
        modelVersion: 'unknown',
        queryNumber: 1,
        recommendationType: null,
        isRealAPI: t.isRealAPI ?? true,
      }));

      // Get stage visibility scores
      const stageScores = {
        awareness: journeyStages.find((s: any) => s.stage === 'awareness')?.portrayal?.visibilityScore || 0,
        consideration: journeyStages.find((s: any) => s.stage === 'consideration')?.portrayal?.visibilityScore || 0,
        decision: journeyStages.find((s: any) => s.stage === 'decision')?.portrayal?.visibilityScore || 0,
      };

      // Calculate weighted overall score
      // All stages count — 0% visibility in a stage pulls the overall score down
      let weightedScore = 0;
      for (const [stage, score] of Object.entries(stageScores)) {
        const weight = STAGE_WEIGHTS[stage as keyof typeof STAGE_WEIGHTS] || 0.33;
        weightedScore += score * weight;
      }
      const overallWeightedScore = Math.round(weightedScore);

      // Detect patterns
      patterns = detectPatterns(aiResponses, analysis.brandOrKeyword, analysis.competitors || []);

      // Generate executive summary
      executiveSummary = generateExecutiveSummary(
        analysis.brandOrKeyword,
        overallWeightedScore,
        stageScores,
        patterns,
        aiResponses
      );
    } catch (summaryError) {
      console.error("Failed to generate executive summary:", summaryError);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        competitors: analysis.competitors,
        category: analysis.category,
        selectedPlatforms: analysis.selectedPlatforms,
        tier: analysis.tier,
        status: analysis.status,
        progress: analysis.progress,
        currentStep: analysis.currentStep,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        stats: {
          totalTests,
          totalQuestions: analysis.discoveredQuestions.length,
          mentionRate: Math.round(mentionRate * 10) / 10,
          visibilityScore,
          avgPosition: Math.round(avgPosition * 10) / 10,
          platformBreakdown: platformCounts,
        },
        journeyStages,
        discoveredQuestions: analysis.discoveredQuestions,
        aiTestResults: analysis.aiTestResults,
        detectedCompetitors: analysis.detectedCompetitors,
        aiInsights: analysis.aiInsights,
        // New fields for executive summary
        executiveSummary,
        patterns,
        stageWeights: STAGE_WEIGHTS,
      },
      error: analysis.status === "failed" ? analysis.currentStep : null,
    });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Check if analysis exists
    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Delete the analysis and all related data (cascade delete)
    await prisma.analysis.delete({
      where: { id },
    });

    console.log(`[API] Deleted analysis ${id} (${analysis.brandOrKeyword})`);

    return NextResponse.json({
      success: true,
      message: `Analysis "${analysis.brandOrKeyword}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
