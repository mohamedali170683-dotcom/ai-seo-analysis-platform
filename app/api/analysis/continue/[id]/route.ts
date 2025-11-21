import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { QuestionDiscoveryService } from "@/lib/services/question-discovery-service";
import { BatchAITestingService } from "@/lib/services/batch-ai-testing-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Step 1: Discover questions if not done
    if (analysis.progress < 25) {
      const questionService = new QuestionDiscoveryService(
        process.env.DATAFORSEO_LOGIN!,
        process.env.DATAFORSEO_PASSWORD!
      );

      const questions = await questionService.discoverQuestions(
        analysis.brandOrKeyword,
        100,
        3
      );

      // Save questions
      for (const q of questions) {
        await prisma.discoveredQuestion.create({
          data: {
            analysisId: id,
            question: q.question,
            searchVolume: q.searchVolume,
            difficulty: q.difficulty,
            commercialIntent: q.commercialIntent,
            category: q.category,
            source: "auto",
          },
        });
      }

      await prisma.analysis.update({
        where: { id },
        data: { status: "testing", progress: 40 },
      });

      return NextResponse.json({
        success: true,
        message: "Questions discovered",
        progress: 40,
      });
    }

    // If already past discovery, return current status
    return NextResponse.json({
      success: true,
      progress: analysis.progress,
      status: analysis.status,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
