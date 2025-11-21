import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        discoveredQuestions: {
          orderBy: { score: "desc" },
        },
        aiTestResults: {
          orderBy: { createdAt: "desc" },
        },
        detectedCompetitors: true,
        aiInsights: {
          orderBy: [{ priority: "asc" }, { correlationScore: "desc" }],
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Calculate overall statistics
    const totalTests = analysis.aiTestResults.length;
    const totalMentions = analysis.aiTestResults.filter((r) => r.brandMentioned).length;
    const overallMentionRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0;

    // Platform breakdown
    const platformStats: any = {
      chatgpt: {
        tests: analysis.aiTestResults.filter((r) => r.platform === "chatgpt").length,
        mentions: analysis.aiTestResults.filter(
          (r) => r.platform === "chatgpt" && r.brandMentioned
        ).length,
        mentionRate: 0,
      },
      gemini: {
        tests: analysis.aiTestResults.filter((r) => r.platform === "gemini").length,
        mentions: analysis.aiTestResults.filter(
          (r) => r.platform === "gemini" && r.brandMentioned
        ).length,
        mentionRate: 0,
      },
    };

    // Calculate mention rates
    platformStats.chatgpt.mentionRate =
      platformStats.chatgpt.tests > 0
        ? (platformStats.chatgpt.mentions / platformStats.chatgpt.tests) * 100
        : 0;
    platformStats.gemini.mentionRate =
      platformStats.gemini.tests > 0
        ? (platformStats.gemini.mentions / platformStats.gemini.tests) * 100
        : 0;

    // Calculate average position
    const positions = analysis.aiTestResults
      .filter((r) => r.position !== null)
      .map((r) => r.position as number);
    const avgPosition =
      positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

    // Calculate visibility score (0-100)
    const positionScore = avgPosition ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const visibilityScore = overallMentionRate * 0.7 + positionScore * 0.3;

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
          visibilityScore: Math.round(visibilityScore * 10) / 10,
          overallMentionRate: Math.round(overallMentionRate * 10) / 10,
          avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          totalQuestions: analysis.discoveredQuestions.length,
          totalTests,
          totalMentions,
          platformStats,
        },
        discoveredQuestions: analysis.discoveredQuestions,
        aiTestResults: analysis.aiTestResults,
        detectedCompetitors: analysis.detectedCompetitors,
        aiInsights: analysis.aiInsights,
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
