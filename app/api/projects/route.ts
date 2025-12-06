import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/projects
 * Returns all projects
 */
export async function GET(request: Request) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Creates a new project
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Project name is required",
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || "",
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create project",
      },
      { status: 500 }
    );
  }
}
