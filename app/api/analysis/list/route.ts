import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    // For demo purposes, we'll get all analyses
    // In production, you'd filter by authenticated user
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: {
            discoveredQuestions: true,
            aiTestResults: true,
            aiInsights: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      analyses: analyses.map((a: { id: string; brandOrKeyword: string; domain: string | null; status: string; progress: number; currentStep: string | null; createdAt: Date; completedAt: Date | null; _count: { discoveredQuestions: number; aiTestResults: number; aiInsights: number } }) => ({
        id: a.id,
        brandOrKeyword: a.brandOrKeyword,
        domain: a.domain,
        status: a.status,
        progress: a.progress,
        currentStep: a.currentStep,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        questionsCount: a._count.discoveredQuestions,
        testsCount: a._count.aiTestResults,
        insightsCount: a._count.aiInsights,
      })),
    });
  } catch (error: any) {
    console.error("Error listing analyses:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list analyses" },
      { status: 500 }
    );
  }
}
