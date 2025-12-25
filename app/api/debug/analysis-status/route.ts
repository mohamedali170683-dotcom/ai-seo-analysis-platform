import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Debug endpoint to check all analyses and their status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Get specific analysis with all related data
      const analysis = await prisma.analysis.findUnique({
        where: { id },
        include: {
          aiTestResults: {
            select: {
              id: true,
              platform: true,
              brandMentioned: true,
              createdAt: true,
            },
            take: 5,
          },
          discoveredQuestions: {
            select: {
              id: true,
              question: true,
            },
            take: 5,
          },
        },
      });

      if (!analysis) {
        return NextResponse.json({
          success: false,
          error: "Analysis not found",
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        analysis: {
          id: analysis.id,
          brandOrKeyword: analysis.brandOrKeyword,
          status: analysis.status,
          progress: analysis.progress,
          currentStep: analysis.currentStep,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt,
          updatedAt: analysis.updatedAt,
          testResultsCount: analysis.aiTestResults.length,
          questionsCount: analysis.discoveredQuestions.length,
          recentTestResults: analysis.aiTestResults,
          recentQuestions: analysis.discoveredQuestions,
        },
      });
    }

    // Get all analyses
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: {
            aiTestResults: true,
            discoveredQuestions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: analyses.length,
      analyses: analyses.map(a => ({
        id: a.id,
        brandOrKeyword: a.brandOrKeyword,
        status: a.status,
        progress: a.progress,
        currentStep: a.currentStep,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        updatedAt: a.updatedAt,
        testResultsCount: a._count.aiTestResults,
        questionsCount: a._count.discoveredQuestions,
        timeSinceCreation: `${Math.round((Date.now() - a.createdAt.getTime()) / 1000)}s ago`,
        timeSinceUpdate: `${Math.round((Date.now() - a.updatedAt.getTime()) / 1000)}s ago`,
      })),
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
