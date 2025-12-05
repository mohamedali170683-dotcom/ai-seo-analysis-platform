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

    // Check for required environment variables
    const missingEnvVars: string[] = [];

    if (!process.env.OPENAI_API_KEY) {
      missingEnvVars.push("OPENAI_API_KEY");
    }
    if (!process.env.POSTGRES_PRISMA_URL) {
      missingEnvVars.push("POSTGRES_PRISMA_URL");
    }
    if (!process.env.AHREFS_API_KEY) {
      missingEnvVars.push("AHREFS_API_KEY");
    }

    if (missingEnvVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingEnvVars.join(", ")}. Please add them in Vercel settings.`;
      console.error(`❌ [START] ${errorMsg}`);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg
        },
        { status: 500 }
      );
    }

    console.log(`✅ [START] Environment variables validated`);
    console.log(`✅ [START] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
    console.log(`✅ [START] AHREFS_API_KEY: ${process.env.AHREFS_API_KEY?.substring(0, 10)}...`);

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

    // Initialize pipeline with real API keys
    const pipeline = new AnalysisPipeline({
      analysisId: analysis.id,
      brandOrKeyword,
      domain,
      competitors: competitorsArray,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      ahrefsApiKey: process.env.AHREFS_API_KEY!, // Now using real Ahrefs API
    });

    console.log(`🚀 [START] Executing pipeline for analysis: ${analysis.id}`);

    // Execute pipeline WITHOUT awaiting - this allows function to continue
    // The promise will keep the serverless function alive up to maxDuration (300s)
    pipeline.execute().catch((error) => {
      console.error(`❌ [FATAL] Pipeline execution failed for ${analysis.id}:`, error);
      console.error(`❌ [FATAL] Stack trace:`, error.stack);
    });

    // Give pipeline a moment to start and update progress to 5%
    // This ensures the database update happens before we return
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`✅ [START] Pipeline started successfully for analysis: ${analysis.id}`);

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
