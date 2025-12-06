import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    console.log(`🗑️ [DELETE] Deleting analysis: ${id}`);

    // Delete the analysis (cascade will delete all related records)
    await prisma.analysis.delete({
      where: { id },
    });

    console.log(`✅ [DELETE] Analysis deleted successfully: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Analysis deleted successfully",
    });

  } catch (error: any) {
    console.error("Error deleting analysis:", error);

    // Handle not found error
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
