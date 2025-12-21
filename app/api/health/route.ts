import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Health check endpoint - verifies all services are working
 */
export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: "checking",
  };

  // Check environment variables
  checks.environment = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ SET" : "❌ NOT SET",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✅ SET" : "❌ NOT SET",
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? "✅ SET" : "❌ NOT SET",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "✅ SET" : "❌ NOT SET",
    DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN ? "✅ SET" : "❌ NOT SET",
    NODE_ENV: process.env.NODE_ENV || "not set",
  };

  // Check database connection
  checks.database = { status: "checking" };
  try {
    // Try to query the database
    const userCount = await prisma.user.count();
    const analysisCount = await prisma.analysis.count();
    checks.database = {
      status: "✅ connected",
      userCount,
      analysisCount,
    };
  } catch (dbError: any) {
    checks.database = {
      status: "❌ failed",
      error: dbError.message,
      hint: "Check POSTGRES_PRISMA_URL environment variable",
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
      checks.recommendations.push("Verify database is accessible from Vercel (check connection string and firewall)");
    }
  }

  return NextResponse.json(checks, {
    status: checks.status === "✅ healthy" ? 200 : 500,
  });
}
