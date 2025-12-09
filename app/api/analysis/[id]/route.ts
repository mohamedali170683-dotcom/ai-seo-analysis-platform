import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

    // Extract journey stage data from AI insights
    const journeyStageInsights = analysis.aiInsights.filter(
      (insight) => insight.category === "journey_stage"
    );

    // Format journey stages for the report
    const journeyStages = journeyStageInsights.map((insight) => {
      const expectedImpact = insight.expectedImpact as any;
      if (expectedImpact && typeof expectedImpact === "object") {
        return {
          stage: expectedImpact.stage,
          stageLabel: expectedImpact.stageLabel,
          stageDescription: expectedImpact.stageDescription || "",
          icon: expectedImpact.icon || "Brain",
          color: expectedImpact.color || "from-blue-500 to-blue-600",
          questions: expectedImpact.questions || [],
          portrayal: expectedImpact.portrayal || {},
          recommendation: expectedImpact.recommendation || {},
        };
      }
      return null;
    }).filter(Boolean);

    // Calculate overall stats
    const totalTests = analysis.aiTestResults.length;
    const totalQuestions = analysis.discoveredQuestions.length;
    
    // Calculate overall visibility score from journey stages
    let overallScore = 0;
    if (journeyStages.length > 0) {
      const avgVisibilityScore = journeyStages.reduce(
        (sum, stage) => sum + (stage.portrayal?.visibilityScore || 0),
        0
      ) / journeyStages.length;
      overallScore = Math.round(avgVisibilityScore);
    }

    // Calculate scoring methodology
    const allMentions = analysis.aiTestResults.filter((r) => r.brandMentioned).length;
    const mentionRate = totalTests > 0 ? (allMentions / totalTests) * 100 : 0;
    
    const positions = analysis.aiTestResults
      .filter((r) => r.position !== null)
      .map((r) => r.position as number);
    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : 0;
    const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;

    const sentiments = analysis.aiTestResults
      .filter((r) => r.sentiment !== null)
      .map((r) => r.sentiment!);
    const positiveCount = sentiments.filter((s) => s === "positive").length;
    const negativeCount = sentiments.filter((s) => s === "negative").length;
    const sentimentScore = sentiments.length > 0
      ? Math.max(0, Math.min(100, ((positiveCount - negativeCount) / sentiments.length) * 100 + 50))
      : 50;

    const scoringMethodology = {
      mentionRate: {
        weight: 50,
        description: "How often your brand appears in AI responses",
        yourScore: Math.round(mentionRate),
        calculation: "(Mentions ÷ Total Tests) × 100",
      },
      averagePosition: {
        weight: 30,
        description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
        yourScore: Math.round(positionScore),
        calculation: "100 - ((Avg Position - 1) × 20)",
      },
      sentiment: {
        weight: 20,
        description: "How positively your brand is portrayed",
        yourScore: Math.round(sentimentScore),
        calculation: "(Positive% - Negative%) normalized to 0-100",
      },
    };

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        competitors: analysis.competitors,
        status: analysis.status,
        progress: analysis.progress,
        currentStep: analysis.currentStep,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        discoveredQuestions: analysis.discoveredQuestions,
        aiTestResults: analysis.aiTestResults,
        detectedCompetitors: analysis.detectedCompetitors,
        aiInsights: analysis.aiInsights,
        error: analysis.status === "failed" ? analysis.currentStep : null,
        journeyStages,
        stats: {
          totalTests,
          totalQuestions,
          visibilityScore: overallScore,
        },
        scoringMethodology,
      },
    });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
