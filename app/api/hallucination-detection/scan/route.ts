import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import HallucinationDetectionEngine from '@/lib/services/hallucination-detection-engine';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Types for transparent analysis data
interface QueryResult {
  query: string;
  response: string;
  timestamp: number;
}

interface ExtractedClaimData {
  type: string;
  value: string;
  fullContext: string;
}

interface ClaimVerification {
  claim: ExtractedClaimData;
  status: 'verified_correct' | 'verified_incorrect' | 'unverifiable';
  groundTruthValue: string | null;
  discrepancyType: string | null;
  severity: string | null;
}

interface LLMAnalysis {
  llm: string;
  model: string;
  queries: QueryResult[];
  extractedClaims: ExtractedClaimData[];
  verifications: ClaimVerification[];
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unverifiableCount: number;
}

interface TransparentAnalysisData {
  groundTruthFields: {
    field: string;
    value: string | number | null;
    tested: boolean;
  }[];
  queriesGenerated: string[];
  llmAnalyses: LLMAnalysis[];
  scoringBreakdown: {
    totalClaimsExtracted: number;
    verifiableClaims: number;
    correctClaims: number;
    incorrectClaims: number;
    unverifiableClaims: number;
    baseAccuracy: number;
    severityPenalty: number;
    adjustedAccuracy: number;
    riskLevel: string;
    methodology: string;
  };
}

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

    // Build ground truth fields for transparency
    const groundTruthFields = [
      { field: 'Company Name', value: groundTruthData.companyName, tested: true },
      { field: 'Founded Year', value: groundTruthData.foundedYear, tested: !!groundTruthData.foundedYear },
      { field: 'Headquarters', value: groundTruthData.headquarters, tested: !!groundTruthData.headquarters },
      { field: 'CEO', value: groundTruthData.ceo, tested: !!groundTruthData.ceo },
      { field: 'Employee Count', value: groundTruthData.employeeCount, tested: !!groundTruthData.employeeCount },
      { field: 'Industry', value: groundTruthData.industry, tested: false }, // Not directly queried
      { field: 'Products', value: groundTruthData.products.length > 0 ? `${groundTruthData.products.length} products` : null, tested: groundTruthData.products.length > 0 },
    ];

    // Query all LLMs with detailed logging
    const llmResults = await Promise.all([
      queryLLMWithDetails('chatgpt', 'gpt-4o-mini', queries, groundTruthData.companyName),
      queryLLMWithDetails('gemini', 'gemini-2.0-flash', queries, groundTruthData.companyName)
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

    // Process results for each LLM with full transparency
    const allHallucinations: any[] = [];
    const llmAccuracies: Record<string, number> = {};
    const llmAnalyses: LLMAnalysis[] = [];

    for (const { llm, model, results } of llmResults) {
      const llmExtractedClaims: ExtractedClaimData[] = [];
      const llmVerifications: ClaimVerification[] = [];
      let llmCorrect = 0;
      let llmIncorrect = 0;
      let llmUnverifiable = 0;

      for (const result of results) {
        // Extract claims from response
        const extractedClaims = HallucinationDetectionEngine.extractClaims(
          result.response
        );

        // Store extracted claims for transparency
        for (const claim of extractedClaims) {
          llmExtractedClaims.push({
            type: claim.type,
            value: claim.value,
            fullContext: claim.fullContext
          });
        }

        // Verify claims against ground truth
        const verificationResults = HallucinationDetectionEngine.verifyClaims(
          extractedClaims,
          brandGroundTruth,
          groundTruthData.companyName
        );

        // Store verifications for transparency
        for (const v of verificationResults) {
          llmVerifications.push({
            claim: {
              type: v.claim.type,
              value: v.claim.value,
              fullContext: v.claim.fullContext
            },
            status: v.status,
            groundTruthValue: v.groundTruthValue,
            discrepancyType: v.discrepancy?.type || null,
            severity: v.severity || null
          });

          if (v.status === 'verified_correct') llmCorrect++;
          else if (v.status === 'verified_incorrect') llmIncorrect++;
          else llmUnverifiable++;
        }

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

      // Calculate accuracy for this LLM
      const verifiable = llmCorrect + llmIncorrect;
      const llmAccuracy = verifiable > 0 ? Math.round((llmCorrect / verifiable) * 100) : 0;
      llmAccuracies[llm] = llmAccuracy;

      // Build LLM analysis for transparency
      llmAnalyses.push({
        llm,
        model,
        queries: results.map(r => ({
          query: r.query,
          response: r.response,
          timestamp: r.timestamp
        })),
        extractedClaims: llmExtractedClaims,
        verifications: llmVerifications,
        accuracy: llmAccuracy,
        correctCount: llmCorrect,
        incorrectCount: llmIncorrect,
        unverifiableCount: llmUnverifiable
      });
    }

    // Calculate overall statistics with full breakdown
    const allVerifications = llmAnalyses.flatMap(a => a.verifications);
    const totalClaimsExtracted = allVerifications.length;
    const correctClaimsCount = allVerifications.filter(v => v.status === 'verified_correct').length;
    const incorrectClaimsCount = allVerifications.filter(v => v.status === 'verified_incorrect').length;
    const unverifiableClaimsCount = allVerifications.filter(v => v.status === 'unverifiable').length;

    const verifiableTotal = correctClaimsCount + incorrectClaimsCount;
    const baseAccuracyValue = verifiableTotal > 0 ? (correctClaimsCount / verifiableTotal) * 100 : 0;

    // Calculate severity penalty
    const severityPenalty = allVerifications
      .filter(v => v.status === 'verified_incorrect' && v.severity)
      .reduce((sum, v) => {
        const severityScore = HallucinationDetectionEngine.getSeverityScore(
          (v.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW'
        ).score;
        return sum + (severityScore * 2);
      }, 0);

    const totalClaims = totalClaimsExtracted;
    const correctClaims = correctClaimsCount;
    const incorrectClaims = incorrectClaimsCount;
    const overallAccuracy = baseAccuracyValue;
    const adjustedAccuracy = Math.max(0, baseAccuracyValue - severityPenalty);

    // Determine risk level
    const getRiskLevel = (accuracy: number) => {
      if (accuracy >= 90) return 'LOW';
      if (accuracy >= 70) return 'MEDIUM';
      if (accuracy >= 50) return 'HIGH';
      return 'CRITICAL';
    };
    const riskLevel = getRiskLevel(adjustedAccuracy);

    // Build scoring breakdown for transparency
    const scoringBreakdown = {
      totalClaimsExtracted,
      verifiableClaims: verifiableTotal,
      correctClaims: correctClaimsCount,
      incorrectClaims: incorrectClaimsCount,
      unverifiableClaims: unverifiableClaimsCount,
      baseAccuracy: Math.round(baseAccuracyValue),
      severityPenalty: Math.round(severityPenalty),
      adjustedAccuracy: Math.round(adjustedAccuracy),
      riskLevel,
      methodology: `Base accuracy = (Correct Claims / Verifiable Claims) × 100 = (${correctClaimsCount} / ${verifiableTotal}) × 100 = ${Math.round(baseAccuracyValue)}%. Severity penalty of ${Math.round(severityPenalty)}% was applied based on the severity of incorrect claims (CRITICAL: -20%, HIGH: -14%, MEDIUM: -8%, LOW: -4%). Final adjusted accuracy: ${Math.round(adjustedAccuracy)}%.`
    };

    // Build complete transparent analysis data
    const transparentAnalysis: TransparentAnalysisData = {
      groundTruthFields,
      queriesGenerated: queries,
      llmAnalyses,
      scoringBreakdown
    };

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
      data: {
        ...updatedDetection,
        transparentAnalysis
      }
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
 * Query an LLM with fact-checking questions (with detailed logging)
 */
async function queryLLMWithDetails(
  llm: string,
  model: string,
  queries: string[],
  brandName: string
): Promise<{ llm: string; model: string; results: Array<{ query: string; response: string; timestamp: number }> }> {
  const results: Array<{ query: string; response: string; timestamp: number }> = [];

  for (const query of queries) {
    const timestamp = Date.now();
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
        // Use REST API for Gemini (SDK has regional issues)
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

          const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: query }] }],
              generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.1,
              },
            }),
          });

          const data = await geminiResponse.json();

          if (geminiResponse.ok && data.candidates?.[0]?.content?.parts) {
            const parts = data.candidates[0].content.parts;
            response = parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('\n');
          }
        }
      }

      results.push({ query, response, timestamp });
    } catch (error) {
      console.error(`Error querying ${llm}:`, error);
      results.push({ query, response: 'Error: Could not get response', timestamp });
    }
  }

  return { llm, model, results };
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
