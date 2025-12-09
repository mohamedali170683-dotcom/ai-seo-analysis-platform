import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(request: Request) {
  try {
    // Delete all analysis-related data
    // The cascade delete should handle related records, but let's be explicit
    
    // First delete child records
    await prisma.aIInsight.deleteMany({});
    await prisma.aITestResult.deleteMany({});
    await prisma.detectedCompetitor.deleteMany({});
    await prisma.discoveredQuestion.deleteMany({});
    
    // Then delete parent analyses
    const deleted = await prisma.analysis.deleteMany({});

    console.log(`🗑️ Cleared ${deleted.count} analyses from database`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${deleted.count} analyses`,
      deletedCount: deleted.count,
    });
  } catch (error: any) {
    console.error("Error clearing analyses:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear analyses" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send a DELETE request to clear all analyses",
    warning: "This will permanently delete all analysis data",
  });
}
