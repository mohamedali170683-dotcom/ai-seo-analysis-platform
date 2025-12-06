import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * DELETE /api/analysis/cleanup
 * Deletes all analyses that are not completed
 */
export async function DELETE(request: Request) {
  try {
    console.log(`🧹 [CLEANUP] Starting cleanup of failed/stuck analyses`);

    // Delete all analyses that are NOT completed
    const result = await prisma.analysis.deleteMany({
      where: {
        status: {
          not: "completed",
        },
      },
    });

    console.log(`✅ [CLEANUP] Deleted ${result.count} analyses`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} failed/stuck analyses`,
    });

  } catch (error: any) {
    console.error("❌ [CLEANUP] Error during cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to cleanup analyses",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/cleanup
 * Same as DELETE but for compatibility
 */
export async function POST(request: Request) {
  return DELETE(request);
}
