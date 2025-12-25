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
      });

      if (!analysis) {
        return NextResponse.json({
          success: false,
          error: "Analysis not found",
        }, { status: 404 });
      }

      // Get counts for related data
      const testResultsCount = await prisma.aiTestResult.count({
        where: { analysisId: id },
      });
      const questionsCount = await prisma.discoveredQuestion.count({
        where: { analysisId: id },
      });

      // Get sample data
      const recentTestResults = await prisma.aiTestResult.findMany({
        where: { analysisId: id },
        select: {
          id: true,
          platform: true,
          brandMentioned: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      const recentQuestions = await prisma.discoveredQuestion.findMany({
        where: { analysisId: id },
        select: {
          id: true,
          question: true,
        },
        take: 5,
      });

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
          testResultsCount,
          questionsCount,
          recentTestResults,
          recentQuestions,
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
