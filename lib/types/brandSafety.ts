/**
 * Type definitions for brand safety and hallucination detection
 */

// ==================== Ground Truth ====================

export interface GroundTruth {
  id: string;
  brandId: string;
  category: GroundTruthCategory;
  topic: string;
  facts: GroundTruthFact[];
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
}

export type GroundTruthCategory =
  | "company_info"
  | "products"
  | "pricing"
  | "features"
  | "availability"
  | "leadership"
  | "locations"
  | "certifications"
  | "awards"
  | "partnerships";

export interface GroundTruthFact {
  id: string;
  statement: string;
  value: string | number | boolean | string[];
  source: string;
  verifiedAt: string;
  expiresAt?: string; // For time-sensitive facts
  confidence: "verified" | "assumed" | "deprecated";
}

// ==================== Hallucinations ====================

export interface HallucinationDetection {
  id: string;
  scanId: string;
  llm: string;
  query: string;
  detectedAt: string;
  hallucinations: Hallucination[];
  overallSeverity: HallucinationSeverity;
  brandSafetyScore: number; // 0-100
}

export interface Hallucination {
  id: string;
  type: HallucinationType;
  severity: HallucinationSeverity;
  claim: string;
  truth: string;
  category: GroundTruthCategory;
  context: string;
  impact: HallucinationImpact;
  recommendations: string[];
}

export type HallucinationType =
  | "factual_error"
  | "pricing_error"
  | "feature_misrepresentation"
  | "availability_error"
  | "outdated_information"
  | "nonexistent_product"
  | "incorrect_attribution"
  | "fabricated_claim";

export type HallucinationSeverity =
  | "critical"  // Completely false, damages brand
  | "high"      // Significantly incorrect
  | "medium"    // Partially incorrect
  | "low";      // Minor inaccuracy

export interface HallucinationImpact {
  brandDamage: "severe" | "moderate" | "minor" | "none";
  userConfusion: "high" | "medium" | "low";
  legalRisk: "high" | "medium" | "low" | "none";
  competitiveHarm: "high" | "medium" | "low" | "none";
}

// ==================== Brand Safety ====================

export interface BrandSafetyReport {
  id: string;
  scanId: string;
  generatedAt: string;
  overallScore: number; // 0-100
  breakdown: BrandSafetyBreakdown;
  issues: BrandSafetyIssue[];
  recommendations: string[];
}

export interface BrandSafetyBreakdown {
  factualAccuracy: number;
  sentimentSafety: number;
  competitivePosition: number;
  citationQuality: number;
  hallucinationRate: number;
}

export interface BrandSafetyIssue {
  id: string;
  type: SafetyIssueType;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedLLMs: string[];
  affectedQueries: string[];
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved";
}

export type SafetyIssueType =
  | "hallucination"
  | "negative_sentiment"
  | "competitor_bias"
  | "misinformation"
  | "broken_citation"
  | "toxic_content"
  | "brand_confusion";

// ==================== Fact Checking ====================

export interface FactCheckResult {
  claim: string;
  verdict: FactCheckVerdict;
  confidence: number; // 0-100
  groundTruthMatch?: GroundTruthFact;
  explanation: string;
  sources: string[];
}

export type FactCheckVerdict =
  | "verified"      // Matches ground truth
  | "false"         // Contradicts ground truth
  | "misleading"    // Partially true but context is wrong
  | "outdated"      // Was true but no longer
  | "unverifiable"; // No ground truth available

// ==================== Citation Verification ====================

export interface CitationVerificationResult {
  url: string;
  accessible: boolean;
  brandMentioned: boolean;
  factuallyAccurate: boolean;
  sentiment: "positive" | "neutral" | "negative";
  hallucinations: string[];
  verifiedAt: string;
}

// ==================== Broken Link Detection ====================

export interface BrokenLinkReport {
  scanId: string;
  detectedAt: string;
  brokenLinks: BrokenLink[];
  totalCitations: number;
  brokenRate: number;
}

export interface BrokenLink {
  url: string;
  llm: string;
  query: string;
  error: string;
  httpStatus?: number;
  suggestedFix?: string;
}

// ==================== Misinformation Tracking ====================

export interface MisinformationTracker {
  brandId: string;
  trackedClaims: TrackedClaim[];
  spreadRate: SpreadRate;
  lastUpdated: string;
}

export interface TrackedClaim {
  id: string;
  claim: string;
  isTrue: boolean;
  firstDetected: string;
  occurrences: ClaimOccurrence[];
  severity: "critical" | "high" | "medium" | "low";
  status: "spreading" | "contained" | "corrected";
}

export interface ClaimOccurrence {
  llm: string;
  query: string;
  detectedAt: string;
  context: string;
}

export interface SpreadRate {
  last24h: number;
  last7d: number;
  last30d: number;
  trending: "up" | "stable" | "down";
}

// ==================== Toxicity Detection ====================

export interface ToxicityAnalysis {
  scanId: string;
  llm: string;
  query: string;
  content: string;
  toxicityScore: number; // 0-100
  categories: ToxicityCategory[];
  severity: "severe" | "moderate" | "mild" | "none";
  requiresAction: boolean;
}

export interface ToxicityCategory {
  category: string;
  score: number;
  examples: string[];
}

// ==================== Brand Confusion ====================

export interface BrandConfusionDetection {
  scanId: string;
  confusedWith: string[];
  instances: ConfusionInstance[];
  severityScore: number; // 0-100
}

export interface ConfusionInstance {
  llm: string;
  query: string;
  confusedBrand: string;
  context: string;
  detectedAt: string;
}
