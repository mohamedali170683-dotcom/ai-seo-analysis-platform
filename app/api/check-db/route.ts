import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('analyses', 'discovered_questions', 'ai_test_results', 'detected_competitors', 'ai_insights', 'users')
      ORDER BY table_name;
    `;

    // Try to count rows in analyses table
    let analysesCount = null;
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM analyses;`;
      analysesCount = (count as any)[0]?.count;
    } catch (error: any) {
      analysesCount = `Error: ${error.message}`;
    }

    // Check DATABASE_URL (partially masked)
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    const maskedUrl = dbUrl.substring(0, 30) + "..." + dbUrl.substring(dbUrl.length - 20);

    return NextResponse.json({
      success: true,
      tables,
      analysesCount,
      databaseUrl: maskedUrl,
      prismaVersion: require('@prisma/client').Prisma.prismaVersion,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
