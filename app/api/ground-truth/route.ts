import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DEMO_USER_ID = 'demo-user-id';
const DEMO_USER_EMAIL = 'demo@example.com';

/**
 * Ensure demo user exists for development/demo purposes
 */
async function ensureDemoUserExists() {
  const existingUser = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID }
  });

  if (!existingUser) {
    // Check if email already exists (might have different id)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL }
    });

    if (existingByEmail) {
      return existingByEmail.id;
    }

    // Create demo user
    await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL
      }
    });
    console.log('Created demo user');
  }

  return DEMO_USER_ID;
}

/**
 * GET /api/ground-truth
 * Get all ground truth entries for the user
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure demo user exists
    const userId = await ensureDemoUserExists();

    const groundTruths = await prisma.brandGroundTruth.findMany({
      where: { userId },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true,
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          take: 5, // Latest 5 scans
          include: {
            hallucinations: true,
            recommendations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: groundTruths });
  } catch (error) {
    console.error('Error fetching ground truths:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ground truths' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ground-truth
 * Create a new ground truth entry
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure demo user exists
    const userId = await ensureDemoUserExists();

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
      websiteUrl,
      products,
      historicalFacts,
      approvedClaims,
      competitorDifferentiators
    } = body;

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create ground truth with all related data
    const groundTruth = await prisma.brandGroundTruth.create({
      data: {
        userId,
        companyName,
        foundedYear,
        headquarters,
        ceo,
        ceoSince,
        parentCompany,
        publiclyTraded: publiclyTraded || false,
        stockTicker,
        employeeCount,
        revenue,
        industry,
        description,
        websiteUrl,
        products: products ? {
          create: products.map((p: any) => ({
            name: p.name,
            launchYear: p.launchYear,
            currentlyAvailable: p.currentlyAvailable ?? true,
            priceMin: p.priceMin,
            priceMax: p.priceMax,
            currency: p.currency,
            keyFeatures: p.keyFeatures || [],
            categories: p.categories || [],
            discontinuedYear: p.discontinuedYear,
            successorProduct: p.successorProduct,
            description: p.description
          }))
        } : undefined,
        historicalFacts: historicalFacts ? {
          create: historicalFacts.map((f: any) => ({
            fact: f.fact,
            year: f.year,
            category: f.category,
            verificationSource: f.verificationSource,
            description: f.description
          }))
        } : undefined,
        approvedClaims: approvedClaims ? {
          create: approvedClaims.map((c: any) => ({
            claim: c.claim,
            category: c.category,
            approved: c.approved ?? true,
            regulatoryRestrictions: c.regulatoryRestrictions || [],
            expirationDate: c.expirationDate ? new Date(c.expirationDate) : undefined,
            verificationSource: c.verificationSource
          }))
        } : undefined,
        competitorDifferentiators: competitorDifferentiators ? {
          create: competitorDifferentiators.map((d: any) => ({
            competitor: d.competitor,
            theirFeature: d.theirFeature,
            ourEquivalent: d.ourEquivalent,
            commonlyConfused: d.commonlyConfused ?? false,
            description: d.description
          }))
        } : undefined
      },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true
      }
    });

    return NextResponse.json({ success: true, data: groundTruth }, { status: 201 });
  } catch (error) {
    console.error('Error creating ground truth:', error);

    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'code' in error ? (error as any).code : undefined;

    return NextResponse.json(
      {
        success: false,
        error: `Failed to create ground truth: ${errorMessage}`,
        code: errorDetails
      },
      { status: 500 }
    );
  }
}
