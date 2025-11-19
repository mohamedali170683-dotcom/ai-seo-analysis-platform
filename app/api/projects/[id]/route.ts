import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET single project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        keywords: {
          include: {
            aiOverviews: {
              orderBy: { date: "desc" },
              take: 10,
            },
            trafficData: {
              orderBy: { date: "desc" },
              take: 30,
            },
          },
        },
        _count: {
          select: {
            keywords: true,
            aiOverviews: true,
            trafficData: true,
            chatbotQueries: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
