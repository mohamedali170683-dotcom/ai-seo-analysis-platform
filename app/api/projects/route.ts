import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        keywords: true,
        _count: {
          select: {
            keywords: true,
            aiOverviews: true,
            trafficData: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, domain, userId } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { success: false, error: "Name and domain are required" },
        { status: 400 }
      );
    }

    // Create a demo user if userId not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const demoUser = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: {
          email: "demo@example.com",
          name: "Demo User",
        },
      });
      finalUserId = demoUser.id;
    }

    const project = await prisma.project.create({
      data: {
        name,
        domain,
        userId: finalUserId,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
