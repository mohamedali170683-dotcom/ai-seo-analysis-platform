import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    if (secret !== "migration-fix-2025") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run raw SQL to create tables
    await prisma.$executeRawUnsafe(`
      -- CreateTable
      CREATE TABLE IF NOT EXISTS "analyses" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "brandOrKeyword" TEXT NOT NULL,
          "domain" TEXT NOT NULL,
          "competitors" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "progress" INTEGER NOT NULL DEFAULT 0,
          "overallScore" DOUBLE PRECISION,
          "error" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "discovered_questions" (
          "id" TEXT NOT NULL,
          "analysisId" TEXT NOT NULL,
          "question" TEXT NOT NULL,
          "searchVolume" INTEGER,
          "difficulty" DOUBLE PRECISION,
          "commercialIntent" TEXT,
          "category" TEXT,
          "source" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DiscoveredQuestion_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ai_test_results" (
          "id" TEXT NOT NULL,
          "analysisId" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
          "modelVersion" TEXT,
          "queryNumber" INTEGER NOT NULL,
          "brandMentioned" BOOLEAN NOT NULL DEFAULT false,
          "position" INTEGER,
          "contextExtract" TEXT,
          "sentiment" TEXT,
          "recommendationType" TEXT,
          "citedUrls" JSONB,
          "fullResponse" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AITestResult_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "detected_competitors" (
          "id" TEXT NOT NULL,
          "analysisId" TEXT NOT NULL,
          "competitorName" TEXT NOT NULL,
          "domain" TEXT,
          "detectionMethod" TEXT NOT NULL,
          "mentionRate" DOUBLE PRECISION,
          "avgPosition" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DetectedCompetitor_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ai_insights" (
          "id" TEXT NOT NULL,
          "analysisId" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "priority" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "finding" TEXT NOT NULL,
          "dataEvidence" TEXT NOT NULL,
          "aiReasoning" TEXT NOT NULL,
          "actions" JSONB NOT NULL,
          "expectedImpact" JSONB,
          "effort" TEXT NOT NULL,
          "timeline" TEXT NOT NULL,
          "confidence" TEXT NOT NULL,
          "correlationScore" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Analysis_userId_status_idx" ON "analyses"("userId", "status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DiscoveredQuestion_analysisId_idx" ON "discovered_questions"("analysisId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AITestResult_analysisId_platform_idx" ON "ai_test_results"("analysisId", "platform");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AITestResult_questionId_idx" ON "ai_test_results"("questionId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DetectedCompetitor_analysisId_idx" ON "detected_competitors"("analysisId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AIInsight_analysisId_priority_idx" ON "ai_insights"("analysisId", "priority");`);

    // Create foreign keys
    await prisma.$executeRawUnsafe(`ALTER TABLE "analyses" ADD CONSTRAINT IF NOT EXISTS "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "discovered_questions" ADD CONSTRAINT IF NOT EXISTS "DiscoveredQuestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ai_test_results" ADD CONSTRAINT IF NOT EXISTS "AITestResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ai_test_results" ADD CONSTRAINT IF NOT EXISTS "AITestResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "discovered_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "detected_competitors" ADD CONSTRAINT IF NOT EXISTS "DetectedCompetitor_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ai_insights" ADD CONSTRAINT IF NOT EXISTS "AIInsight_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);

    return NextResponse.json({ 
      success: true, 
      message: "Tables created successfully!" 
    });

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
