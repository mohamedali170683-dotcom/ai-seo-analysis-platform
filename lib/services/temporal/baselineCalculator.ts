/**
 * Baseline Calculator
 *
 * Establishes baseline metrics from historical scans to enable
 * anomaly detection and drift tracking.
 */

import type { Scan, Baseline } from "@/lib/types/features";

/**
 * Calculate baseline from historical scans
 */
export function calculateBaseline(scans: Scan[]): Baseline {
  if (scans.length === 0) {
    throw new Error("Cannot calculate baseline with no historical scans");
  }

  // Extract overall scores
  const overallScores = scans
    .map(scan => scan.summary?.overallScore)
    .filter((score): score is number => score !== undefined);

  // Extract LLM-specific scores
  const llmScores = {
    chatgpt: [] as number[],
    gemini: [] as number[],
    copilot: [] as number[],
    perplexity: [] as number[]
  };

  for (const scan of scans) {
    if (scan.summary?.byLLM) {
      llmScores.chatgpt.push(scan.summary.byLLM.chatgpt || 0);
      llmScores.gemini.push(scan.summary.byLLM.gemini || 0);
      llmScores.copilot.push(scan.summary.byLLM.copilot || 0);
      llmScores.perplexity.push(scan.summary.byLLM.perplexity || 0);
    }
  }

  // Calculate overall baseline
  const overallScore = calculateMean(overallScores);
  const overallStdDev = calculateStdDev(overallScores);

  // Calculate LLM-specific baselines
  const byLLM = {
    chatgpt: calculateMean(llmScores.chatgpt),
    gemini: calculateMean(llmScores.gemini),
    copilot: calculateMean(llmScores.copilot),
    perplexity: calculateMean(llmScores.perplexity)
  };

  const byLLMStdDev = {
    chatgpt: calculateStdDev(llmScores.chatgpt),
    gemini: calculateStdDev(llmScores.gemini),
    copilot: calculateStdDev(llmScores.copilot),
    perplexity: calculateStdDev(llmScores.perplexity)
  };

  return {
    overallScore,
    overallStdDev,
    byLLM,
    byLLMStdDev
  };
}

/**
 * Calculate mean (average)
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);

  return Math.sqrt(variance);
}

/**
 * Calculate rolling baseline (weighted toward recent scans)
 */
export function calculateRollingBaseline(
  scans: Scan[],
  windowSize: number = 10,
  recencyWeight: number = 0.7
): Baseline {
  if (scans.length === 0) {
    throw new Error("Cannot calculate baseline with no historical scans");
  }

  // Take most recent scans within window
  const recentScans = scans.slice(-windowSize);

  // Apply recency weighting
  const weights = generateRecencyWeights(recentScans.length, recencyWeight);

  // Extract weighted scores
  const weightedOverallScores: number[] = [];
  const weightedLLMScores = {
    chatgpt: [] as number[],
    gemini: [] as number[],
    copilot: [] as number[],
    perplexity: [] as number[]
  };

  for (let i = 0; i < recentScans.length; i++) {
    const scan = recentScans[i];
    const weight = weights[i];

    // Apply weight to overall score
    if (scan.summary?.overallScore) {
      weightedOverallScores.push(scan.summary.overallScore * weight);
    }

    // Apply weight to LLM scores
    if (scan.summary?.byLLM) {
      weightedLLMScores.chatgpt.push((scan.summary.byLLM.chatgpt || 0) * weight);
      weightedLLMScores.gemini.push((scan.summary.byLLM.gemini || 0) * weight);
      weightedLLMScores.copilot.push((scan.summary.byLLM.copilot || 0) * weight);
      weightedLLMScores.perplexity.push((scan.summary.byLLM.perplexity || 0) * weight);
    }
  }

  // Normalize weighted sums
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const overallScore = weightedOverallScores.reduce((sum, val) => sum + val, 0) / totalWeight;
  const overallStdDev = calculateStdDev(
    recentScans.map(s => s.summary?.overallScore || 0)
  );

  const byLLM = {
    chatgpt: weightedLLMScores.chatgpt.reduce((sum, val) => sum + val, 0) / totalWeight,
    gemini: weightedLLMScores.gemini.reduce((sum, val) => sum + val, 0) / totalWeight,
    copilot: weightedLLMScores.copilot.reduce((sum, val) => sum + val, 0) / totalWeight,
    perplexity: weightedLLMScores.perplexity.reduce((sum, val) => sum + val, 0) / totalWeight
  };

  const byLLMStdDev = {
    chatgpt: calculateStdDev(recentScans.map(s => s.summary?.byLLM.chatgpt || 0)),
    gemini: calculateStdDev(recentScans.map(s => s.summary?.byLLM.gemini || 0)),
    copilot: calculateStdDev(recentScans.map(s => s.summary?.byLLM.copilot || 0)),
    perplexity: calculateStdDev(recentScans.map(s => s.summary?.byLLM.perplexity || 0))
  };

  return {
    overallScore,
    overallStdDev,
    byLLM,
    byLLMStdDev
  };
}

/**
 * Generate recency weights (exponential decay)
 */
function generateRecencyWeights(count: number, recencyWeight: number): number[] {
  const weights: number[] = [];

  for (let i = 0; i < count; i++) {
    // Exponential decay: more recent = higher weight
    const position = i / (count - 1); // 0 (oldest) to 1 (newest)
    const weight = Math.pow(position, 1 - recencyWeight);
    weights.push(weight);
  }

  return weights;
}

/**
 * Check if baseline is stable (low variance)
 */
export function isBaselineStable(baseline: Baseline, threshold: number = 5): boolean {
  // Baseline is stable if standard deviation is below threshold
  return baseline.overallStdDev < threshold;
}

/**
 * Compare two baselines
 */
export function compareBaselines(
  current: Baseline,
  previous: Baseline
): {
  overallChange: number;
  overallChangePercent: number;
  byLLMChanges: Record<string, { change: number; changePercent: number }>;
  trend: "improving" | "declining" | "stable";
} {
  const overallChange = current.overallScore - previous.overallScore;
  const overallChangePercent = previous.overallScore > 0
    ? (overallChange / previous.overallScore) * 100
    : 0;

  const byLLMChanges: Record<string, { change: number; changePercent: number }> = {};

  for (const llm of ["chatgpt", "gemini", "copilot", "perplexity"] as const) {
    const change = current.byLLM[llm] - previous.byLLM[llm];
    const changePercent = previous.byLLM[llm] > 0
      ? (change / previous.byLLM[llm]) * 100
      : 0;

    byLLMChanges[llm] = { change, changePercent };
  }

  // Determine trend
  let trend: "improving" | "declining" | "stable";
  if (Math.abs(overallChangePercent) < 5) {
    trend = "stable";
  } else {
    trend = overallChange > 0 ? "improving" : "declining";
  }

  return {
    overallChange,
    overallChangePercent,
    byLLMChanges,
    trend
  };
}

/**
 * Get minimum scans needed for reliable baseline
 */
export function getMinimumScansForBaseline(
  scanFrequency: "hourly" | "daily" | "weekly"
): number {
  switch (scanFrequency) {
    case "hourly":
      return 24; // 1 day of hourly scans
    case "daily":
      return 7;  // 1 week of daily scans
    case "weekly":
      return 4;  // 1 month of weekly scans
    default:
      return 7;
  }
}

/**
 * Validate baseline quality
 */
export function validateBaseline(baseline: Baseline, scans: Scan[]): {
  isValid: boolean;
  warnings: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
} {
  const warnings: string[] = [];
  let isValid = true;
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";

  // Check 1: Sufficient data points
  if (scans.length < 7) {
    warnings.push(`Only ${scans.length} scans available - baseline may be unreliable`);
    confidence = scans.length < 3 ? "LOW" : "MEDIUM";
  }

  // Check 2: High variance
  if (baseline.overallStdDev > 15) {
    warnings.push(`High variance detected (σ=${baseline.overallStdDev.toFixed(1)}) - baseline unstable`);
    confidence = confidence === "HIGH" ? "MEDIUM" : confidence;
  }

  // Check 3: Missing LLM data
  const llms = ["chatgpt", "gemini", "copilot", "perplexity"] as const;
  for (const llm of llms) {
    if (baseline.byLLM[llm] === 0) {
      warnings.push(`No data for ${llm} - LLM-specific baseline incomplete`);
      confidence = confidence === "HIGH" ? "MEDIUM" : confidence;
    }
  }

  // Check 4: Outliers (simplified)
  const scores = scans.map(s => s.summary?.overallScore || 0).filter(s => s > 0);
  const outliers = scores.filter(score =>
    Math.abs(score - baseline.overallScore) > 3 * baseline.overallStdDev
  );

  if (outliers.length > scores.length * 0.2) {
    warnings.push(`${outliers.length} outlier scans detected - consider cleaning data`);
    confidence = confidence === "HIGH" ? "MEDIUM" : confidence;
  }

  // Baseline is invalid if confidence is LOW
  if (confidence === "LOW") {
    isValid = false;
  }

  return { isValid, warnings, confidence };
}
