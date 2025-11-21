import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AnalysisPipeline } from "@/lib/services/analysis-pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors } = body;

    if (!brandOrKeyword) {
      return NextResponse.json(
        { success: false, error: "Brand or keyword is required" },
        { status: 400 }
      );
    }

    // Create or get user
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: { email: "demo@example.com" },
    });

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        brandOrKeyword,
        domain: domain || null,
        competitors: competitors || [],
        status: "pending",
        progress: 0,
      },
    });

    // Initialize pipeline
    const pipeline = new AnalysisPipeline({
      analysisId: analysis.id,
      brandOrKeyword,
      domain,
      competitors,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      dataForSEOUsername: process.env.DATAFORSEO_LOGIN!,
      dataForSEOPassword: process.env.DATAFORSEO_PASSWORD!,
    });

    // Execute pipeline asynchronously
    pipeline.execute().catch((error) => {
      console.error("Pipeline execution failed:", error);
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started successfully",
    });

  } catch (error: any) {
    console.error("Error starting analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start analysis" },
      { status: 500 }
    );
  }
}
