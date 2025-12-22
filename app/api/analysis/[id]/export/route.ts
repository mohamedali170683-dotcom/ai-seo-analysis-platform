import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const maxDuration = 30;

/**
 * Export all AI responses for an analysis
 * Supports JSON and CSV formats
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analysisId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const stage = searchParams.get('stage'); // Optional: filter by stage

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        aiTestResults: true,
        discoveredQuestions: true,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Map questions to stages
    const questionStageMap: Record<string, string> = {};
    analysis.discoveredQuestions.forEach((q: any) => {
      questionStageMap[q.question] = q.category || 'unknown';
    });

    // Group responses by stage
    const responsesByStage: Record<string, any[]> = {
      awareness: [],
      consideration: [],
      decision: [],
    };

    analysis.aiTestResults.forEach((result: any) => {
      const questionStage = questionStageMap[result.question] || 'consideration';
      const responseData = {
        question: result.question,
        platform: result.platform,
        brandMentioned: result.brandMentioned,
        position: result.position,
        sentiment: result.sentiment,
        fullResponse: result.fullResponse,
        sources: result.sources || [],
        hasGrounding: result.hasGrounding,
        isRealAPI: result.isRealAPI,
        createdAt: result.createdAt,
      };
      
      if (responsesByStage[questionStage]) {
        responsesByStage[questionStage].push(responseData);
      } else {
        responsesByStage.consideration.push(responseData);
      }
    });

    // Filter by stage if specified
    let exportData;
    if (stage && responsesByStage[stage]) {
      exportData = {
        analysisId,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        exportedAt: new Date().toISOString(),
        stage,
        totalResponses: responsesByStage[stage].length,
        responses: responsesByStage[stage],
      };
    } else {
      exportData = {
        analysisId,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        exportedAt: new Date().toISOString(),
        stages: {
          awareness: {
            count: responsesByStage.awareness.length,
            responses: responsesByStage.awareness,
          },
          consideration: {
            count: responsesByStage.consideration.length,
            responses: responsesByStage.consideration,
          },
          decision: {
            count: responsesByStage.decision.length,
            responses: responsesByStage.decision,
          },
        },
        totalResponses: analysis.aiTestResults.length,
      };
    }

    if (format === 'csv') {
      // Generate CSV
      const allResponses = stage 
        ? responsesByStage[stage] 
        : [...responsesByStage.awareness, ...responsesByStage.consideration, ...responsesByStage.decision];
      
      const csvHeaders = [
        'Stage',
        'Question',
        'Platform',
        'Brand Mentioned',
        'Position',
        'Sentiment',
        'Full Response',
        'Sources',
        'Has Grounding',
        'Real API',
      ];
      
      const csvRows = allResponses.map((r: any) => {
        const rStage = questionStageMap[r.question] || 'consideration';
        return [
          rStage,
          `"${(r.question || '').replace(/"/g, '""')}"`,
          r.platform,
          r.brandMentioned ? 'Yes' : 'No',
          r.position || 'N/A',
          r.sentiment || 'neutral',
          `"${(r.fullResponse || '').replace(/"/g, '""').substring(0, 1000)}"`,
          `"${JSON.stringify(r.sources || []).replace(/"/g, '""')}"`,
          r.hasGrounding ? 'Yes' : 'No',
          r.isRealAPI ? 'Yes' : 'No',
        ].join(',');
      });
      
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analysis-${analysisId}-responses.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      data: exportData,
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
