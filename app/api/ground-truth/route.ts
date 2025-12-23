import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/ground-truth
 * Get all ground truth entries for the user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from authentication
    const userId = 'demo-user-id'; // Replace with actual auth

    const groundTruths = await prisma.brandGroundTruth.findMany({
      where: { userId },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true,
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          take: 5 // Latest 5 scans
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
    // TODO: Get userId from authentication
    const userId = 'demo-user-id'; // Replace with actual auth

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
    return NextResponse.json(
      { success: false, error: 'Failed to create ground truth' },
      { status: 500 }
    );
  }
}
