import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AnalysisPipeline } from "@/lib/services/analysis-pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandOrKeyword, domain, competitors } = body;

    if (!brandOrKeyword || !domain) {
      return NextResponse.json(
        { success: false, error: "Brand/keyword and domain are required" },
        { status: 400 }
      );
    }

    // Create demo user if needed
    let userId: string;
    const demoUser = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        name: "Demo User",
      },
    });
    userId = demoUser.id;

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        brandOrKeyword,
        domain,
        competitors,
        status: "pending",
        progress: 0,
      },
    });

    // Start pipeline execution in background
    // For Hobby plan, this will run as long as it can before timeout
    const pipeline = new AnalysisPipeline({
      analysisId: analysis.id,
      brandOrKeyword,
      domain,
      competitors,
      userId,
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
