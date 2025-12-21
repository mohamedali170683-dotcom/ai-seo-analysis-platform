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
