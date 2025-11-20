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
          take: 5,
          orderBy: { searchVolume: "desc" },
        },
        aiTestResults: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        insights: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Stats
    const stats = {
      totalQuestions: analysis.discoveredQuestions.length,
      totalTests: analysis.aiTestResults.length,
      chatgptTests: analysis.aiTestResults.filter(r => r.platform === "chatgpt").length,
      geminiTests: analysis.aiTestResults.filter(r => r.platform === "gemini").length,
      brandMentioned: analysis.aiTestResults.filter(r => r.brandMentioned).length,
      insights: analysis.insights.length,
    };

    return NextResponse.json({
      success: true,
      analysisId: id,
      brand: analysis.brandOrKeyword,
      status: analysis.status,
      overallScore: analysis.overallScore,
      stats,
      sampleQuestions: analysis.discoveredQuestions.slice(0, 5).map(q => ({
        question: q.question,
        volume: q.searchVolume,
        category: q.category,
      })),
      sampleResults: analysis.aiTestResults.slice(0, 10).map(r => ({
        platform: r.platform,
        modelVersion: r.modelVersion,
        brandMentioned: r.brandMentioned,
        position: r.position,
        fullResponse: r.fullResponse?.substring(0, 200) + "...",
      })),
      insights: analysis.insights.map(i => ({
        title: i.title,
        priority: i.priority,
        category: i.category,
      })),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
