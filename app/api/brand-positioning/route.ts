import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Demo user ID (same as ground-truth routes)
const DEMO_USER_ID = 'demo-user-001';
const DEMO_USER_EMAIL = 'demo@example.com';

async function ensureDemoUserExists() {
  try {
    // Use upsert to ensure user exists
    const user = await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: {}, // Don't update anything if exists
      create: {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL
      }
    });
    return user.id;
  } catch (error) {
    console.error('Error with upsert, trying findOrCreate:', error);

    // Fallback: try to find by email
    try {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: DEMO_USER_EMAIL }
      });
      if (existingByEmail) {
        return existingByEmail.id;
      }

      // Last resort: create with a new ID
      const newUser = await prisma.user.create({
        data: {
          email: DEMO_USER_EMAIL
        }
      });
      return newUser.id;
    } catch (fallbackError) {
      console.error('Fallback user creation failed:', fallbackError);
      throw new Error('Could not create or find demo user');
    }
  }
}

/**
 * GET /api/brand-positioning
 * List all brand positioning analyses
 */
export async function GET() {
  try {
    const userId = await ensureDemoUserExists();

    const analyses = await prisma.brandGroundTruth.findMany({
      where: {
        userId: userId
      },
      include: {
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          take: 1,
          include: {
            hallucinations: true,
            recommendations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to positioning format
    const formattedAnalyses = analyses.map(a => {
      // Parse positioning from description JSON if available
      let positioning = null;
      try {
        if (a.description && a.description.startsWith('{')) {
          positioning = JSON.parse(a.description);
        }
      } catch {
        positioning = null;
      }

      return {
        id: a.id,
        brandName: a.companyName,
        domain: a.websiteUrl || '',
        positioning: positioning || {
          primary: a.industry || '',
          secondary: [],
          targetAudience: '',
          pricePoint: '',
          keyAttributes: [],
          brandPromise: '',
          tone: []
        },
        createdAt: a.createdAt.toISOString(),
        scans: a.hallucinationDetections.map(d => ({
          id: d.id,
          scanDate: d.scanDate.toISOString(),
          status: d.status,
          alignmentScore: d.adjustedAccuracy || 0,
          llmResults: [] // Will be populated by scan results
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedAnalyses
    });
  } catch (error) {
    console.error('Error fetching brand positioning:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand positioning' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-positioning
 * Create a new brand positioning analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, domain, positioning } = body;

    if (!brandName || !positioning?.primary) {
      return NextResponse.json(
        { success: false, error: 'Brand name and primary positioning are required' },
        { status: 400 }
      );
    }

    const userId = await ensureDemoUserExists();

    // Store positioning as JSON in description field
    const positioningJson = JSON.stringify(positioning);

    const analysis = await prisma.brandGroundTruth.create({
      data: {
        userId: userId,
        companyName: brandName,
        websiteUrl: domain || null,
        industry: positioning.primary,
        description: positioningJson
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        brandName: analysis.companyName,
        domain: analysis.websiteUrl || '',
        positioning,
        createdAt: analysis.createdAt.toISOString(),
        scans: []
      }
    });
  } catch (error) {
    console.error('Error creating brand positioning:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to create brand positioning: ${errorMessage}` },
      { status: 500 }
    );
  }
}
