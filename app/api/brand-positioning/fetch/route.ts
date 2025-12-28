import { NextRequest, NextResponse } from 'next/server';

interface BrandPositioning {
  primary: string;
  secondary: string[];
  targetAudience: string;
  pricePoint: string;
  keyAttributes: string[];
  brandPromise: string;
  tone: string[];
}

// Positioning keyword mappings
const POSITIONING_KEYWORDS: Record<string, string[]> = {
  premium: ['premium', 'high-end', 'exclusive', 'finest', 'superior', 'elite', 'prestige'],
  luxury: ['luxury', 'luxurious', 'opulent', 'lavish', 'indulgent', 'high-end', 'designer'],
  affordable: ['affordable', 'value', 'budget-friendly', 'cost-effective', 'economical', 'low-cost'],
  value: ['value', 'great value', 'worth', 'savings', 'deal', 'competitive pricing'],
  innovative: ['innovative', 'innovation', 'cutting-edge', 'revolutionary', 'groundbreaking', 'pioneering', 'breakthrough'],
  traditional: ['traditional', 'heritage', 'classic', 'timeless', 'established', 'legacy', 'authentic'],
  sustainable: ['sustainable', 'sustainability', 'eco-friendly', 'green', 'environmental', 'carbon-neutral'],
  'eco-friendly': ['eco', 'green', 'organic', 'natural', 'biodegradable', 'recyclable', 'planet'],
  'tech-forward': ['technology', 'tech', 'digital', 'smart', 'AI', 'automation', 'connected'],
  'customer-centric': ['customer-first', 'customer-centric', 'user-focused', 'personalized', 'tailored'],
  'quality-focused': ['quality', 'craftsmanship', 'excellence', 'precision', 'attention to detail'],
  disruptive: ['disruptive', 'disrupting', 'challenging', 'redefining', 'transforming'],
  professional: ['professional', 'enterprise', 'business', 'corporate', 'B2B'],
  enterprise: ['enterprise', 'Fortune 500', 'large-scale', 'organization', 'corporation'],
  lifestyle: ['lifestyle', 'life', 'living', 'everyday', 'experience', 'journey'],
  'health-conscious': ['health', 'healthy', 'wellness', 'nutrition', 'fitness', 'wellbeing'],
  performance: ['performance', 'speed', 'power', 'efficiency', 'optimization', 'results'],
  reliable: ['reliable', 'dependable', 'trusted', 'stable', 'consistent', 'robust']
};

const PRICE_POINT_KEYWORDS: Record<string, string[]> = {
  budget: ['budget', 'cheap', 'low-cost', 'economical', 'bargain', 'discount'],
  value: ['value', 'affordable', 'competitive', 'fair price', 'reasonable'],
  'mid-range': ['mid-range', 'moderate', 'balanced', 'mid-tier'],
  premium: ['premium', 'high-end', 'superior', 'exclusive', 'upscale'],
  luxury: ['luxury', 'luxurious', 'elite', 'finest', 'designer', 'bespoke']
};

const TONE_KEYWORDS: Record<string, string[]> = {
  professional: ['professional', 'expert', 'industry', 'leading', 'authority'],
  friendly: ['friendly', 'welcoming', 'warm', 'approachable', 'personal'],
  authoritative: ['authority', 'leader', 'expert', 'trusted', 'definitive'],
  playful: ['fun', 'playful', 'exciting', 'enjoy', 'adventure'],
  sophisticated: ['sophisticated', 'refined', 'elegant', 'curated'],
  innovative: ['innovative', 'forward', 'future', 'next-gen', 'cutting-edge'],
  trustworthy: ['trust', 'reliable', 'secure', 'safe', 'dependable'],
  bold: ['bold', 'brave', 'confident', 'fearless', 'ambitious'],
  minimalist: ['simple', 'minimal', 'clean', 'streamlined', 'essential'],
  warm: ['warm', 'caring', 'supportive', 'compassionate', 'community']
};

/**
 * POST /api/brand-positioning/fetch
 * Fetch brand positioning from website
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, domain } = body;

    if (!brandName || !domain) {
      return NextResponse.json(
        { success: false, error: 'Brand name and domain are required' },
        { status: 400 }
      );
    }

    // Normalize domain URL
    let url = domain;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // Fetch website content
    let websiteText = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)'
        }
      });

      if (response.ok) {
        const html = await response.text();

        // Extract text content from HTML
        websiteText = extractTextFromHtml(html);
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }

    // Analyze the text to extract positioning
    const positioning = analyzePositioning(websiteText, brandName);

    return NextResponse.json({
      success: true,
      data: {
        brandName,
        domain,
        positioning
      }
    });
  } catch (error) {
    console.error('Error fetching brand positioning:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand positioning' },
      { status: 500 }
    );
  }
}

function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Extract meta description
  const metaMatch = text.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const metaDescription = metaMatch ? metaMatch[1] : '';

  // Extract title
  const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract og:description
  const ogMatch = text.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  const ogDescription = ogMatch ? ogMatch[1] : '';

  // Extract main content
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  // Combine key content
  return `${title} ${metaDescription} ${ogDescription} ${text.slice(0, 10000)}`.toLowerCase();
}

function analyzePositioning(text: string, brandName: string): BrandPositioning {
  const textLower = text.toLowerCase();

  // Find primary and secondary positioning
  const positioningScores: Record<string, number> = {};

  for (const [positioning, keywords] of Object.entries(POSITIONING_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      positioningScores[positioning] = score;
    }
  }

  // Sort by score
  const sortedPositioning = Object.entries(positioningScores)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  const primary = sortedPositioning[0] || 'innovative';
  const secondary = sortedPositioning.slice(1, 4);

  // Find price point
  const pricePointScores: Record<string, number> = {};
  for (const [pricePoint, keywords] of Object.entries(PRICE_POINT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        score++;
      }
    }
    if (score > 0) {
      pricePointScores[pricePoint] = score;
    }
  }

  const pricePoint = Object.entries(pricePointScores)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key)[0] || 'mid-range';

  // Find tone
  const toneScores: Record<string, number> = {};
  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        score++;
      }
    }
    if (score > 0) {
      toneScores[tone] = score;
    }
  }

  const tone = Object.entries(toneScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  // Extract target audience hints
  let targetAudience = '';
  if (textLower.includes('business') || textLower.includes('enterprise') || textLower.includes('b2b')) {
    targetAudience = 'Business professionals and enterprises';
  } else if (textLower.includes('consumer') || textLower.includes('individual') || textLower.includes('personal')) {
    targetAudience = 'Individual consumers';
  } else if (textLower.includes('developer') || textLower.includes('engineer')) {
    targetAudience = 'Developers and technical professionals';
  } else if (textLower.includes('creative') || textLower.includes('designer')) {
    targetAudience = 'Creative professionals';
  }

  // Extract brand promise from meta description or first paragraph
  let brandPromise = '';
  const sentenceMatch = text.match(/[A-Z][^.!?]*(?:mission|vision|believe|help|empower|enable|deliver)[^.!?]*[.!?]/i);
  if (sentenceMatch) {
    brandPromise = sentenceMatch[0].trim();
  }

  return {
    primary,
    secondary,
    targetAudience,
    pricePoint,
    keyAttributes: sortedPositioning.slice(0, 5),
    brandPromise: brandPromise.slice(0, 200),
    tone: tone.length > 0 ? tone : ['professional']
  };
}
