import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/ground-truth/[id]
 * Get a specific ground truth entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const groundTruth = await prisma.brandGroundTruth.findUnique({
      where: { id },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true,
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          include: {
            hallucinations: true,
            recommendations: true
          }
        }
      }
    });

    if (!groundTruth) {
      return NextResponse.json(
        { success: false, error: 'Ground truth not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: groundTruth });
  } catch (error) {
    console.error('Error fetching ground truth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ground truth' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ground-truth/[id]
 * Update a ground truth entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      companyName,
      foundedYear,
      headquarters,
      ceo,
      ceoSince,
      parentCompany,
      publiclyTraded,
      stockTicker,
      employeeCount,
      revenue,
      industry,
      description,
      websiteUrl
    } = body;

    const groundTruth = await prisma.brandGroundTruth.update({
      where: { id },
      data: {
        companyName,
        foundedYear,
        headquarters,
        ceo,
        ceoSince,
        parentCompany,
        publiclyTraded,
        stockTicker,
        employeeCount,
        revenue,
        industry,
        description,
        websiteUrl
      },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true
      }
    });

    return NextResponse.json({ success: true, data: groundTruth });
  } catch (error) {
    console.error('Error updating ground truth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ground truth' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ground-truth/[id]
 * Delete a ground truth entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.brandGroundTruth.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Ground truth deleted successfully' });
  } catch (error) {
    console.error('Error deleting ground truth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ground truth' },
      { status: 500 }
    );
  }
}
