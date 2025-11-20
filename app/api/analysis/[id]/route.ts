import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET analysis status and results
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
          take: 50,
          orderBy: { searchVolume: "desc" },
        },
        aiTestResults: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
        competitors_detected: true,
        insights: {
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

    // Calculate summary statistics
    const stats = {
      totalQuestions: analysis.discoveredQuestions.length,
      totalTests: analysis.aiTestResults.length,
      totalMentions: analysis.aiTestResults.filter((r) => r.brandMentioned).length,
      mentionRate:
        analysis.aiTestResults.length > 0
          ? (analysis.aiTestResults.filter((r) => r.brandMentioned).length /
              analysis.aiTestResults.length) *
            100
          : 0,
      avgPosition:
        analysis.aiTestResults.filter((r) => r.position !== null).length > 0
          ? analysis.aiTestResults
              .filter((r) => r.position !== null)
              .reduce((sum, r) => sum + (r.position || 0), 0) /
            analysis.aiTestResults.filter((r) => r.position !== null).length
          : null,
    };

    // Platform breakdown
    const platformStats = {
      chatgpt: {
        tests: analysis.aiTestResults.filter((r) => r.platform === "chatgpt").length,
        mentions: analysis.aiTestResults.filter(
          (r) => r.platform === "chatgpt" && r.brandMentioned
        ).length,
      },
      gemini: {
        tests: analysis.aiTestResults.filter((r) => r.platform === "gemini").length,
        mentions: analysis.aiTestResults.filter(
          (r) => r.platform === "gemini" && r.brandMentioned
        ).length,
      },
    };

    platformStats.chatgpt.mentionRate =
      platformStats.chatgpt.tests > 0
        ? (platformStats.chatgpt.mentions / platformStats.chatgpt.tests) * 100
        : 0;

    platformStats.gemini.mentionRate =
      platformStats.gemini.tests > 0
        ? (platformStats.gemini.mentions / platformStats.gemini.tests) * 100
        : 0;

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        status: analysis.status,
        progress: analysis.progress,
        overallScore: analysis.overallScore,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        error: analysis.error,
      },
      stats,
      platformStats,
      questions: analysis.discoveredQuestions,
      competitors: analysis.competitors_detected,
      insights: analysis.insights,
      sampleResults: analysis.aiTestResults.slice(0, 10), // First 10 for preview
    });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
