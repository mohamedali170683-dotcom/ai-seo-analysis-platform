import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AnalysisPipeline } from "@/lib/services/analysis-pipeline";

// Allow up to 5 minutes on Pro plan
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { brandOrKeyword, domain, competitors } = body;

    if (!brandOrKeyword) {
      return NextResponse.json(
        { success: false, error: "Brand or keyword is required" },
        { status: 400 }
      );
    }

    // Check for required API key (only OpenAI needed now!)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: "OPENAI_API_KEY is not configured. Please add it to your environment variables in Vercel." 
        },
        { status: 500 }
      );
    }

    // Convert competitors to array if it's a string
    let competitorsArray: string[] = [];
    if (competitors) {
      if (typeof competitors === "string") {
        competitorsArray = competitors
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);
      } else if (Array.isArray(competitors)) {
        competitorsArray = competitors;
      }
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
        competitors: competitorsArray,
        status: "pending",
        progress: 0,
      },
    });

    // Initialize pipeline - no external keyword APIs needed!
    const pipeline = new AnalysisPipeline({
      analysisId: analysis.id,
      brandOrKeyword,
      domain,
      competitors: competitorsArray,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      ahrefsApiKey: "", // Not used anymore
    });

    // Execute pipeline in background with proper error handling
    setImmediate(() => {
      pipeline.execute().catch((error) => {
        console.error("Pipeline execution failed:", error);
      });
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
