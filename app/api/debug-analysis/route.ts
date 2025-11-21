import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" });
  }

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: {
      discoveredQuestions: true,
      aiTestResults: true,
      detectedCompetitors: true,
      aiInsights: true,
    },
  });

  return NextResponse.json({
    analysis,
    questionCount: analysis?.discoveredQuestions.length || 0,
    testCount: analysis?.aiTestResults.length || 0,
    competitorCount: analysis?.detectedCompetitors.length || 0,
    insightCount: analysis?.aiInsights.length || 0,
  });
}
