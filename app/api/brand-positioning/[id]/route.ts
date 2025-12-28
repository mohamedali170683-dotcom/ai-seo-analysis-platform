import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/brand-positioning/[id]
 * Get a single brand positioning analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analysis = await prisma.brandGroundTruth.findUnique({
      where: { id },
      include: {
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          take: 5,
          include: {
            hallucinations: true,
            recommendations: true
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Brand analysis not found' },
        { status: 404 }
      );
    }

    // Parse positioning from description JSON
    let positioning = null;
    try {
      if (analysis.description && analysis.description.startsWith('{')) {
        positioning = JSON.parse(analysis.description);
      }
    } catch {
      positioning = null;
    }

    const formattedAnalysis = {
      id: analysis.id,
      brandName: analysis.companyName,
      domain: analysis.websiteUrl || '',
      positioning: positioning || {
        primary: analysis.industry || '',
        secondary: [],
        targetAudience: '',
        pricePoint: '',
        keyAttributes: [],
        brandPromise: '',
        tone: []
      },
      createdAt: analysis.createdAt.toISOString(),
      scans: analysis.hallucinationDetections.map((d: { id: string; scanDate: Date; status: string; adjustedAccuracy: number | null; chatgptAccuracy: number | null; geminiAccuracy: number | null }) => ({
        id: d.id,
        scanDate: d.scanDate.toISOString(),
        status: d.status,
        alignmentScore: d.adjustedAccuracy || 0,
        llmResults: [
          {
            llm: 'chatgpt',
            model: 'gpt-4o-mini',
            alignmentScore: d.chatgptAccuracy || 0,
            responses: []
          },
          {
            llm: 'gemini',
            model: 'gemini-2.0-flash',
            alignmentScore: d.geminiAccuracy || 0,
            responses: []
          }
        ]
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedAnalysis
    });
  } catch (error) {
    console.error('Error fetching brand analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand analysis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-positioning/[id]
 * Delete a brand positioning analysis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.brandGroundTruth.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Brand analysis deleted'
    });
  } catch (error) {
    console.error('Error deleting brand analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand analysis' },
      { status: 500 }
    );
  }
}
