import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface BrandPositioning {
  primary: string;
  secondary: string[];
  targetAudience: string;
  pricePoint: string;
  keyAttributes: string[];
  brandPromise: string;
  tone: string[];
}

// Valid positioning options that match our UI
const VALID_POSITIONING = [
  'premium', 'luxury', 'affordable', 'value', 'innovative', 'traditional',
  'sustainable', 'eco-friendly', 'tech-forward', 'customer-centric',
  'quality-focused', 'disruptive', 'professional', 'enterprise',
  'lifestyle', 'health-conscious', 'performance', 'reliable'
];

const VALID_PRICE_POINTS = ['budget', 'value', 'mid-range', 'premium', 'luxury'];

const VALID_TONES = [
  'professional', 'friendly', 'authoritative', 'playful', 'sophisticated',
  'innovative', 'trustworthy', 'bold', 'minimalist', 'warm'
];

/**
 * POST /api/brand-positioning/fetch
 * Fetch brand positioning from website using AI analysis
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
    let extractedContent = '';
    try {
      // Fetch main page
      const mainPageContent = await fetchAndExtract(url);
      extractedContent += mainPageContent;

      // Try to fetch About page
      const aboutUrls = [
        `${url}/about`,
        `${url}/about-us`,
        `${url}/company`,
        `${url}/who-we-are`
      ];

      for (const aboutUrl of aboutUrls) {
        try {
          const aboutContent = await fetchAndExtract(aboutUrl);
          if (aboutContent.length > 200) {
            extractedContent += '\n\n--- About Page ---\n' + aboutContent;
            break;
          }
        } catch {
          // Try next URL
        }
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }

    if (!extractedContent || extractedContent.length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract content from website. Please enter positioning manually.'
      });
    }

    // Use AI to analyze the content and extract brand positioning
    const positioning = await analyzeWithAI(brandName, extractedContent);

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

async function fetchAndExtract(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  return extractMeaningfulContent(html);
}

function extractMeaningfulContent(html: string): string {
  // Remove script, style, nav, header, footer tags
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Extract key metadata
  const metadata: string[] = [];

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) metadata.push(`Title: ${titleMatch[1].trim()}`);

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (metaDescMatch) metadata.push(`Description: ${metaDescMatch[1].trim()}`);

  // OG description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i);
  if (ogDescMatch && ogDescMatch[1] !== metaDescMatch?.[1]) {
    metadata.push(`OG Description: ${ogDescMatch[1].trim()}`);
  }

  // Extract h1, h2 headings
  const h1Matches = text.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
  const h2Matches = text.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || [];

  const headings = [...h1Matches, ...h2Matches]
    .map(h => h.replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 3 && h.length < 200)
    .slice(0, 10);

  if (headings.length > 0) {
    metadata.push(`Key Headings: ${headings.join(' | ')}`);
  }

  // Extract main content paragraphs
  const paragraphs: string[] = [];
  const pMatches = text.match(/<p[^>]*>([^<]{50,})<\/p>/gi) || [];

  for (const p of pMatches.slice(0, 20)) {
    const content = p.replace(/<[^>]+>/g, '').trim();
    if (content.length > 50 && content.length < 1000) {
      // Filter out navigation-like content
      if (!content.match(/^(home|about|contact|login|sign|menu|nav|cookie|privacy|terms)/i)) {
        paragraphs.push(content);
      }
    }
  }

  // Extract JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd.description) metadata.push(`Structured Data Description: ${jsonLd.description}`);
      if (jsonLd.slogan) metadata.push(`Slogan: ${jsonLd.slogan}`);
      if (jsonLd.brand?.name) metadata.push(`Brand Name: ${jsonLd.brand.name}`);
    } catch {
      // Invalid JSON-LD
    }
  }

  // Combine all extracted content
  const combined = [
    ...metadata,
    '',
    '--- Main Content ---',
    paragraphs.join('\n\n')
  ].join('\n');

  return combined.slice(0, 8000);
}

async function analyzeWithAI(brandName: string, content: string): Promise<BrandPositioning> {
  const prompt = `Analyze the following website content for "${brandName}" and extract their brand positioning.

WEBSITE CONTENT:
${content}

Based on this content, determine:

1. PRIMARY POSITIONING: Choose ONE from this list that best describes the brand:
   ${VALID_POSITIONING.join(', ')}

2. SECONDARY POSITIONING: Choose 2-4 additional attributes from the same list that also apply.

3. PRICE POINT: Choose ONE from: ${VALID_PRICE_POINTS.join(', ')}

4. TARGET AUDIENCE: Describe their primary target audience in one sentence.

5. BRAND PROMISE: Write a concise brand promise/value proposition (max 150 characters) based on what the brand communicates.

6. BRAND TONE: Choose 2-3 from: ${VALID_TONES.join(', ')}

Respond ONLY with a valid JSON object in this exact format:
{
  "primary": "one_word_from_list",
  "secondary": ["word1", "word2"],
  "pricePoint": "one_word_from_list",
  "targetAudience": "description",
  "brandPromise": "concise value proposition",
  "tone": ["tone1", "tone2"]
}`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a brand strategist expert. Analyze website content and extract brand positioning. Always respond with valid JSON only, no markdown or explanation.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      primary: VALID_POSITIONING.includes(parsed.primary) ? parsed.primary : 'innovative',
      secondary: (parsed.secondary || []).filter((s: string) => VALID_POSITIONING.includes(s)).slice(0, 4),
      targetAudience: typeof parsed.targetAudience === 'string' ? parsed.targetAudience.slice(0, 200) : '',
      pricePoint: VALID_PRICE_POINTS.includes(parsed.pricePoint) ? parsed.pricePoint : 'mid-range',
      keyAttributes: [],
      brandPromise: typeof parsed.brandPromise === 'string' ? parsed.brandPromise.slice(0, 200) : '',
      tone: (parsed.tone || []).filter((t: string) => VALID_TONES.includes(t)).slice(0, 3)
    };
  } catch (error) {
    console.error('Error analyzing with AI:', error);

    // Return default positioning if AI fails
    return {
      primary: 'innovative',
      secondary: [],
      targetAudience: '',
      pricePoint: 'mid-range',
      keyAttributes: [],
      brandPromise: '',
      tone: ['professional']
    };
  }
}
