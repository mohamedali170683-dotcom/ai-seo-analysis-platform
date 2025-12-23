import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import HallucinationDetectionEngine from '@/lib/services/hallucination-detection-engine';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * POST /api/hallucination-detection/scan
 * Run a hallucination detection scan for a brand
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groundTruthId } = body;

    if (!groundTruthId) {
      return NextResponse.json(
        { success: false, error: 'Ground truth ID is required' },
        { status: 400 }
      );
    }

    // Fetch ground truth data
    const groundTruthData = await prisma.brandGroundTruth.findUnique({
      where: { id: groundTruthId },
      include: {
        products: true,
        historicalFacts: true,
        approvedClaims: true,
        competitorDifferentiators: true
      }
    });

    if (!groundTruthData) {
      return NextResponse.json(
        { success: false, error: 'Ground truth not found' },
        { status: 404 }
      );
    }

    // Create detection record
    const detection = await prisma.hallucinationDetection.create({
      data: {
        groundTruthId,
        status: 'in_progress'
      }
    });

    // Generate fact-checking queries
    const queries = generateFactCheckingQueries(groundTruthData);

    // Query all LLMs
    const llmResults = await Promise.all([
      queryLLM('chatgpt', queries, groundTruthData.companyName),
      queryLLM('gemini', queries, groundTruthData.companyName)
    ]);

    // Transform ground truth data for detection engine
    const brandGroundTruth = {
      company: {
        name: groundTruthData.companyName,
        foundedYear: groundTruthData.foundedYear || undefined,
        headquarters: groundTruthData.headquarters || undefined,
        ceo: groundTruthData.ceo || undefined,
        ceoSince: groundTruthData.ceoSince || undefined,
        parentCompany: groundTruthData.parentCompany || undefined,
        publiclyTraded: groundTruthData.publiclyTraded,
        stockTicker: groundTruthData.stockTicker || undefined,
        employeeCount: groundTruthData.employeeCount || undefined,
        revenue: groundTruthData.revenue || undefined
      },
      products: groundTruthData.products.map(p => ({
        name: p.name,
        launchYear: p.launchYear || undefined,
        currentlyAvailable: p.currentlyAvailable,
        priceMin: p.priceMin || undefined,
        priceMax: p.priceMax || undefined,
        currency: p.currency || undefined,
        keyFeatures: p.keyFeatures,
        categories: p.categories,
        discontinuedYear: p.discontinuedYear || undefined,
        successorProduct: p.successorProduct || undefined
      })),
      historicalFacts: groundTruthData.historicalFacts.map(f => ({
        fact: f.fact,
        year: f.year,
        category: f.category,
        verificationSource: f.verificationSource || undefined
      })),
      approvedClaims: groundTruthData.approvedClaims.map(c => ({
        claim: c.claim,
        category: c.category,
        approved: c.approved,
        regulatoryRestrictions: c.regulatoryRestrictions,
        expirationDate: c.expirationDate?.toISOString()
      })),
      competitorDifferentiators: groundTruthData.competitorDifferentiators.map(d => ({
        competitor: d.competitor,
        theirFeature: d.theirFeature,
        ourEquivalent: d.ourEquivalent || undefined,
        commonlyConfused: d.commonlyConfused
      }))
    };

    // Process results for each LLM
    const allHallucinations = [];
    const llmAccuracies: Record<string, number> = {};

    for (const { llm, results } of llmResults) {
      for (const result of results) {
        // Extract claims from response
        const extractedClaims = HallucinationDetectionEngine.extractClaims(
          result.response
        );

        // Verify claims against ground truth
        const verificationResults = HallucinationDetectionEngine.verifyClaims(
          extractedClaims,
          brandGroundTruth,
          groundTruthData.companyName
        );

        // Calculate accuracy for this LLM
        const accuracyScore = HallucinationDetectionEngine.calculateAccuracyScore(
          verificationResults
        );

        llmAccuracies[llm] = accuracyScore.adjustedAccuracy;

        // Extract hallucinations
        const hallucinations = verificationResults
          .filter(v => v.status === 'verified_incorrect')
          .map(v => ({
            llm,
            query: result.query,
            claimedFact: v.claim.value,
            actualFact: v.groundTruthValue || 'Unknown',
            category: v.discrepancy?.type || 'UNKNOWN',
            severity: v.severity || 'LOW',
            severityScore: HallucinationDetectionEngine.getSeverityScore(
              v.severity || 'LOW'
            ).score,
            fullContext: result.response,
            responseSnippet: v.claim.fullContext,
            suggestedAction: generateSuggestedAction(v.discrepancy?.type || 'UNKNOWN')
          }));

        allHallucinations.push(...hallucinations);
      }
    }

    // Calculate overall statistics
    const totalClaims = llmResults.reduce((sum, { results }) =>
      sum + results.reduce((s, r) =>
        s + HallucinationDetectionEngine.extractClaims(r.response).length, 0
      ), 0
    );

    const correctClaims = totalClaims - allHallucinations.length;
    const incorrectClaims = allHallucinations.length;

    const overallAccuracy = totalClaims > 0
      ? ((correctClaims / totalClaims) * 100)
      : 0;

    const adjustedAccuracy = HallucinationDetectionEngine.calculateAccuracyScore(
      llmResults.flatMap(({ results }) =>
        results.flatMap(r => {
          const claims = HallucinationDetectionEngine.extractClaims(r.response);
          return HallucinationDetectionEngine.verifyClaims(
            claims,
            brandGroundTruth,
            groundTruthData.companyName
          );
        })
      )
    ).adjustedAccuracy;

    const riskLevel = HallucinationDetectionEngine.calculateAccuracyScore(
      llmResults.flatMap(({ results }) =>
        results.flatMap(r => {
          const claims = HallucinationDetectionEngine.extractClaims(r.response);
          return HallucinationDetectionEngine.verifyClaims(
            claims,
            brandGroundTruth,
            groundTruthData.companyName
          );
        })
      )
    ).riskLevel.level;

    // Save hallucinations to database
    if (allHallucinations.length > 0) {
      await prisma.hallucination.createMany({
        data: allHallucinations.map(h => ({
          detectionId: detection.id,
          ...h
        }))
      });
    }

    // Generate recommendations
    const recommendations = generateRecommendations(
      allHallucinations,
      groundTruthData.companyName
    );

    if (recommendations.length > 0) {
      await prisma.recommendation.createMany({
        data: recommendations.map(r => ({
          detectionId: detection.id,
          ...r
        }))
      });
    }

    // Update detection with results
    const updatedDetection = await prisma.hallucinationDetection.update({
      where: { id: detection.id },
      data: {
        status: 'completed',
        overallAccuracy,
        adjustedAccuracy,
        riskLevel,
        chatgptAccuracy: llmAccuracies['chatgpt'],
        geminiAccuracy: llmAccuracies['gemini'],
        totalClaims,
        correctClaims,
        incorrectClaims,
        unverifiableClaims: 0,
        completedAt: new Date()
      },
      include: {
        hallucinations: true,
        recommendations: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedDetection
    }, { status: 200 });

  } catch (error) {
    console.error('Error running hallucination detection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run hallucination detection' },
      { status: 500 }
    );
  }
}

/**
 * Generate fact-checking queries based on ground truth data
 */
function generateFactCheckingQueries(groundTruth: any): string[] {
  const queries: string[] = [];
  const brandName = groundTruth.companyName;

  // Company facts
  queries.push(`When was ${brandName} founded?`);
  if (groundTruth.ceo) {
    queries.push(`Who is the CEO of ${brandName}?`);
  }
  if (groundTruth.headquarters) {
    queries.push(`Where is ${brandName} headquartered?`);
  }
  if (groundTruth.employeeCount) {
    queries.push(`How many employees does ${brandName} have?`);
  }

  // Product facts
  for (const product of groundTruth.products.slice(0, 3)) { // Limit to 3 products
    queries.push(`When was ${product.name} launched?`);
    queries.push(`What are the key features of ${product.name}?`);
  }

  // Competitor differentiation
  for (const diff of groundTruth.competitorDifferentiators.slice(0, 2)) {
    queries.push(`Does ${brandName} have ${diff.theirFeature}?`);
  }

  return queries;
}

/**
 * Query an LLM with fact-checking questions
 */
async function queryLLM(
  llm: string,
  queries: string[],
  brandName: string
): Promise<{ llm: string; results: Array<{ query: string; response: string }> }> {
  const results: Array<{ query: string; response: string }> = [];

  for (const query of queries) {
    try {
      let response = '';

      if (llm === 'chatgpt') {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Answer the question with specific facts only. Include dates, numbers, and names where relevant. If you\'re not certain, say "I\'m not certain" rather than guessing.'
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1
        });
        response = completion.choices[0]?.message?.content || '';
      } else if (llm === 'gemini') {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(query);
        response = result.response.text();
      }

      results.push({ query, response });
    } catch (error) {
      console.error(`Error querying ${llm}:`, error);
      results.push({ query, response: 'Error: Could not get response' });
    }
  }

  return { llm, results };
}

/**
 * Generate suggested action based on hallucination type
 */
function generateSuggestedAction(category: string): string {
  const actions: Record<string, string> = {
    DATE_ERROR: 'Update official sources with correct dates. Ensure Wikipedia and company website have accurate information.',
    COMPETITOR_CONFUSION: 'Create clear differentiation content. Publish comparison articles highlighting unique features.',
    FABRICATION: 'Publish authoritative content with correct facts. Consider issuing corrections if misinformation is widespread.',
    OUTDATED_INFO: 'Update all public-facing sources with current information. Archive old press releases with clarifications.',
    EXAGGERATION: 'Provide accurate metrics in official communications. Ensure fact sheets are up to date.',
    MISATTRIBUTION: 'Clarify attribution in press releases and official statements.'
  };

  return actions[category] || 'Review and correct misinformation in official sources.';
}

/**
 * Generate recommendations based on hallucinations
 */
function generateRecommendations(
  hallucinations: any[],
  brandName: string
): Array<{
  priority: string;
  category: string;
  title: string;
  description: string;
  affectedLLMs: string[];
  suggestedContent: string;
}> {
  const recommendations: any[] = [];

  // Critical hallucinations
  const critical = hallucinations.filter(h => h.severity === 'CRITICAL');
  if (critical.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'misinformation_correction',
      title: 'Correct critical misinformation immediately',
      description: `Found ${critical.length} critical misinformation issues that require immediate attention.`,
      affectedLLMs: [...new Set(critical.map(h => h.llm))],
      suggestedContent: 'Issue press release with correct information. Update all official sources.'
    });
  }

  // Competitor confusion
  const competitorConfusion = hallucinations.filter(h => h.category === 'COMPETITOR_CONFUSION');
  if (competitorConfusion.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'differentiation',
      title: 'Clarify brand differentiation from competitors',
      description: `LLMs are confusing ${brandName} features with competitor features.`,
      affectedLLMs: [...new Set(competitorConfusion.map(h => h.llm))],
      suggestedContent: 'Create comparison content highlighting unique features and differentiators.'
    });
  }

  // Outdated information
  const outdated = hallucinations.filter(h => h.category === 'OUTDATED_INFO');
  if (outdated.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'content_refresh',
      title: 'Update outdated information across web presence',
      description: `Found ${outdated.length} instances of outdated information.`,
      affectedLLMs: [...new Set(outdated.map(h => h.llm))],
      suggestedContent: 'Audit and update Wikipedia, company website, and press releases with current information.'
    });
  }

  return recommendations;
}
