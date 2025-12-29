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

interface PositioningResponse {
  aspect: string;
  question: string;
  expectedAnswer: string;
  llmAnswer: string;
  alignment: 'aligned' | 'partially_aligned' | 'misaligned';
  explanation: string;
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
      queryLLMForPositioning('perplexity', 'llama-3.1-sonar-small-128k-online', brandName, questions, positioning),
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

    const scanResult = {
      id: detection.id,
      scanDate: detection.scanDate.toISOString(),
      status: 'completed',
      alignmentScore: overallScore,
      llmResults
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
        if (apiKey) {
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
              }
            })
          });

          const data = await geminiResponse.json();

          if (geminiResponse.ok && data.candidates?.[0]?.content?.parts) {
            llmAnswer = data.candidates[0].content.parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('\n');
          }
        }
      } else if (llmName === 'perplexity') {
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (apiKey) {
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
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
          }
        }
      } else if (llmName === 'claude') {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
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
          }
        }
      }

      // Analyze alignment
      const alignment = analyzeAlignment(llmAnswer, q.expected, positioning, q.aspect);

      responses.push({
        aspect: q.aspect,
        question: q.question,
        expectedAnswer: q.expected,
        llmAnswer: llmAnswer.slice(0, 500),
        alignment: alignment.status,
        explanation: alignment.explanation
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

function analyzeAlignment(
  llmAnswer: string,
  expectedAnswer: string,
  positioning: BrandPositioning,
  aspect: string
): { status: 'aligned' | 'partially_aligned' | 'misaligned'; explanation: string } {
  const answerLower = llmAnswer.toLowerCase();
  const expectedLower = expectedAnswer.toLowerCase();

  // Check for "I don't know" or uncertainty
  if (
    answerLower.includes("i don't know") ||
    answerLower.includes("i'm not sure") ||
    answerLower.includes("i cannot") ||
    answerLower.includes("i do not have")
  ) {
    return {
      status: 'partially_aligned',
      explanation: 'LLM expressed uncertainty about this aspect'
    };
  }

  // Specific checks based on aspect
  if (aspect === 'market_positioning' || aspect === 'price_point') {
    const primary = positioning.primary?.toLowerCase() || '';
    const pricePoint = positioning.pricePoint?.toLowerCase() || '';

    // Check for contradictions
    const budgetTerms = ['budget', 'cheap', 'affordable', 'low-cost', 'economical'];
    const premiumTerms = ['premium', 'luxury', 'high-end', 'exclusive', 'expensive'];

    const isBudgetPositioning = budgetTerms.some(t => primary.includes(t) || pricePoint.includes(t));
    const isPremiumPositioning = premiumTerms.some(t => primary.includes(t) || pricePoint.includes(t));

    const llmSaysBudget = budgetTerms.some(t => answerLower.includes(t));
    const llmSaysPremium = premiumTerms.some(t => answerLower.includes(t));

    if (isBudgetPositioning && llmSaysPremium) {
      return {
        status: 'misaligned',
        explanation: `LLM describes the brand as premium/high-end, but you position as ${positioning.pricePoint || positioning.primary}`
      };
    }

    if (isPremiumPositioning && llmSaysBudget) {
      return {
        status: 'misaligned',
        explanation: `LLM describes the brand as budget/affordable, but you position as ${positioning.pricePoint || positioning.primary}`
      };
    }

    // Check for alignment with primary positioning
    if (answerLower.includes(primary)) {
      return {
        status: 'aligned',
        explanation: `LLM correctly identifies the brand as ${positioning.primary}`
      };
    }

    // Check secondary positioning
    for (const secondary of positioning.secondary || []) {
      if (answerLower.includes(secondary.toLowerCase())) {
        return {
          status: 'aligned',
          explanation: `LLM identifies key brand attribute: ${secondary}`
        };
      }
    }

    return {
      status: 'partially_aligned',
      explanation: 'LLM response does not explicitly mention your positioning but no contradictions found'
    };
  }

  if (aspect === 'target_audience') {
    const targetLower = positioning.targetAudience?.toLowerCase() || '';

    // Check for key audience terms
    const audienceTerms = targetLower.split(/[\s,]+/).filter(t => t.length > 3);
    const matchingTerms = audienceTerms.filter(t => answerLower.includes(t));

    if (matchingTerms.length >= 2) {
      return {
        status: 'aligned',
        explanation: 'LLM correctly identifies target audience'
      };
    }

    if (matchingTerms.length >= 1) {
      return {
        status: 'partially_aligned',
        explanation: 'LLM partially matches target audience description'
      };
    }

    return {
      status: 'partially_aligned',
      explanation: 'Target audience description differs but may not be contradictory'
    };
  }

  if (aspect === 'brand_attributes') {
    const matchedAttributes = (positioning.secondary || []).filter(attr =>
      answerLower.includes(attr.toLowerCase())
    );

    if (matchedAttributes.length >= 2) {
      return {
        status: 'aligned',
        explanation: `LLM identifies key attributes: ${matchedAttributes.join(', ')}`
      };
    }

    if (matchedAttributes.length >= 1) {
      return {
        status: 'partially_aligned',
        explanation: `LLM identifies some attributes: ${matchedAttributes.join(', ')}`
      };
    }

    return {
      status: 'partially_aligned',
      explanation: 'LLM describes different attributes'
    };
  }

  if (aspect === 'brand_voice') {
    const matchedTones = (positioning.tone || []).filter(tone =>
      answerLower.includes(tone.toLowerCase())
    );

    if (matchedTones.length >= 1) {
      return {
        status: 'aligned',
        explanation: `LLM correctly identifies brand tone: ${matchedTones.join(', ')}`
      };
    }

    return {
      status: 'partially_aligned',
      explanation: 'LLM describes a different brand voice'
    };
  }

  // Default: check for keyword overlap
  const expectedWords = expectedLower.split(/\s+/).filter(w => w.length > 4);
  const matchingWords = expectedWords.filter(w => answerLower.includes(w));

  if (matchingWords.length >= expectedWords.length * 0.5) {
    return {
      status: 'aligned',
      explanation: 'Response aligns with expected positioning'
    };
  }

  if (matchingWords.length >= 1) {
    return {
      status: 'partially_aligned',
      explanation: 'Response partially matches expected positioning'
    };
  }

  return {
    status: 'partially_aligned',
    explanation: 'Unable to determine clear alignment or misalignment'
  };
}
