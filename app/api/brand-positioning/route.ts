import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

/**
 * Get authenticated user ID from token, or create user if needed
 */
async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

  let username = 'demo-user'; // fallback

  if (authToken) {
    try {
      const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decoded);
      if (tokenData.username) {
        username = tokenData.username;
      }
    } catch {
      // Invalid token, use default
    }
  }

  // Create email from username
  const email = `${username.replace(/[^a-zA-Z0-9]/g, '.')}@velaris.app`;

  // Find or create user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email }
  });

  return user.id;
}

/**
 * GET /api/brand-positioning
 * List all brand positioning analyses
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

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
    const formattedAnalyses = analyses.map((a: { id: string; companyName: string; websiteUrl: string | null; industry: string | null; description: string | null; createdAt: Date; hallucinationDetections: Array<{ id: string; scanDate: Date; status: string; adjustedAccuracy: number | null; hallucinations: unknown[]; recommendations: unknown[] }> }) => {
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
        scans: a.hallucinationDetections.map((d: { id: string; scanDate: Date; status: string; adjustedAccuracy: number | null }) => ({
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

    const userId = await getAuthenticatedUserId();

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
