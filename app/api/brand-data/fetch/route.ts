import { NextRequest, NextResponse } from 'next/server';
import { brandDataFetcher, FetchedBrandData } from '@/lib/services/brand-data-fetcher';

/**
 * POST /api/brand-data/fetch
 * Fetch brand data from Wikipedia and website
 *
 * Request body:
 * - brandNameOrUrl: string - Either a brand name or website URL
 *
 * Response:
 * - success: boolean
 * - data: FetchedBrandData
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandNameOrUrl } = body;

    if (!brandNameOrUrl || typeof brandNameOrUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Brand name or URL is required' },
        { status: 400 }
      );
    }

    // Clean up the input
    const cleanedInput = brandNameOrUrl.trim();

    if (cleanedInput.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Brand name must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`[Brand Data Fetch] Fetching data for: ${cleanedInput}`);

    // Fetch brand data
    const brandData = await brandDataFetcher.fetchBrandData(cleanedInput);

    console.log(`[Brand Data Fetch] Successfully fetched data for: ${brandData.companyName}`);
    console.log(`[Brand Data Fetch] Sources: ${brandData.sources.length}, Confidence: ${brandData.confidence.overall}`);

    return NextResponse.json({
      success: true,
      data: brandData
    });
  } catch (error) {
    console.error('Error fetching brand data:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch brand data: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
