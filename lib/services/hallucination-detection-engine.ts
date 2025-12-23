/**
 * Hallucination Detection Engine
 *
 * Detects factual errors, outdated information, competitor confusion,
 * and fabricated claims that LLMs make about a brand.
 */

interface ExtractedClaim {
  type: 'dates' | 'numbers' | 'names' | 'locations' | 'features' | 'comparisons';
  value: string;
  fullContext: string;
  position: number;
}

interface VerificationResult {
  claim: ExtractedClaim;
  status: 'verified_correct' | 'verified_incorrect' | 'unverifiable';
  groundTruthValue: string | null;
  discrepancy: Discrepancy | null;
  severity: SeverityLevel | null;
}

interface Discrepancy {
  claimed: string;
  actual: string;
  type: HallucinationType;
}

type HallucinationType =
  | 'DATE_ERROR'
  | 'COMPETITOR_CONFUSION'
  | 'FABRICATION'
  | 'OUTDATED_INFO'
  | 'EXAGGERATION'
  | 'MISATTRIBUTION';

type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface SeverityScore {
  score: number;
  level: SeverityLevel;
  criteria: string[];
  action: string;
}

interface BrandGroundTruth {
  company: {
    name: string;
    foundedYear?: number;
    headquarters?: string;
    ceo?: string;
    ceoSince?: number;
    parentCompany?: string;
    publiclyTraded: boolean;
    stockTicker?: string;
    employeeCount?: number;
    revenue?: string;
  };
  products: Array<{
    name: string;
    launchYear?: number;
    currentlyAvailable: boolean;
    priceMin?: number;
    priceMax?: number;
    currency?: string;
    keyFeatures: string[];
    categories: string[];
    discontinuedYear?: number;
    successorProduct?: string;
  }>;
  historicalFacts: Array<{
    fact: string;
    year: number;
    category: string;
    verificationSource?: string;
  }>;
  approvedClaims: Array<{
    claim: string;
    category: string;
    approved: boolean;
    regulatoryRestrictions?: string[];
    expirationDate?: string;
  }>;
  competitorDifferentiators: Array<{
    competitor: string;
    theirFeature: string;
    ourEquivalent?: string;
    commonlyConfused: boolean;
  }>;
}

export class HallucinationDetectionEngine {
  /**
   * Extract factual claims from LLM response
   */
  static extractClaims(responseContent: string): ExtractedClaim[] {
    const claimPatterns = {
      dates: /(?:in |since |from |launched in |founded in |started in |began in |established in )(\d{4})/gi,
      numbers: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:employees|stores|countries|locations|users|customers|million|billion|thousand)/gi,
      names: /(?:CEO|founder|president|chairman|chief executive|leader|head)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      locations: /(?:headquartered|based|located|headquarters|office) (?:in |at )([A-Za-z\s,]+?)(?:\.|,|$)/gi,
      features: /(?:features|includes|offers|has|provides|comes with|equipped with)\s+([^.]+?)(?:\.|,|and|$)/gi,
      comparisons: /(?:better than|different from|unlike|compared to|versus|vs\.?)\s+([A-Za-z\s]+?)(?:\.|,|$)/gi
    };

    const extractedClaims: ExtractedClaim[] = [];

    for (const [claimType, pattern] of Object.entries(claimPatterns)) {
      let match;
      while ((match = pattern.exec(responseContent)) !== null) {
        extractedClaims.push({
          type: claimType as ExtractedClaim['type'],
          value: match[1].trim(),
          fullContext: match[0],
          position: match.index
        });
      }
    }

    return extractedClaims;
  }

  /**
   * Verify claims against ground truth
   */
  static verifyClaims(
    extractedClaims: ExtractedClaim[],
    groundTruth: BrandGroundTruth,
    brandName: string
  ): VerificationResult[] {
    const verificationResults: VerificationResult[] = [];

    for (const claim of extractedClaims) {
      const verification: VerificationResult = {
        claim,
        status: 'unverifiable',
        groundTruthValue: null,
        discrepancy: null,
        severity: null
      };

      const match = this.findGroundTruthMatch(claim, groundTruth, brandName);

      if (match) {
        verification.groundTruthValue = match.value;

        if (this.claimsMatch(claim.value, match.value, claim.type)) {
          verification.status = 'verified_correct';
        } else {
          verification.status = 'verified_incorrect';
          const discrepancyType = this.categorizeDiscrepancy(
            claim.value,
            match.value,
            claim.type
          );
          verification.discrepancy = {
            claimed: claim.value,
            actual: match.value,
            type: discrepancyType
          };
          verification.severity = this.calculateSeverity(
            verification.discrepancy
          );
        }
      }

      verificationResults.push(verification);
    }

    return verificationResults;
  }

  /**
   * Find matching ground truth for a claim
   */
  private static findGroundTruthMatch(
    claim: ExtractedClaim,
    groundTruth: BrandGroundTruth,
    brandName: string
  ): { value: string; type: string } | null {
    switch (claim.type) {
      case 'dates':
        // Check founding year
        if (claim.fullContext.toLowerCase().includes('founded') ||
            claim.fullContext.toLowerCase().includes('established')) {
          if (groundTruth.company.foundedYear) {
            return {
              value: groundTruth.company.foundedYear.toString(),
              type: 'foundedYear'
            };
          }
        }
        // Check product launch years
        for (const product of groundTruth.products) {
          if (claim.fullContext.toLowerCase().includes(product.name.toLowerCase())) {
            if (product.launchYear) {
              return {
                value: product.launchYear.toString(),
                type: 'productLaunch'
              };
            }
          }
        }
        break;

      case 'names':
        // Check CEO name
        if (claim.fullContext.toLowerCase().includes('ceo') ||
            claim.fullContext.toLowerCase().includes('chief executive')) {
          if (groundTruth.company.ceo) {
            return {
              value: groundTruth.company.ceo,
              type: 'ceo'
            };
          }
        }
        break;

      case 'locations':
        // Check headquarters
        if (claim.fullContext.toLowerCase().includes('headquarter') ||
            claim.fullContext.toLowerCase().includes('based')) {
          if (groundTruth.company.headquarters) {
            return {
              value: groundTruth.company.headquarters,
              type: 'headquarters'
            };
          }
        }
        break;

      case 'numbers':
        // Check employee count
        if (claim.fullContext.toLowerCase().includes('employee')) {
          if (groundTruth.company.employeeCount) {
            return {
              value: groundTruth.company.employeeCount.toString(),
              type: 'employeeCount'
            };
          }
        }
        break;

      case 'features':
        // Check against competitor features (confusion detection)
        for (const diff of groundTruth.competitorDifferentiators) {
          if (claim.value.toLowerCase().includes(diff.theirFeature.toLowerCase())) {
            return {
              value: `This is ${diff.competitor}'s feature, not ${brandName}'s`,
              type: 'competitorFeature'
            };
          }
        }
        break;
    }

    return null;
  }

  /**
   * Check if claimed value matches ground truth
   */
  private static claimsMatch(
    claimedValue: string,
    actualValue: string,
    claimType: ExtractedClaim['type']
  ): boolean {
    const claimed = claimedValue.toLowerCase().trim();
    const actual = actualValue.toLowerCase().trim();

    if (claimType === 'numbers') {
      // Allow for rounding (within 10% difference)
      const claimedNum = parseFloat(claimed.replace(/,/g, ''));
      const actualNum = parseFloat(actual.replace(/,/g, ''));

      if (!isNaN(claimedNum) && !isNaN(actualNum)) {
        const percentDiff = Math.abs((claimedNum - actualNum) / actualNum);
        return percentDiff < 0.1; // Within 10%
      }
    }

    if (claimType === 'dates') {
      // Exact year match required
      return claimed === actual;
    }

    // For names, locations - fuzzy match
    return claimed.includes(actual) || actual.includes(claimed) ||
           this.levenshteinSimilarity(claimed, actual) > 0.8;
  }

  /**
   * Categorize the type of discrepancy
   */
  private static categorizeDiscrepancy(
    claimed: string,
    actual: string,
    claimType: ExtractedClaim['type']
  ): HallucinationType {
    // Competitor confusion
    if (actual.toLowerCase().includes('competitor') ||
        actual.toLowerCase().includes('not')) {
      return 'COMPETITOR_CONFUSION';
    }

    // Date errors
    if (claimType === 'dates') {
      const claimedYear = parseInt(claimed);
      const actualYear = parseInt(actual);
      if (!isNaN(claimedYear) && !isNaN(actualYear)) {
        const yearDiff = Math.abs(claimedYear - actualYear);
        if (yearDiff > 5) {
          return 'FABRICATION';
        }
        if (claimedYear < actualYear) {
          return 'OUTDATED_INFO';
        }
        return 'DATE_ERROR';
      }
    }

    // Number exaggerations
    if (claimType === 'numbers') {
      const claimedNum = parseFloat(claimed.replace(/,/g, ''));
      const actualNum = parseFloat(actual.replace(/,/g, ''));
      if (!isNaN(claimedNum) && !isNaN(actualNum)) {
        if (claimedNum > actualNum * 2 || claimedNum < actualNum * 0.5) {
          return 'EXAGGERATION';
        }
      }
    }

    return 'MISATTRIBUTION';
  }

  /**
   * Calculate severity of hallucination
   */
  private static calculateSeverity(discrepancy: Discrepancy): SeverityLevel {
    const severityRules: Record<HallucinationType, SeverityLevel> = {
      COMPETITOR_CONFUSION: 'HIGH',
      FABRICATION: 'HIGH',
      EXAGGERATION: 'MEDIUM',
      DATE_ERROR: 'MEDIUM',
      OUTDATED_INFO: 'MEDIUM',
      MISATTRIBUTION: 'LOW'
    };

    return severityRules[discrepancy.type] || 'LOW';
  }

  /**
   * Calculate severity score (0-10)
   */
  static getSeverityScore(level: SeverityLevel): SeverityScore {
    const scores: Record<SeverityLevel, SeverityScore> = {
      CRITICAL: {
        score: 10,
        level: 'CRITICAL',
        criteria: [
          'False health/safety claims',
          'Regulatory/legal misinformation',
          'Major financial misstatements',
          'False accusations or defamation'
        ],
        action: 'Immediate escalation required'
      },
      HIGH: {
        score: 7,
        level: 'HIGH',
        criteria: [
          'Competitor confusion on key differentiators',
          'Wrong CEO/leadership information',
          'Fabricated product features',
          'Significant date errors (>5 years off)'
        ],
        action: 'Priority correction needed'
      },
      MEDIUM: {
        score: 4,
        level: 'MEDIUM',
        criteria: [
          'Minor date errors (1-5 years off)',
          'Outdated but once-true information',
          'Slight numerical exaggerations',
          'Missing context that changes meaning'
        ],
        action: 'Monitor and address in content strategy'
      },
      LOW: {
        score: 2,
        level: 'LOW',
        criteria: [
          'Minor phrasing differences',
          'Rounded numbers vs exact',
          'Regional variations',
          'Stylistic inconsistencies'
        ],
        action: 'Note for reference'
      }
    };

    return scores[level];
  }

  /**
   * Calculate overall accuracy score
   */
  static calculateAccuracyScore(verificationResults: VerificationResult[]): {
    baseAccuracy: number | null;
    adjustedAccuracy: number;
    breakdown: {
      totalClaims: number;
      correctClaims: number;
      incorrectClaims: number;
      unverifiableClaims: number;
    };
    riskLevel: {
      level: string;
      color: string;
      action: string;
    };
  } {
    const total = verificationResults.length;
    const correct = verificationResults.filter(r => r.status === 'verified_correct').length;
    const incorrect = verificationResults.filter(r => r.status === 'verified_incorrect').length;
    const unverifiable = verificationResults.filter(r => r.status === 'unverifiable').length;

    const verifiable = correct + incorrect;
    const baseAccuracy = verifiable > 0 ? (correct / verifiable) * 100 : null;

    // Calculate severity penalty
    const severityPenalty = verificationResults
      .filter(r => r.status === 'verified_incorrect' && r.severity)
      .reduce((sum, r) => {
        const severityScore = this.getSeverityScore(r.severity!).score;
        return sum + (severityScore * 2);
      }, 0);

    const adjustedAccuracy = Math.max(0, (baseAccuracy || 0) - severityPenalty);

    const riskLevel = this.getRiskLevel(adjustedAccuracy);

    return {
      baseAccuracy: baseAccuracy ? Math.round(baseAccuracy) : null,
      adjustedAccuracy: Math.round(adjustedAccuracy),
      breakdown: {
        totalClaims: total,
        correctClaims: correct,
        incorrectClaims: incorrect,
        unverifiableClaims: unverifiable
      },
      riskLevel
    };
  }

  /**
   * Determine risk level based on accuracy score
   */
  private static getRiskLevel(accuracy: number): {
    level: string;
    color: string;
    action: string;
  } {
    if (accuracy >= 90) return { level: 'LOW', color: 'green', action: 'Monitor' };
    if (accuracy >= 70) return { level: 'MEDIUM', color: 'yellow', action: 'Address key errors' };
    if (accuracy >= 50) return { level: 'HIGH', color: 'orange', action: 'Priority intervention' };
    return { level: 'CRITICAL', color: 'red', action: 'Immediate action required' };
  }

  /**
   * Levenshtein similarity for fuzzy string matching
   */
  private static levenshteinSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

export default HallucinationDetectionEngine;
