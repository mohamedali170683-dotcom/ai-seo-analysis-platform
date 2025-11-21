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

   // Execute pipeline synchronously (must complete within Hobby plan 10s limit)
    // With 3 questions x 3 tests, this should take ~30-45 seconds
    // We'll need to handle timeout gracefully
    
    const pipeline = new AnalysisPipeline({
      analysisId: analysis.id,
      brandOrKeyword,
      domain,
      competitors,
      userId,
    });

    // Try to execute with timeout handling
    try {
      // Start execution but don't await - let it run in background
      // This is a compromise for Hobby plan
      setTimeout(() => {
        pipeline.execute().catch((error) => {
          console.error("Pipeline execution failed:", error);
        });
      }, 100);

      // Return immediately so function doesn't timeout
      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        message: "Analysis started successfully",
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
}
// Hobby plan timeout - 10 seconds default
export const maxDuration = 10;

// Allow streaming responses to prevent timeout
export const dynamic = 'force-dynamic';
