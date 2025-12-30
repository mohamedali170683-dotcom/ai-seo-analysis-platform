import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface CompetitorComparison {
  competitor: string;
  positioning: {
    primary: string;
    pricePoint: string;
    targetAudience: string;
    keyAttributes: string[];
  };
  llmPerception: {
    chatgpt: string;
    gemini: string;
    perplexity: string;
    claude: string;
  };
  comparisonInsights: string[];
  differentiationOpportunities: string[];
}

/**
 * POST /api/brand-positioning/compare
 * Compare brand positioning against competitors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, competitors, positioning } = body;

    if (!brandName || !competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Brand name and competitors array are required' },
        { status: 400 }
      );
    }

    const comparisons: CompetitorComparison[] = [];

    for (const competitor of competitors.slice(0, 5)) { // Limit to 5 competitors
      const comparison = await analyzeCompetitor(brandName, competitor, positioning);
      comparisons.push(comparison);
    }

    // Generate overall competitive insights
    const overallInsights = await generateCompetitiveInsights(brandName, positioning, comparisons);

    return NextResponse.json({
      success: true,
      data: {
        brandName,
        competitors: comparisons,
        overallInsights,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error comparing competitors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compare competitors' },
      { status: 500 }
    );
  }
}

async function analyzeCompetitor(
  brandName: string,
  competitorName: string,
  userPositioning: any
): Promise<CompetitorComparison> {
  // Query LLMs about the competitor
  const [chatgptResponse, geminiResponse, perplexityResponse, claudeResponse] = await Promise.all([
    queryLLMAboutBrand('chatgpt', competitorName),
    queryLLMAboutBrand('gemini', competitorName),
    queryLLMAboutBrand('perplexity', competitorName),
    queryLLMAboutBrand('claude', competitorName)
  ]);

  // Extract positioning from LLM responses
  const positioningAnalysis = await extractPositioning(competitorName, [
    chatgptResponse, geminiResponse, perplexityResponse, claudeResponse
  ]);

  // Generate comparison insights
  const insights = generateComparisonInsights(brandName, userPositioning, competitorName, positioningAnalysis);

  // Identify differentiation opportunities
  const opportunities = identifyDifferentiationOpportunities(userPositioning, positioningAnalysis);

  return {
    competitor: competitorName,
    positioning: positioningAnalysis,
    llmPerception: {
      chatgpt: chatgptResponse,
      gemini: geminiResponse,
      perplexity: perplexityResponse,
      claude: claudeResponse
    },
    comparisonInsights: insights,
    differentiationOpportunities: opportunities
  };
}

async function queryLLMAboutBrand(llmName: string, brandName: string): Promise<string> {
  const question = `In 2-3 sentences, describe ${brandName}'s market positioning, target audience, and price point. Be specific and factual.`;

  try {
    if (llmName === 'chatgpt') {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a brand analyst. Be concise and specific.' },
          { role: 'user', content: question }
        ],
        temperature: 0.3,
        max_tokens: 200
      });
      return completion.choices[0]?.message?.content || '';
    } else if (llmName === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return '[Gemini API key not configured]';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: question }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.3 }
          })
        }
      );
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (llmName === 'perplexity') {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) return '[Perplexity API key not configured]';

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: question }],
          temperature: 0.3,
          max_tokens: 200
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } else if (llmName === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return '[Anthropic API key not configured]';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          messages: [{ role: 'user', content: question }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || '';
    }
  } catch (error) {
    console.error(`Error querying ${llmName}:`, error);
    return `Error getting response from ${llmName}`;
  }

  return '';
}

async function extractPositioning(
  brandName: string,
  llmResponses: string[]
): Promise<{
  primary: string;
  pricePoint: string;
  targetAudience: string;
  keyAttributes: string[];
}> {
  const combinedContext = llmResponses.join('\n\n');

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract brand positioning information from the provided context. Return valid JSON only.'
        },
        {
          role: 'user',
          content: `Based on these LLM responses about ${brandName}, extract the positioning:

${combinedContext}

Return JSON:
{
  "primary": "primary positioning (e.g., premium, budget, innovative)",
  "pricePoint": "price point (budget/value/mid-range/premium/luxury)",
  "targetAudience": "target audience description",
  "keyAttributes": ["attribute1", "attribute2", "attribute3"]
}`
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      primary: result.primary || 'unknown',
      pricePoint: result.pricePoint || 'unknown',
      targetAudience: result.targetAudience || 'unknown',
      keyAttributes: result.keyAttributes || []
    };
  } catch (error) {
    console.error('Error extracting positioning:', error);
    return {
      primary: 'unknown',
      pricePoint: 'unknown',
      targetAudience: 'unknown',
      keyAttributes: []
    };
  }
}

function generateComparisonInsights(
  brandName: string,
  userPositioning: any,
  competitorName: string,
  competitorPositioning: any
): string[] {
  const insights: string[] = [];

  // Price point comparison
  if (userPositioning.pricePoint && competitorPositioning.pricePoint) {
    const priceScale = ['budget', 'value', 'mid-range', 'premium', 'luxury'];
    const userIndex = priceScale.indexOf(userPositioning.pricePoint.toLowerCase());
    const compIndex = priceScale.indexOf(competitorPositioning.pricePoint.toLowerCase());

    if (userIndex > compIndex) {
      insights.push(`${brandName} is positioned higher-end than ${competitorName}`);
    } else if (userIndex < compIndex) {
      insights.push(`${competitorName} is positioned as more premium than ${brandName}`);
    } else {
      insights.push(`${brandName} and ${competitorName} compete in the same price tier`);
    }
  }

  // Primary positioning comparison
  if (userPositioning.primary?.toLowerCase() === competitorPositioning.primary?.toLowerCase()) {
    insights.push(`Both brands share "${userPositioning.primary}" as primary positioning - direct competition`);
  } else if (userPositioning.primary && competitorPositioning.primary) {
    insights.push(`Different positioning angles: ${brandName} (${userPositioning.primary}) vs ${competitorName} (${competitorPositioning.primary})`);
  }

  // Attribute overlap
  const userAttrs = new Set((userPositioning.secondary || []).map((a: string) => a.toLowerCase()));
  const compAttrs = new Set((competitorPositioning.keyAttributes || []).map((a: string) => a.toLowerCase()));
  const overlap = [...userAttrs].filter(a => compAttrs.has(a));

  if (overlap.length > 0) {
    insights.push(`Shared attributes with ${competitorName}: ${overlap.join(', ')}`);
  }

  return insights;
}

function identifyDifferentiationOpportunities(
  userPositioning: any,
  competitorPositioning: any
): string[] {
  const opportunities: string[] = [];

  // Find attributes you have that competitor doesn't
  const userAttrs = new Set((userPositioning.secondary || []).map((a: string) => a.toLowerCase()));
  const compAttrs = new Set((competitorPositioning.keyAttributes || []).map((a: string) => a.toLowerCase()));

  const uniqueToUser = [...userAttrs].filter(a => !compAttrs.has(a));
  if (uniqueToUser.length > 0) {
    opportunities.push(`Emphasize your unique attributes: ${uniqueToUser.join(', ')}`);
  }

  // Suggest positioning gaps
  if (userPositioning.brandPromise && !competitorPositioning.keyAttributes?.some(
    (a: string) => a.toLowerCase().includes('promise') || a.toLowerCase().includes('value')
  )) {
    opportunities.push(`Leverage your clear brand promise as a differentiator`);
  }

  // Target audience differentiation
  if (userPositioning.targetAudience !== competitorPositioning.targetAudience) {
    opportunities.push(`Target different audience segment than competitor`);
  }

  return opportunities;
}

async function generateCompetitiveInsights(
  brandName: string,
  positioning: any,
  comparisons: CompetitorComparison[]
): Promise<string[]> {
  const insights: string[] = [];

  // Count positioning overlaps
  const competitorPositions = comparisons.map(c => c.positioning.primary?.toLowerCase());
  const userPosition = positioning.primary?.toLowerCase();

  const directCompetitors = competitorPositions.filter(p => p === userPosition).length;
  if (directCompetitors > 0) {
    insights.push(`${directCompetitors} competitor(s) share your "${positioning.primary}" positioning`);
  }

  // Price point analysis
  const pricePoints = comparisons.map(c => c.positioning.pricePoint?.toLowerCase());
  const samePrice = pricePoints.filter(p => p === positioning.pricePoint?.toLowerCase()).length;
  if (samePrice > 0) {
    insights.push(`${samePrice} competitor(s) are in the same ${positioning.pricePoint} price tier`);
  }

  // Overall market position
  const premiumCount = pricePoints.filter(p => ['premium', 'luxury'].includes(p)).length;
  const budgetCount = pricePoints.filter(p => ['budget', 'value'].includes(p)).length;

  if (premiumCount > budgetCount) {
    insights.push(`Market appears premium-focused - ${positioning.pricePoint === 'premium' ? 'aligned with' : 'opportunity to differentiate from'} competitors`);
  } else if (budgetCount > premiumCount) {
    insights.push(`Market appears value-focused - ${positioning.pricePoint === 'budget' ? 'aligned with' : 'opportunity to differentiate from'} competitors`);
  }

  return insights;
}
