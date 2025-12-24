/**
 * Anomaly Detector
 *
 * Detects unusual changes in visibility scores using statistical methods
 * and baseline comparisons.
 */

import type { Scan, Baseline, Anomaly, Attribution, Cause } from "@/lib/types/features";

/**
 * Anomaly detection thresholds (in standard deviations)
 */
const ANOMALY_THRESHOLDS = {
  CRITICAL: 3.0,  // >3 sigma
  HIGH: 2.0,      // >2 sigma
  MEDIUM: 1.5,    // >1.5 sigma
  LOW: 1.0        // >1 sigma
};

/**
 * Detect anomalies in a scan compared to baseline
 */
export function detectAnomalies(
  currentScan: Scan,
  baseline: Baseline
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (!currentScan.summary) {
    return anomalies;
  }

  // Check overall score
  const overallAnomaly = detectOverallAnomaly(
    currentScan.summary.overallScore,
    baseline.overallScore,
    baseline.overallStdDev,
    currentScan.timestamp
  );

  if (overallAnomaly) {
    anomalies.push(overallAnomaly);
  }

  // Check LLM-specific scores
  const llmAnomalies = detectLLMAnomalies(
    currentScan.summary.byLLM,
    baseline,
    currentScan.timestamp
  );

  anomalies.push(...llmAnomalies);

  return anomalies;
}

/**
 * Detect overall score anomaly
 */
function detectOverallAnomaly(
  currentScore: number,
  baselineScore: number,
  stdDev: number,
  timestamp: string
): Anomaly | null {
  const change = currentScore - baselineScore;
  const changePercent = baselineScore > 0 ? (change / baselineScore) * 100 : 0;

  // Calculate z-score (number of standard deviations from baseline)
  const zScore = stdDev > 0 ? Math.abs(change) / stdDev : 0;

  // Determine severity
  let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null = null;

  if (zScore >= ANOMALY_THRESHOLDS.CRITICAL) {
    severity = "CRITICAL";
  } else if (zScore >= ANOMALY_THRESHOLDS.HIGH) {
    severity = "HIGH";
  } else if (zScore >= ANOMALY_THRESHOLDS.MEDIUM) {
    severity = "MEDIUM";
  } else if (zScore >= ANOMALY_THRESHOLDS.LOW) {
    severity = "LOW";
  }

  if (!severity) {
    return null; // Not an anomaly
  }

  return {
    type: "overall_visibility",
    severity,
    currentValue: currentScore,
    baselineValue: baselineScore,
    change,
    changePercent,
    direction: change > 0 ? "IMPROVEMENT" : "DECLINE",
    timestamp
  };
}

/**
 * Detect LLM-specific anomalies
 */
function detectLLMAnomalies(
  currentScores: Record<string, number>,
  baseline: Baseline,
  timestamp: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const llms = ["chatgpt", "gemini", "copilot", "perplexity"] as const;

  for (const llm of llms) {
    const currentScore = currentScores[llm] || 0;
    const baselineScore = baseline.byLLM[llm];
    const stdDev = baseline.byLLMStdDev[llm];

    const change = currentScore - baselineScore;
    const changePercent = baselineScore > 0 ? (change / baselineScore) * 100 : 0;

    // Calculate z-score
    const zScore = stdDev > 0 ? Math.abs(change) / stdDev : 0;

    // Determine severity
    let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null = null;

    if (zScore >= ANOMALY_THRESHOLDS.CRITICAL) {
      severity = "CRITICAL";
    } else if (zScore >= ANOMALY_THRESHOLDS.HIGH) {
      severity = "HIGH";
    } else if (zScore >= ANOMALY_THRESHOLDS.MEDIUM) {
      severity = "MEDIUM";
    } else if (zScore >= ANOMALY_THRESHOLDS.LOW) {
      severity = "LOW";
    }

    if (severity) {
      anomalies.push({
        type: `${llm}_visibility`,
        severity,
        currentValue: currentScore,
        baselineValue: baselineScore,
        change,
        changePercent,
        direction: change > 0 ? "IMPROVEMENT" : "DECLINE",
        llm,
        timestamp
      });
    }
  }

  return anomalies;
}

/**
 * Attribute anomaly to possible causes
 */
export async function attributeAnomaly(
  anomaly: Anomaly,
  historicalScans: Scan[],
  brandDomain: string
): Promise<Attribution> {
  const possibleCauses: Cause[] = [];

  // Cause 1: Model Update (check if anomaly is LLM-specific)
  if (anomaly.llm) {
    const modelUpdateLikelihood = await checkModelUpdate(anomaly, historicalScans);
    if (modelUpdateLikelihood.confidence !== "LOW") {
      possibleCauses.push(modelUpdateLikelihood);
    }
  }

  // Cause 2: Competitor Content Change
  const competitorContentChange = await checkCompetitorContentChange(anomaly, historicalScans);
  if (competitorContentChange.confidence !== "LOW") {
    possibleCauses.push(competitorContentChange);
  }

  // Cause 3: Brand Content Change
  const brandContentChange = await checkBrandContentChange(anomaly, brandDomain);
  if (brandContentChange.confidence !== "LOW") {
    possibleCauses.push(brandContentChange);
  }

  // Cause 4: Algorithm Change
  const algorithmChange = detectAlgorithmChange(anomaly, historicalScans);
  if (algorithmChange.confidence !== "LOW") {
    possibleCauses.push(algorithmChange);
  }

  // Determine most likely cause
  const mostLikelyCause = possibleCauses.length > 0
    ? possibleCauses.sort((a, b) => {
      const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    })[0]
    : null;

  return {
    anomaly,
    possibleCauses,
    mostLikelyCause
  };
}

/**
 * Check if model update caused anomaly
 */
async function checkModelUpdate(
  anomaly: Anomaly,
  historicalScans: Scan[]
): Promise<Cause> {
  // Check if anomaly is isolated to one LLM
  const isIsolated = anomaly.llm !== undefined;

  if (!isIsolated) {
    return {
      type: "MODEL_UPDATE",
      confidence: "LOW",
      details: { reason: "Anomaly affects multiple LLMs" },
      explanation: "Model update unlikely - change affects multiple platforms"
    };
  }

  // Check if this LLM showed sudden change
  const llmScores = historicalScans
    .map(scan => scan.summary?.byLLM[anomaly.llm as keyof typeof scan.summary.byLLM])
    .filter((score): score is number => score !== undefined);

  const recentScores = llmScores.slice(-5);
  const wasStable = calculateStdDev(recentScores) < 5;

  if (wasStable && Math.abs(anomaly.changePercent) > 15) {
    return {
      type: "MODEL_UPDATE",
      confidence: "HIGH",
      details: {
        llm: anomaly.llm,
        changePercent: anomaly.changePercent,
        previousStability: calculateStdDev(recentScores)
      },
      explanation: `${anomaly.llm} showed sudden ${anomaly.direction === "DECLINE" ? "decline" : "improvement"} after stable period - likely model update`
    };
  }

  return {
    type: "MODEL_UPDATE",
    confidence: "MEDIUM",
    details: { llm: anomaly.llm },
    explanation: `${anomaly.llm}-specific change detected - possible model update`
  };
}

/**
 * Check if competitor content change caused anomaly
 */
async function checkCompetitorContentChange(
  anomaly: Anomaly,
  historicalScans: Scan[]
): Promise<Cause> {
  // This would ideally integrate with competitor monitoring
  // For now, use heuristics

  if (anomaly.direction === "DECLINE" && Math.abs(anomaly.changePercent) > 20) {
    return {
      type: "COMPETITOR_CONTENT" as const,
      confidence: "MEDIUM" as const,
      details: {
        changePercent: anomaly.changePercent,
        direction: "DECLINE"
      },
      explanation: "Significant decline detected - competitors may have published new content"
    };
  }

  return {
    type: "COMPETITOR_CONTENT" as const,
    confidence: "LOW" as const,
    details: {},
    explanation: "No strong indicators of competitor content changes"
  };
}

/**
 * Check if brand content change caused anomaly
 */
async function checkBrandContentChange(
  anomaly: Anomaly,
  brandDomain: string
): Promise<Cause> {
  // This would ideally integrate with brand's CMS or sitemap
  // For now, use heuristics

  if (anomaly.direction === "IMPROVEMENT" && Math.abs(anomaly.changePercent) > 15) {
    return {
      type: "BRAND_CONTENT_CHANGE" as const,
      confidence: "MEDIUM" as const,
      details: {
        changePercent: anomaly.changePercent,
        direction: "IMPROVEMENT"
      },
      explanation: "Significant improvement detected - brand may have published new authoritative content"
    };
  }

  return {
    type: "BRAND_CONTENT_CHANGE" as const,
    confidence: "LOW" as const,
    details: {},
    explanation: "No strong indicators of brand content changes"
  };
}

/**
 * Detect algorithm change (affects all LLMs)
 */
function detectAlgorithmChange(
  anomaly: Anomaly,
  historicalScans: Scan[]
): Cause {
  // Algorithm change likely if:
  // 1. Affects overall score (not LLM-specific)
  // 2. Multiple LLMs show similar changes

  if (anomaly.type === "overall_visibility") {
    return {
      type: "ALGORITHM_CHANGE" as const,
      confidence: "MEDIUM" as const,
      details: {
        changePercent: anomaly.changePercent
      },
      explanation: "Overall visibility change detected - possible algorithm or ranking change across platforms"
    };
  }

  return {
    type: "ALGORITHM_CHANGE" as const,
    confidence: "LOW" as const,
    details: {},
    explanation: "Change is LLM-specific - unlikely to be algorithm change"
  };
}

/**
 * Calculate standard deviation (helper)
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;

  return Math.sqrt(variance);
}

/**
 * Detect anomaly patterns across multiple scans
 */
export function detectAnomalyPatterns(
  anomalies: Anomaly[]
): {
  hasPattern: boolean;
  patternType: "sustained_decline" | "sustained_improvement" | "volatility" | "none";
  description: string;
} {
  if (anomalies.length < 3) {
    return {
      hasPattern: false,
      patternType: "none",
      description: "Insufficient data for pattern detection"
    };
  }

  // Sort by timestamp
  const sorted = [...anomalies].sort((a, b) =>
    new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime()
  );

  // Check for sustained decline
  const declines = sorted.filter(a => a.direction === "DECLINE");
  if (declines.length >= sorted.length * 0.7) {
    return {
      hasPattern: true,
      patternType: "sustained_decline",
      description: `${declines.length} of ${sorted.length} recent scans show decline - sustained downward trend`
    };
  }

  // Check for sustained improvement
  const improvements = sorted.filter(a => a.direction === "IMPROVEMENT");
  if (improvements.length >= sorted.length * 0.7) {
    return {
      hasPattern: true,
      patternType: "sustained_improvement",
      description: `${improvements.length} of ${sorted.length} recent scans show improvement - sustained upward trend`
    };
  }

  // Check for volatility (rapid ups and downs)
  const directionChanges = sorted.reduce((count, anomaly, i) => {
    if (i === 0) return 0;
    const prevDirection = sorted[i - 1].direction;
    return anomaly.direction !== prevDirection ? count + 1 : count;
  }, 0);

  if (directionChanges >= sorted.length * 0.6) {
    return {
      hasPattern: true,
      patternType: "volatility",
      description: `${directionChanges} direction changes in ${sorted.length} scans - high volatility detected`
    };
  }

  return {
    hasPattern: false,
    patternType: "none",
    description: "No clear pattern detected in recent anomalies"
  };
}

/**
 * Generate recommendations based on anomalies
 */
export function generateAnomalyRecommendations(
  anomalies: Anomaly[],
  attributions: Attribution[]
): string[] {
  const recommendations: string[] = [];

  // Critical anomalies
  const critical = anomalies.filter(a => a.severity === "CRITICAL");
  if (critical.length > 0) {
    recommendations.push(
      `🚨 CRITICAL: ${critical.length} critical anomal${critical.length === 1 ? "y" : "ies"} detected - immediate investigation required`
    );
  }

  // Pattern-based recommendations
  const pattern = detectAnomalyPatterns(anomalies);
  if (pattern.hasPattern) {
    if (pattern.patternType === "sustained_decline") {
      recommendations.push(
        "⚠️ Sustained decline detected - review content strategy and competitor activity"
      );
    } else if (pattern.patternType === "volatility") {
      recommendations.push(
        "⚠️ High volatility detected - monitor for model updates and algorithm changes"
      );
    }
  }

  // Attribution-based recommendations
  for (const attribution of attributions) {
    if (attribution.mostLikelyCause) {
      const cause = attribution.mostLikelyCause;

      switch (cause.type) {
        case "MODEL_UPDATE":
          recommendations.push(
            `Model update detected on ${attribution.anomaly.llm} - re-optimize content for new model behavior`
          );
          break;

        case "COMPETITOR_CONTENT":
          recommendations.push(
            "Competitor content likely improved - conduct competitive analysis and update your content"
          );
          break;

        case "BRAND_CONTENT_CHANGE":
          if (attribution.anomaly.direction === "IMPROVEMENT") {
            recommendations.push(
              "Recent content improvements working - continue current content strategy"
            );
          }
          break;

        case "ALGORITHM_CHANGE":
          recommendations.push(
            "Algorithm change detected - monitor all platforms and adjust SEO strategy"
          );
          break;
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ No significant anomalies requiring action");
  }

  return recommendations;
}
