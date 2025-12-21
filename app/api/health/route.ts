import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Health check endpoint - verifies all services are working
 */
export async function GET() {
  const startTime = Date.now();
  console.log(`🏥 [HEALTH] Health check started at ${new Date().toISOString()}`);
  
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: "checking",
  };

  // Check environment variables
  checks.environment = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `✅ SET (${process.env.OPENAI_API_KEY.length} chars)` : "❌ NOT SET",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `✅ SET (${process.env.GEMINI_API_KEY.length} chars)` : "❌ NOT SET",
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? `✅ SET (${process.env.PERPLEXITY_API_KEY.length} chars)` : "❌ NOT SET",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "✅ SET" : "❌ NOT SET",
    DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN ? "✅ SET" : "❌ NOT SET",
    NODE_ENV: process.env.NODE_ENV || "not set",
    VERCEL: process.env.VERCEL ? "✅ Running on Vercel" : "❌ Not on Vercel",
  };

  // Check database connection
  checks.database = { status: "checking" };
  try {
    console.log(`💾 [HEALTH] Testing database connection...`);
    
    // Test basic connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`✅ [HEALTH] Database raw query succeeded`);
    
    // Try to query tables
    const userCount = await prisma.user.count();
    const analysisCount = await prisma.analysis.count();
    const testResultCount = await prisma.aITestResult.count();
    
    // Check if new columns exist by querying with them
    let hasNewColumns = true;
    try {
      await prisma.aITestResult.findFirst({
        select: { hasGrounding: true, isRealAPI: true, sources: true }
      });
    } catch (columnError: any) {
      hasNewColumns = false;
      console.warn(`⚠️ [HEALTH] New columns not found - need to run prisma db push`);
    }
    
    checks.database = {
      status: "✅ connected",
      userCount,
      analysisCount,
      testResultCount,
      hasNewColumns,
      schemaNote: hasNewColumns ? "Schema is up to date" : "⚠️ Need to run: prisma db push",
    };
    console.log(`✅ [HEALTH] Database check complete: ${userCount} users, ${analysisCount} analyses`);
  } catch (dbError: any) {
    console.error(`❌ [HEALTH] Database error:`, dbError.message);
    checks.database = {
      status: "❌ failed",
      error: dbError.message,
      errorCode: dbError.code,
      hint: "Check POSTGRES_PRISMA_URL environment variable and run 'prisma db push'",
    };
  }

  // Check if required vars are present
  const missingRequired: string[] = [];
  if (!process.env.OPENAI_API_KEY) missingRequired.push("OPENAI_API_KEY");
  if (!process.env.POSTGRES_PRISMA_URL) missingRequired.push("POSTGRES_PRISMA_URL");

  checks.status = missingRequired.length === 0 && checks.database.status === "✅ connected" 
    ? "✅ healthy" 
    : "❌ unhealthy";
  
  checks.missingRequired = missingRequired.length > 0 ? missingRequired : null;
  checks.elapsed = `${Date.now() - startTime}ms`;

  // Recommendations
  if (checks.status !== "✅ healthy") {
    checks.recommendations = [];
    if (!process.env.POSTGRES_PRISMA_URL) {
      checks.recommendations.push("Add POSTGRES_PRISMA_URL to Vercel Environment Variables");
    }
    if (!process.env.OPENAI_API_KEY) {
      checks.recommendations.push("Add OPENAI_API_KEY to Vercel Environment Variables");
    }
    if (checks.database.status === "❌ failed") {
      checks.recommendations.push("1. Verify database is accessible from Vercel");
      checks.recommendations.push("2. Run: npx prisma db push");
      checks.recommendations.push("3. Check connection string format");
    }
  }
  
  // Add action items
  if (checks.database.hasNewColumns === false) {
    checks.actionRequired = "Database schema out of sync. In Vercel build settings, change build command to: npm run build";
  }

  console.log(`🏥 [HEALTH] Health check complete: ${checks.status}`);
  
  return NextResponse.json(checks, {
    status: checks.status === "✅ healthy" ? 200 : 500,
  });
}
