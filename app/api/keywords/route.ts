import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// POST create keywords
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, keywords } = body;

    if (!projectId || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { success: false, error: "Project ID and keywords array required" },
        { status: 400 }
      );
    }

    // Create keywords
    const createdKeywords = await Promise.all(
      keywords.map((keyword: string) =>
        prisma.keyword.upsert({
          where: {
            projectId_keyword: {
              projectId,
              keyword: keyword.trim(),
            },
          },
          update: {},
          create: {
            projectId,
            keyword: keyword.trim(),
          },
        })
      )
    );

    return NextResponse.json(
      { success: true, keywords: createdKeywords },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating keywords:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
