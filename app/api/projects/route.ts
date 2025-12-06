import { NextResponse } from "next/server";

/**
 * GET /api/projects
 * Returns all projects (currently returns empty array as auth is not implemented)
 */
export async function GET(request: Request) {
  try {
    // TODO: When authentication is implemented, fetch user-specific projects
    // For now, return empty array to prevent 404 errors on dashboard
    return NextResponse.json({
      success: true,
      projects: [],
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
    // TODO: Implement when authentication is added
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required. Project creation will be enabled once auth is implemented.",
      },
      { status: 501 }
    );
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
