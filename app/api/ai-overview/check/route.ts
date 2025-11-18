import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DataForSEOService } from "@/lib/services/dataforseo-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keyword, projectId, keywordId } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: "Keyword is required" },
        { status: 400 }
      );
    }

    // Initialize DataForSEO
    const dataForSEO = new DataForSEOService(
      process.env.DATAFORSEO_LOGIN!,
      process.env.DATAFORSEO_PASSWORD!
    );

    // Check AI Overview
    const aiOverviewResult = await dataForSEO.checkAIOverview(keyword);

    // Get keyword metrics
    const keywordMetrics = await dataForSEO.getKeywordMetrics([keyword]);
    const metrics = keywordMetrics[0] || {};

    // Save to database if projectId and keywordId provided
    if (projectId && keywordId) {
      await prisma.aiOverview.create({
        data: {
          projectId,
          keywordId,
          date: new Date(),
          hasAiOverview: aiOverviewResult.hasAIOverview,
          position: aiOverviewResult.position,
          contentLength: aiOverviewResult.contentLength,
        },
      });

      // Update keyword with volume and difficulty
      await prisma.keyword.update({
        where: { id: keywordId },
        data: {
          searchVolume: metrics.volume,
          difficulty: metrics.competition ? metrics.competition * 100 : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        hasAIOverview: aiOverviewResult.hasAIOverview,
        position: aiOverviewResult.position,
        contentLength: aiOverviewResult.contentLength,
        searchVolume: metrics.volume,
        cpc: metrics.cpc,
        competition: metrics.competition,
      },
    });
  } catch (error: any) {
    console.error("Error checking AI Overview:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
