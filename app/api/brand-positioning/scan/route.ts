import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ScanStatus, RiskLevel } from '@prisma/client';
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

interface Citation {
  url: string;
  title: string;
  snippet?: string;
  sourceType?: string;
}

interface PositioningResponse {
  aspect: string;
  question: string;
  expectedAnswer: string;
  llmAnswer: string;
  alignment: 'aligned' | 'partially_aligned' | 'misaligned';
  explanation: string;
  recommendation?: string;
  citations?: Citation[];
}

interface ContentRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  targetPlatforms: string[];
}

interface LLMPositioningResult {
  llm: string;
  model: string;
  alignmentScore: number;
  responses: PositioningResponse[];
}

/**
 * POST /api/brand-positioning/scan
 * Run a positioning alignment scan for a brand
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId } = body;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Get the brand positioning data
    const analysis = await prisma.brandGroundTruth.findUnique({
      where: { id: analysisId }
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Brand analysis not found' },
        { status: 404 }
      );
    }

    // Parse positioning from description
    let positioning: BrandPositioning;
    try {
      positioning = JSON.parse(analysis.description || '{}');
    } catch {
      positioning = {
        primary: analysis.industry || '',
        secondary: [],
        targetAudience: '',
        pricePoint: '',
        keyAttributes: [],
        brandPromise: '',
        tone: []
      };
    }

    const brandName = analysis.companyName;

    // Generate positioning-focused questions
    const questions = generatePositioningQuestions(brandName, positioning);

    // Query LLMs in parallel for better performance
    const llmResults: LLMPositioningResult[] = [];

    // Query all LLMs concurrently
    const [chatgptResponses, geminiResponses, perplexityResponses, claudeResponses] = await Promise.all([
      queryLLMForPositioning('chatgpt', 'gpt-4o-mini', brandName, questions, positioning),
      queryLLMForPositioning('gemini', 'gemini-2.0-flash', brandName, questions, positioning),
      queryLLMForPositioning('perplexity', 'sonar', brandName, questions, positioning),
      queryLLMForPositioning('claude', 'claude-3-5-haiku-20241022', brandName, questions, positioning),
    ]);

    llmResults.push(chatgptResponses);
    llmResults.push(geminiResponses);
    llmResults.push(perplexityResponses);
    llmResults.push(claudeResponses);

    // Calculate overall alignment score
    const totalResponses = llmResults.flatMap(r => r.responses);
    const alignedCount = totalResponses.filter(r => r.alignment === 'aligned').length;
    const partialCount = totalResponses.filter(r => r.alignment === 'partially_aligned').length;
    const overallScore = Math.round(
      ((alignedCount * 1 + partialCount * 0.5) / totalResponses.length) * 100
    );

    // Create detection record
    const detection = await prisma.hallucinationDetection.create({
      data: {
        groundTruthId: analysisId,
        status: ScanStatus.completed,
        overallAccuracy: overallScore,
        adjustedAccuracy: overallScore,
        riskLevel: overallScore >= 90 ? RiskLevel.LOW : overallScore >= 70 ? RiskLevel.MEDIUM : overallScore >= 50 ? RiskLevel.HIGH : RiskLevel.CRITICAL,
        totalClaims: totalResponses.length,
        correctClaims: alignedCount,
        incorrectClaims: totalResponses.filter(r => r.alignment === 'misaligned').length,
        unverifiableClaims: partialCount,
        chatgptAccuracy: chatgptResponses.alignmentScore,
        geminiAccuracy: geminiResponses.alignmentScore,
        perplexityAccuracy: perplexityResponses.alignmentScore,
        claudeAccuracy: claudeResponses.alignmentScore,
        completedAt: new Date()
      }
    });

    // Store individual LLM responses in Hallucination table for persistence
    const hallucinationRecords = [];
    for (const llmResult of llmResults) {
      for (const response of llmResult.responses) {
        hallucinationRecords.push({
          detectionId: detection.id,
          llm: llmResult.llm,
          query: response.question,
          claimedFact: response.llmAnswer,
          actualFact: response.expectedAnswer,
          category: 'FABRICATION' as const, // Using as positioning alignment check
          severity: response.alignment === 'aligned' ? 'LOW' as const :
                   response.alignment === 'partially_aligned' ? 'MEDIUM' as const : 'HIGH' as const,
          severityScore: response.alignment === 'aligned' ? 0 :
                        response.alignment === 'partially_aligned' ? 50 : 100,
          fullContext: JSON.stringify({
            aspect: response.aspect,
            alignment: response.alignment,
            explanation: response.explanation,
            recommendation: response.recommendation,
            model: llmResult.model,
            citations: response.citations || []
          }),
          responseSnippet: response.llmAnswer.slice(0, 200),
          suggestedAction: response.explanation
        });
      }
    }

    // Batch insert all responses
    if (hallucinationRecords.length > 0) {
      await prisma.hallucination.createMany({
        data: hallucinationRecords
      });
    }

    // Collect all citations for source analysis
    const allCitations: Citation[] = [];
    for (const result of llmResults) {
      for (const response of result.responses) {
        if (response.citations) {
          allCitations.push(...response.citations);
        }
      }
    }

    // Analyze source distribution
    const sourceAnalysis = analyzeSourceDistribution(allCitations);

    // Generate content recommendations
    const recommendations = await generateRecommendations(brandName, positioning, llmResults, allCitations);

    const scanResult = {
      id: detection.id,
      scanDate: detection.scanDate.toISOString(),
      status: 'completed',
      alignmentScore: overallScore,
      llmResults,
      sourceAnalysis,
      recommendations
    };

    return NextResponse.json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    console.error('Error running positioning scan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run positioning scan' },
      { status: 500 }
    );
  }
}

function generatePositioningQuestions(brandName: string, positioning: BrandPositioning): Array<{aspect: string; question: string; expected: string}> {
  const questions: Array<{aspect: string; question: string; expected: string}> = [];

  // Primary positioning
  questions.push({
    aspect: 'market_positioning',
    question: `How would you describe ${brandName}'s market positioning? Is it positioned as a premium, mid-range, or budget brand?`,
    expected: positioning.primary ? `${brandName} is positioned as ${positioning.primary}` : ''
  });

  // Price point
  if (positioning.pricePoint) {
    questions.push({
      aspect: 'price_point',
      question: `In terms of pricing, is ${brandName} considered a budget, value, mid-range, premium, or luxury brand?`,
      expected: `${brandName} is a ${positioning.pricePoint} brand`
    });
  }

  // Target audience
  if (positioning.targetAudience) {
    questions.push({
      aspect: 'target_audience',
      question: `Who is ${brandName}'s primary target audience?`,
      expected: positioning.targetAudience
    });
  }

  // Brand attributes
  if (positioning.secondary && positioning.secondary.length > 0) {
    questions.push({
      aspect: 'brand_attributes',
      question: `What are ${brandName}'s key brand attributes or differentiators?`,
      expected: `${brandName} is known for being ${positioning.secondary.join(', ')}`
    });
  }

  // Brand promise
  if (positioning.brandPromise) {
    questions.push({
      aspect: 'brand_promise',
      question: `What is ${brandName}'s main value proposition or brand promise?`,
      expected: positioning.brandPromise
    });
  }

  // Brand tone
  if (positioning.tone && positioning.tone.length > 0) {
    questions.push({
      aspect: 'brand_voice',
      question: `How would you describe ${brandName}'s brand voice or communication style?`,
      expected: `${brandName} has a ${positioning.tone.join(', ')} tone`
    });
  }

  // General perception
  questions.push({
    aspect: 'overall_perception',
    question: `In one sentence, how would you describe ${brandName} to someone who has never heard of it?`,
    expected: positioning.primary ? `A ${positioning.primary} brand` : ''
  });

  return questions;
}

async function queryLLMForPositioning(
  llmName: string,
  model: string,
  brandName: string,
  questions: Array<{aspect: string; question: string; expected: string}>,
  positioning: BrandPositioning
): Promise<LLMPositioningResult> {
  const responses: PositioningResponse[] = [];

  for (const q of questions) {
    try {
      let llmAnswer = '';
      let citations: Citation[] = [];

      if (llmName === 'chatgpt') {
        const completion = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a brand analyst. Answer questions about brands based on your knowledge. Be concise and specific. If you are not sure, say so.'
            },
            { role: 'user', content: q.question }
          ],
          temperature: 0.3,
          max_tokens: 300
        });
        llmAnswer = completion.choices[0]?.message?.content || '';
      } else if (llmName === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          llmAnswer = '[Gemini API key not configured]';
        } else {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

          const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a brand analyst. Answer this question about ${brandName}: ${q.question}. Be concise and specific.`
                }]
              }],
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.3
              },
              // Enable grounding with Google Search for citations
              tools: [{
                googleSearch: {}
              }]
            })
          });

          const data = await geminiResponse.json();

          if (geminiResponse.ok && data.candidates?.[0]?.content?.parts) {
            llmAnswer = data.candidates[0].content.parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('\n');

            // Extract citations from Gemini grounding metadata
            const groundingMetadata = data.candidates[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
              citations = groundingMetadata.groundingChunks
                .filter((chunk: any) => chunk.web?.uri)
                .map((chunk: any) => ({
                  url: chunk.web.uri,
                  title: chunk.web.title || new URL(chunk.web.uri).hostname.replace('www.', ''),
                  snippet: ''
                }));
            }
          } else {
            console.error('Gemini API error:', data);
            llmAnswer = `[Gemini API error: ${data.error?.message || 'Unknown error'}]`;
          }
        }
      } else if (llmName === 'perplexity') {
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
          llmAnswer = '[Perplexity API key not configured]';
        } else {
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                {
                  role: 'system',
                  content: 'You are a brand analyst. Answer questions about brands based on your knowledge and real-time web search. Be concise and specific. If you are not sure, say so.'
                },
                { role: 'user', content: q.question }
              ],
              temperature: 0.3,
              max_tokens: 300
            })
          });

          const data = await perplexityResponse.json();
          if (perplexityResponse.ok && data.choices?.[0]?.message?.content) {
            llmAnswer = data.choices[0].message.content;
            // Extract citations from Perplexity response
            if (data.citations && Array.isArray(data.citations)) {
              citations = data.citations.map((url: string) => ({
                url,
                title: new URL(url).hostname.replace('www.', ''),
                snippet: ''
              }));
            }
          } else {
            console.error('Perplexity API error:', data);
            llmAnswer = `[Perplexity API error: ${data.error?.message || 'Unknown error'}]`;
          }
        }
      } else if (llmName === 'claude') {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          llmAnswer = '[Anthropic API key not configured]';
        } else {
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 300,
              messages: [
                {
                  role: 'user',
                  content: `You are a brand analyst. Answer this question about ${brandName}: ${q.question}. Be concise and specific. If you are not sure, say so.`
                }
              ]
            })
          });

          const data = await claudeResponse.json();
          if (claudeResponse.ok && data.content?.[0]?.text) {
            llmAnswer = data.content[0].text;
          } else {
            console.error('Claude API error:', data);
            llmAnswer = `[Claude API error: ${data.error?.message || 'Unknown error'}]`;
          }
        }
      }

      // Analyze alignment using LLM for semantic understanding
      const alignment = await analyzeAlignmentWithLLM(llmAnswer, q.expected, positioning, q.aspect, brandName);

      // Categorize citations by source type
      const categorizedCitations = citations.map(c => ({
        ...c,
        sourceType: categorizeSource(c.url)
      }));

      responses.push({
        aspect: q.aspect,
        question: q.question,
        expectedAnswer: q.expected,
        llmAnswer: llmAnswer.slice(0, 500),
        alignment: alignment.status,
        explanation: alignment.explanation,
        recommendation: alignment.recommendation,
        citations: categorizedCitations.length > 0 ? categorizedCitations : undefined
      });
    } catch (error) {
      console.error(`Error querying ${llmName}:`, error);
      responses.push({
        aspect: q.aspect,
        question: q.question,
        expectedAnswer: q.expected,
        llmAnswer: 'Error: Could not get response',
        alignment: 'misaligned',
        explanation: 'Failed to get response from LLM'
      });
    }
  }

  // Calculate alignment score for this LLM
  const alignedCount = responses.filter(r => r.alignment === 'aligned').length;
  const partialCount = responses.filter(r => r.alignment === 'partially_aligned').length;
  const alignmentScore = Math.round(
    ((alignedCount * 1 + partialCount * 0.5) / responses.length) * 100
  );

  return {
    llm: llmName,
    model,
    alignmentScore,
    responses
  };
}

/**
 * Use LLM to semantically analyze alignment between brand positioning and LLM response
 */
async function analyzeAlignmentWithLLM(
  llmAnswer: string,
  expectedAnswer: string,
  positioning: BrandPositioning,
  aspect: string,
  brandName: string
): Promise<{ status: 'aligned' | 'partially_aligned' | 'misaligned'; explanation: string; recommendation?: string }> {
  // Skip LLM analysis for error responses
  if (llmAnswer.startsWith('[') && llmAnswer.includes('error')) {
    return {
      status: 'misaligned',
      explanation: 'Could not get response from LLM',
      recommendation: 'Ensure API keys are configured correctly'
    };
  }

  try {
    const analysisPrompt = `You are a brand positioning analyst. Analyze if an LLM's response about a brand aligns with the brand's intended positioning.

BRAND: ${brandName}

INTENDED POSITIONING:
- Primary positioning: ${positioning.primary || 'Not specified'}
- Secondary attributes: ${positioning.secondary?.join(', ') || 'None'}
- Price point: ${positioning.pricePoint || 'Not specified'}
- Target audience: ${positioning.targetAudience || 'Not specified'}
- Brand promise: ${positioning.brandPromise || 'Not specified'}
- Brand tone: ${positioning.tone?.join(', ') || 'Not specified'}

ASPECT BEING ANALYZED: ${aspect}

EXPECTED ANSWER: ${expectedAnswer}

LLM'S ACTUAL RESPONSE: ${llmAnswer}

Analyze the semantic alignment. Consider:
1. Does the LLM's response match the intended positioning, even if using different words?
2. Are there any contradictions between what the LLM says and the intended positioning?
3. Does the LLM mention related concepts that support the positioning?

Respond in this exact JSON format:
{
  "status": "aligned" | "partially_aligned" | "misaligned",
  "explanation": "Brief explanation of the alignment analysis (max 100 chars)",
  "recommendation": "Specific content recommendation to improve alignment (max 150 chars)"
}

Rules:
- "aligned": LLM response clearly supports or matches the intended positioning
- "partially_aligned": LLM response doesn't contradict but doesn't strongly support either
- "misaligned": LLM response contradicts or conflicts with intended positioning`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a brand positioning analyst. Always respond with valid JSON only.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const analysis = JSON.parse(responseText);

    return {
      status: analysis.status || 'partially_aligned',
      explanation: analysis.explanation || 'Analysis completed',
      recommendation: analysis.recommendation
    };
  } catch (error) {
    console.error('Error in LLM alignment analysis:', error);
    // Fallback to basic analysis
    return analyzeAlignmentBasic(llmAnswer, expectedAnswer, positioning, aspect);
  }
}

/**
 * Basic keyword-based alignment analysis (fallback)
 */
function analyzeAlignmentBasic(
  llmAnswer: string,
  expectedAnswer: string,
  positioning: BrandPositioning,
  aspect: string
): { status: 'aligned' | 'partially_aligned' | 'misaligned'; explanation: string } {
  const answerLower = llmAnswer.toLowerCase();

  // Check for uncertainty
  if (
    answerLower.includes("i don't know") ||
    answerLower.includes("i'm not sure") ||
    answerLower.includes("i cannot")
  ) {
    return {
      status: 'partially_aligned',
      explanation: 'LLM expressed uncertainty about this aspect'
    };
  }

  // Check if primary positioning is mentioned
  const primary = positioning.primary?.toLowerCase() || '';
  if (primary && answerLower.includes(primary)) {
    return {
      status: 'aligned',
      explanation: `LLM correctly identifies the brand as ${positioning.primary}`
    };
  }

  // Check secondary attributes
  for (const secondary of positioning.secondary || []) {
    if (answerLower.includes(secondary.toLowerCase())) {
      return {
        status: 'aligned',
        explanation: `LLM identifies key attribute: ${secondary}`
      };
    }
  }

  return {
    status: 'partially_aligned',
    explanation: 'LLM response does not explicitly mention your positioning'
  };
}

/**
 * Categorize a source URL by type
 */
function categorizeSource(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('wikipedia.org')) return 'wikipedia';
  if (urlLower.includes('reddit.com')) return 'reddit';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('youtube.com')) return 'youtube';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('news') || urlLower.includes('bbc.') || urlLower.includes('cnn.') ||
      urlLower.includes('reuters.') || urlLower.includes('bloomberg.')) return 'news';
  if (urlLower.includes('blog')) return 'blog';
  if (urlLower.includes('forbes.') || urlLower.includes('businessinsider.') ||
      urlLower.includes('wsj.') || urlLower.includes('ft.com')) return 'business_media';
  if (urlLower.includes('medium.com')) return 'medium';
  if (urlLower.includes('quora.com')) return 'quora';
  if (urlLower.includes('.gov')) return 'government';
  if (urlLower.includes('.edu')) return 'educational';

  return 'website';
}

/**
 * Generate content recommendations based on alignment gaps
 */
async function generateRecommendations(
  brandName: string,
  positioning: BrandPositioning,
  llmResults: LLMPositioningResult[],
  allCitations: Citation[]
): Promise<Array<{
  priority: 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  targetPlatforms: string[];
}>> {
  // Analyze gaps
  const misalignedAspects: string[] = [];
  const partiallyAlignedAspects: string[] = [];

  for (const result of llmResults) {
    for (const response of result.responses) {
      if (response.alignment === 'misaligned') {
        misalignedAspects.push(response.aspect);
      } else if (response.alignment === 'partially_aligned') {
        partiallyAlignedAspects.push(response.aspect);
      }
    }
  }

  // Categorize existing sources
  const sourceTypes = allCitations.map(c => categorizeSource(c.url));
  const hasWikipedia = sourceTypes.includes('wikipedia');
  const hasSocialMedia = sourceTypes.some(t => ['reddit', 'linkedin', 'twitter', 'facebook'].includes(t));
  const hasNews = sourceTypes.some(t => ['news', 'business_media'].includes(t));

  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    type: string;
    title: string;
    description: string;
    targetPlatforms: string[];
  }> = [];

  // Wikipedia recommendation
  if (!hasWikipedia && misalignedAspects.length > 0) {
    recommendations.push({
      priority: 'high',
      type: 'content_creation',
      title: 'Create or Update Wikipedia Presence',
      description: `LLMs heavily rely on Wikipedia. Create/update a Wikipedia article for ${brandName} emphasizing your ${positioning.primary} positioning.`,
      targetPlatforms: ['wikipedia']
    });
  }

  // Social media recommendations
  if (!hasSocialMedia) {
    recommendations.push({
      priority: 'medium',
      type: 'social_media',
      title: 'Increase Social Media Discussions',
      description: `Engage in Reddit and LinkedIn discussions about ${positioning.primary} topics to influence LLM training data.`,
      targetPlatforms: ['reddit', 'linkedin']
    });
  }

  // PR/News recommendations
  if (!hasNews && positioning.primary) {
    recommendations.push({
      priority: 'medium',
      type: 'pr_outreach',
      title: 'Publish Press Releases',
      description: `Issue press releases highlighting ${brandName}'s ${positioning.primary} positioning to get news coverage.`,
      targetPlatforms: ['news', 'business_media']
    });
  }

  // Specific aspect recommendations
  if (misalignedAspects.includes('market_positioning')) {
    recommendations.push({
      priority: 'high',
      type: 'positioning_content',
      title: 'Clarify Market Positioning',
      description: `Create authoritative content clearly stating ${brandName} is positioned as ${positioning.primary}.`,
      targetPlatforms: ['website', 'blog', 'linkedin']
    });
  }

  if (misalignedAspects.includes('price_point') || partiallyAlignedAspects.includes('price_point')) {
    recommendations.push({
      priority: 'medium',
      type: 'pricing_content',
      title: 'Communicate Price Positioning',
      description: `Publish content emphasizing ${brandName}'s ${positioning.pricePoint} pricing strategy with comparisons.`,
      targetPlatforms: ['website', 'blog']
    });
  }

  if (misalignedAspects.includes('target_audience')) {
    recommendations.push({
      priority: 'medium',
      type: 'audience_content',
      title: 'Define Target Audience',
      description: `Create case studies and testimonials featuring ${positioning.targetAudience} customers.`,
      targetPlatforms: ['website', 'linkedin', 'youtube']
    });
  }

  // Add general recommendation if no specific issues
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      type: 'maintenance',
      title: 'Maintain Consistency',
      description: `Continue publishing content that reinforces ${brandName}'s ${positioning.primary} positioning across all channels.`,
      targetPlatforms: ['website', 'social_media', 'pr']
    });
  }

  return recommendations;
}

/**
 * Analyze the distribution of source types from citations
 */
function analyzeSourceDistribution(citations: Citation[]): {
  totalSources: number;
  byType: Record<string, { count: number; percentage: number; urls: string[] }>;
  insights: string[];
} {
  const byType: Record<string, { count: number; urls: string[] }> = {};

  for (const citation of citations) {
    const sourceType = citation.sourceType || categorizeSource(citation.url);
    if (!byType[sourceType]) {
      byType[sourceType] = { count: 0, urls: [] };
    }
    byType[sourceType].count++;
    if (!byType[sourceType].urls.includes(citation.url)) {
      byType[sourceType].urls.push(citation.url);
    }
  }

  const totalSources = citations.length;
  const result: Record<string, { count: number; percentage: number; urls: string[] }> = {};

  for (const [type, data] of Object.entries(byType)) {
    result[type] = {
      count: data.count,
      percentage: totalSources > 0 ? Math.round((data.count / totalSources) * 100) : 0,
      urls: data.urls.slice(0, 5) // Limit to 5 URLs per type
    };
  }

  // Generate insights
  const insights: string[] = [];

  if (!byType['wikipedia']) {
    insights.push('No Wikipedia sources found - consider creating or updating your Wikipedia presence');
  }

  if (byType['reddit'] && byType['reddit'].count > 2) {
    insights.push('Strong Reddit presence detected - community discussions are influencing LLM perceptions');
  }

  if (!byType['news'] && !byType['business_media']) {
    insights.push('Limited news coverage - PR efforts could improve LLM knowledge of your brand');
  }

  const socialTypes = ['reddit', 'linkedin', 'twitter', 'facebook'];
  const socialCount = socialTypes.reduce((sum, type) => sum + (byType[type]?.count || 0), 0);
  if (socialCount === 0) {
    insights.push('No social media sources detected - increase social presence for better LLM coverage');
  }

  if (totalSources === 0) {
    insights.push('No sources found - LLMs may have limited information about your brand');
  }

  return {
    totalSources,
    byType: result,
    insights
  };
}
