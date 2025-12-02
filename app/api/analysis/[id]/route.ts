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

    return NextResponse.json({
      success: true,
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
    });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
