/**
 * Hallucination Detector
 *
 * Detects when AI platforms generate false or inaccurate information about a brand
 */

import type {
  GroundTruth,
  GroundTruthFact,
  HallucinationDetection,
  Hallucination,
  HallucinationType,
  HallucinationSeverity,
  FactCheckResult,
  FactCheckVerdict
} from "@/lib/types/brandSafety";
import type { LLMResponse } from "@/lib/types/features";

/**
 * Detect hallucinations in LLM responses
 */
export async function detectHallucinations(
  responses: LLMResponse[],
  groundTruths: GroundTruth[],
  brand: string
): Promise<HallucinationDetection[]> {
  const detections: HallucinationDetection[] = [];

  for (const response of responses) {
    const detection = await analyzeResponseForHallucinations(
      response,
      groundTruths,
      brand
    );

    if (detection.hallucinations.length > 0) {
      detections.push(detection);
    }
  }

  return detections;
}

/**
 * Analyze a single response for hallucinations
 */
async function analyzeResponseForHallucinations(
  response: LLMResponse,
  groundTruths: GroundTruth[],
  brand: string
): Promise<HallucinationDetection> {
  const content = response.content || response.fullResponse || "";
  const hallucinations: Hallucination[] = [];

  // Extract claims from response
  const claims = extractClaims(content, brand);

  // Check each claim against ground truth
  for (const claim of claims) {
    const factCheck = checkClaimAgainstGroundTruth(claim, groundTruths);

    if (factCheck.verdict === "false" || factCheck.verdict === "misleading") {
      const hallucination = createHallucinationFromFactCheck(claim, factCheck);
      hallucinations.push(hallucination);
    }
  }

  // Detect specific types of hallucinations
  hallucinations.push(...detectPricingErrors(content, groundTruths));
  hallucinations.push(...detectFeatureMisrepresentation(content, groundTruths));
  hallucinations.push(...detectNonexistentProducts(content, groundTruths));
  hallucinations.push(...detectOutdatedInformation(content, groundTruths));

  const overallSeverity = determineOverallSeverity(hallucinations);
  const brandSafetyScore = calculateBrandSafetyScore(hallucinations);

  return {
    id: generateDetectionId(),
    scanId: response.timestamp, // Use timestamp as scan ID for now
    llm: response.llm,
    query: response.query,
    detectedAt: new Date().toISOString(),
    hallucinations,
    overallSeverity,
    brandSafetyScore
  };
}

/**
 * Extract claims about the brand from content
 */
function extractClaims(content: string, brand: string): string[] {
  const claims: string[] = [];
  const brandLower = brand.toLowerCase();

  // Split into sentences
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  // Filter to sentences mentioning the brand
  const brandSentences = sentences.filter(s =>
    s.toLowerCase().includes(brandLower)
  );

  // Extract factual claims (sentences with is/are/has/costs/offers/provides)
  const factualPatterns = [
    /\bis\b/i,
    /\bare\b/i,
    /\bhas\b/i,
    /\bhave\b/i,
    /\bcosts?\b/i,
    /\boffers?\b/i,
    /\bprovides?\b/i,
    /\bfeatures?\b/i,
    /\bavailable\b/i,
    /\bpriced?\b/i,
    /\bstarts? at\b/i
  ];

  for (const sentence of brandSentences) {
    if (factualPatterns.some(pattern => pattern.test(sentence))) {
      claims.push(sentence);
    }
  }

  return claims;
}

/**
 * Check a claim against ground truth
 */
function checkClaimAgainstGroundTruth(
  claim: string,
  groundTruths: GroundTruth[]
): FactCheckResult {
  const claimLower = claim.toLowerCase();

  // Try to match claim to ground truth category
  for (const groundTruth of groundTruths) {
    for (const fact of groundTruth.facts) {
      const factStatement = fact.statement.toLowerCase();

      // Check if claim contains the fact's topic
      if (claimLower.includes(factStatement) || factStatement.includes(claimLower)) {
        // Compare claim to fact value
        const valueStr = String(fact.value).toLowerCase();

        if (claimLower.includes(valueStr)) {
          return {
            claim,
            verdict: "verified",
            confidence: 90,
            groundTruthMatch: fact,
            explanation: "Claim matches verified ground truth",
            sources: [fact.source]
          };
        } else {
          return {
            claim,
            verdict: "false",
            confidence: 85,
            groundTruthMatch: fact,
            explanation: `Claim contradicts ground truth. Truth: ${fact.statement} is ${fact.value}`,
            sources: [fact.source]
          };
        }
      }
    }
  }

  return {
    claim,
    verdict: "unverifiable",
    confidence: 0,
    explanation: "No ground truth available for this claim",
    sources: []
  };
}

/**
 * Create hallucination from fact check result
 */
function createHallucinationFromFactCheck(
  claim: string,
  factCheck: FactCheckResult
): Hallucination {
  const type: HallucinationType = "factual_error";
  const severity: HallucinationSeverity = "high";

  const truth = factCheck.groundTruthMatch
    ? `${factCheck.groundTruthMatch.statement}: ${factCheck.groundTruthMatch.value}`
    : "Unknown";

  return {
    id: generateHallucinationId(),
    type,
    severity,
    claim,
    truth,
    category: "company_info",
    context: claim,
    impact: {
      brandDamage: "moderate",
      userConfusion: "high",
      legalRisk: "medium",
      competitiveHarm: "medium"
    },
    recommendations: [
      "Update AI training data with correct information",
      "Submit correction request to AI platform",
      "Monitor for recurrence"
    ]
  };
}

/**
 * Detect pricing errors
 */
function detectPricingErrors(
  content: string,
  groundTruths: GroundTruth[]
): Hallucination[] {
  const hallucinations: Hallucination[] = [];
  const pricingTruths = groundTruths.find(gt => gt.category === "pricing");

  if (!pricingTruths) return hallucinations;

  // Extract price mentions
  const pricePatterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /costs? [\d,]+ dollars?/gi,
    /priced? at [\d,]+/gi,
    /starts? at \$[\d,]+/gi
  ];

  const mentionedPrices: string[] = [];
  for (const pattern of pricePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      mentionedPrices.push(...matches);
    }
  }

  // Check each mentioned price against ground truth
  for (const priceMention of mentionedPrices) {
    const isCorrect = pricingTruths.facts.some(fact => {
      const truthPrice = String(fact.value);
      return priceMention.includes(truthPrice);
    });

    if (!isCorrect && pricingTruths.facts.length > 0) {
      hallucinations.push({
        id: generateHallucinationId(),
        type: "pricing_error",
        severity: "critical",
        claim: `Incorrect pricing: ${priceMention}`,
        truth: `Correct pricing: ${pricingTruths.facts.map(f => f.value).join(", ")}`,
        category: "pricing",
        context: priceMention,
        impact: {
          brandDamage: "severe",
          userConfusion: "high",
          legalRisk: "high",
          competitiveHarm: "high"
        },
        recommendations: [
          "URGENT: Submit pricing correction to AI platform",
          "Review pricing information on website",
          "Ensure pricing schema markup is up to date"
        ]
      });
    }
  }

  return hallucinations;
}

/**
 * Detect feature misrepresentation
 */
function detectFeatureMisrepresentation(
  content: string,
  groundTruths: GroundTruth[]
): Hallucination[] {
  const hallucinations: Hallucination[] = [];
  const featureTruths = groundTruths.find(gt => gt.category === "features");

  if (!featureTruths) return hallucinations;

  // Look for feature claims
  const featurePatterns = /(?:features?|includes?|offers?|provides?)\s+([^.!?]+)/gi;
  const matches = content.matchAll(featurePatterns);

  for (const match of matches) {
    const claimedFeatures = match[1].toLowerCase();

    // Check if claimed features exist in ground truth
    for (const fact of featureTruths.facts) {
      const featureName = String(fact.value).toLowerCase();

      if (claimedFeatures.includes(featureName)) {
        continue; // Feature is correct
      }
    }
  }

  return hallucinations;
}

/**
 * Detect nonexistent products
 */
function detectNonexistentProducts(
  content: string,
  groundTruths: GroundTruth[]
): Hallucination[] {
  const hallucinations: Hallucination[] = [];
  const productTruths = groundTruths.find(gt => gt.category === "products");

  if (!productTruths) return hallucinations;

  const knownProducts = productTruths.facts.map(f => String(f.value).toLowerCase());

  // Look for product mentions
  const productPatterns = /(?:product|model|version)\s+([A-Z0-9][A-Z0-9\s-]*)/g;
  const matches = content.matchAll(productPatterns);

  for (const match of matches) {
    const productMention = match[1].toLowerCase();

    if (!knownProducts.some(p => productMention.includes(p) || p.includes(productMention))) {
      hallucinations.push({
        id: generateHallucinationId(),
        type: "nonexistent_product",
        severity: "critical",
        claim: `Nonexistent product: ${match[1]}`,
        truth: `Known products: ${knownProducts.join(", ")}`,
        category: "products",
        context: match[0],
        impact: {
          brandDamage: "severe",
          userConfusion: "high",
          legalRisk: "medium",
          competitiveHarm: "medium"
        },
        recommendations: [
          "Submit correction to AI platform",
          "Update product information with schema markup",
          "Monitor for future occurrences"
        ]
      });
    }
  }

  return hallucinations;
}

/**
 * Detect outdated information
 */
function detectOutdatedInformation(
  content: string,
  groundTruths: GroundTruth[]
): Hallucination[] {
  const hallucinations: Hallucination[] = [];
  const now = new Date();

  for (const groundTruth of groundTruths) {
    for (const fact of groundTruth.facts) {
      if (fact.expiresAt) {
        const expiryDate = new Date(fact.expiresAt);

        if (now > expiryDate) {
          // This fact has expired - check if it's still mentioned
          const factMentioned = content.toLowerCase().includes(String(fact.value).toLowerCase());

          if (factMentioned) {
            hallucinations.push({
              id: generateHallucinationId(),
              type: "outdated_information",
              severity: "medium",
              claim: `Outdated: ${fact.statement}`,
              truth: "Information has been updated",
              category: groundTruth.category,
              context: fact.statement,
              impact: {
                brandDamage: "minor",
                userConfusion: "medium",
                legalRisk: "low",
                competitiveHarm: "low"
              },
              recommendations: [
                "Update ground truth database",
                "Submit updated information to AI platforms",
                "Ensure website has current information"
              ]
            });
          }
        }
      }
    }
  }

  return hallucinations;
}

/**
 * Determine overall severity
 */
function determineOverallSeverity(hallucinations: Hallucination[]): HallucinationSeverity {
  if (hallucinations.length === 0) return "low";

  const hasCritical = hallucinations.some(h => h.severity === "critical");
  if (hasCritical) return "critical";

  const hasHigh = hallucinations.some(h => h.severity === "high");
  if (hasHigh) return "high";

  const hasMedium = hallucinations.some(h => h.severity === "medium");
  if (hasMedium) return "medium";

  return "low";
}

/**
 * Calculate brand safety score (0-100)
 */
function calculateBrandSafetyScore(hallucinations: Hallucination[]): number {
  if (hallucinations.length === 0) return 100;

  let score = 100;

  for (const hallucination of hallucinations) {
    switch (hallucination.severity) {
      case "critical":
        score -= 25;
        break;
      case "high":
        score -= 15;
        break;
      case "medium":
        score -= 8;
        break;
      case "low":
        score -= 3;
        break;
    }
  }

  return Math.max(0, score);
}

/**
 * Generate hallucination ID
 */
function generateHallucinationId(): string {
  return `hall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate detection ID
 */
function generateDetectionId(): string {
  return `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get hallucination summary
 */
export function getHallucinationSummary(
  detections: HallucinationDetection[]
): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  byLLM: Record<string, number>;
  averageSafetyScore: number;
} {
  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  const byType: Record<string, number> = {};
  const byLLM: Record<string, number> = {};

  let totalSafetyScore = 0;

  for (const detection of detections) {
    bySeverity[detection.overallSeverity]++;
    byLLM[detection.llm] = (byLLM[detection.llm] || 0) + detection.hallucinations.length;
    totalSafetyScore += detection.brandSafetyScore;

    for (const hallucination of detection.hallucinations) {
      byType[hallucination.type] = (byType[hallucination.type] || 0) + 1;
    }
  }

  return {
    total: detections.reduce((sum, d) => sum + d.hallucinations.length, 0),
    bySeverity,
    byType,
    byLLM,
    averageSafetyScore: detections.length > 0 ? totalSafetyScore / detections.length : 100
  };
}
