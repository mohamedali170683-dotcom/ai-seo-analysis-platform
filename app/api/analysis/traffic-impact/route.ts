import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, analysisDate, beforeDays, afterDays } = body;

    if (!projectId || !analysisDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Traffic impact analysis placeholder
    // In production, this would analyze actual data from the database
    const mockAnalysis = {
      totalKeywords: 150,
      keywordsWithAiOverview: 45,
      overallImpact: {
        totalClicksChange: -1250,
        totalClicksChangePercent: -12.5,
        totalImpressionsChange: -3400,
        totalImpressionsChangePercent: -8.2,
        avgCtrChange: -0.012,
        avgPositionChange: 1.3,
      },
      topAffectedKeywords: [
        { keyword: "seo tools", clicksChange: -45, changePercent: -30.0 },
        { keyword: "ai seo", clicksChange: -38, changePercent: -42.7 },
        { keyword: "search visibility", clicksChange: -52, changePercent: -22.2 },
      ]
    };

    return NextResponse.json({ success: true, data: mockAnalysis });
  } catch (error: any) {
    console.error("Traffic impact analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze traffic impact" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    const mockData = {
      projectId,
      summary: "Traffic impact summary",
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: mockData });
  } catch (error: any) {
    console.error("Aggregated impact error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get aggregated impact" },
      { status: 500 }
    );
  }
}
