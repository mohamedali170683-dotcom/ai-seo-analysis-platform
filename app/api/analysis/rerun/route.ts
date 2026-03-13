import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysisId } = body;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "analysisId is required" },
        { status: 400 }
      );
    }

    // Load the source analysis with its questions and test results
    const source = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        discoveredQuestions: true,
        aiTestResults: {
          select: { platform: true },
          distinct: ["platform"],
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    if (source.status === "running" || source.status === "pending") {
      return NextResponse.json(
        { success: false, error: "Cannot re-run an analysis that is still in progress" },
        { status: 409 }
      );
    }

    // Reconstruct selectedQuestions from discoveredQuestions
    const selectedQuestions = source.discoveredQuestions.map((q) => ({
      question: q.question,
      searchVolume: q.searchVolume || 0,
      category: q.category as "awareness" | "consideration" | "decision",
      type: "category" as const, // Default; original type isn't stored
    }));

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No questions found on source analysis to re-run" },
        { status: 400 }
      );
    }

    // Get platforms: prefer stored field, fall back to inferring from test results
    let platforms = source.selectedPlatforms;
    if (!platforms || platforms.length === 0) {
      platforms = source.aiTestResults.map((t) => t.platform);
    }
    if (platforms.length === 0) {
      platforms = ["ChatGPT", "Gemini", "Perplexity"];
    }

    // Build the request body for run-selected
    const rerunBody = {
      brandName: source.brandOrKeyword,
      domain: source.domain || undefined,
      competitors: source.competitors,
      category: source.category || "general",
      targetCountry: source.targetCountry || "US",
      selectedQuestions,
      selectedPlatforms: platforms,
      testsPerPlatform: 3,
      tier: source.tier || "free",
    };

    // Call run-selected internally
    const origin = request.headers.get("origin") || request.headers.get("host") || "";
    const protocol = origin.startsWith("http") ? "" : "https://";
    const baseUrl = `${protocol}${origin}`;

    // Forward auth headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const userId = request.headers.get("x-user-id");
    const username = request.headers.get("x-username");
    if (userId) headers["x-user-id"] = userId;
    if (username) headers["x-username"] = username;

    const runResponse = await fetch(`${baseUrl}/api/analysis/run-selected`, {
      method: "POST",
      headers,
      body: JSON.stringify(rerunBody),
    });

    const runData = await runResponse.json();

    if (!runData.success) {
      return NextResponse.json(
        { success: false, error: runData.error || "Failed to start re-run" },
        { status: runResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: runData.analysisId,
      rerunFrom: source.id,
      config: runData.config,
    });
  } catch (error: any) {
    console.error("❌ [RERUN] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
