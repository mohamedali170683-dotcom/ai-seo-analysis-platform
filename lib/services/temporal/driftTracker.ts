/**
 * Drift Tracker
 *
 * Monitors long-term visibility trends and tracks drift over time.
 * Combines baseline calculation, anomaly detection, and attribution.
 */

import type { Scan, Baseline, Anomaly, Attribution } from "@/lib/types/features";
import { calculateBaseline, calculateRollingBaseline, validateBaseline } from "./baselineCalculator";
import { detectAnomalies, attributeAnomaly, detectAnomalyPatterns, generateAnomalyRecommendations } from "./anomalyDetector";

export interface DriftReport {
  timestamp: string;
  brand: string;
  currentScan: Scan;
  baseline: Baseline;
  baselineValidation: {
    isValid: boolean;
    warnings: string[];
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };
  anomalies: Anomaly[];
  attributions: Attribution[];
  drift: DriftAnalysis;
  trends: TrendAnalysis;
  recommendations: string[];
}

export interface DriftAnalysis {
  overallDrift: number;
  driftPercent: number;
  driftDirection: "positive" | "negative" | "stable";
  driftVelocity: number; // Change per day
  byLLM: Record<string, {
    drift: number;
    driftPercent: number;
    direction: "positive" | "negative" | "stable";
  }>;
}

export interface TrendAnalysis {
  shortTerm: {
    period: string;
    trend: "improving" | "declining" | "stable";
    changePercent: number;
  };
  longTerm: {
    period: string;
    trend: "improving" | "declining" | "stable";
    changePercent: number;
  };
  anomalyPattern: {
    hasPattern: boolean;
    patternType: "sustained_decline" | "sustained_improvement" | "volatility" | "none";
    description: string;
  };
}

/**
 * Track drift for a new scan
 */
export async function trackDrift(
  currentScan: Scan,
  historicalScans: Scan[],
  brandDomain: string,
  options?: {
    useRollingBaseline?: boolean;
    windowSize?: number;
  }
): Promise<DriftReport> {
  // Calculate baseline
  const baseline = options?.useRollingBaseline
    ? calculateRollingBaseline(historicalScans, options.windowSize)
    : calculateBaseline(historicalScans);

  // Validate baseline
  const baselineValidation = validateBaseline(baseline, historicalScans);

  // Detect anomalies
  const anomalies = detectAnomalies(currentScan, baseline);

  // Attribute anomalies
  const attributions: Attribution[] = [];
  for (const anomaly of anomalies) {
    const attribution = await attributeAnomaly(anomaly, historicalScans, brandDomain);
    attributions.push(attribution);
  }

  // Analyze drift
  const drift = analyzeDrift(currentScan, baseline, historicalScans);

  // Analyze trends
  const trends = analyzeTrends(currentScan, historicalScans, anomalies);

  // Generate recommendations
  const recommendations = generateAnomalyRecommendations(anomalies, attributions);

  return {
    timestamp: new Date().toISOString(),
    brand: currentScan.brand,
    currentScan,
    baseline,
    baselineValidation,
    anomalies,
    attributions,
    drift,
    trends,
    recommendations
  };
}

/**
 * Analyze drift (deviation from baseline)
 */
function analyzeDrift(
  currentScan: Scan,
  baseline: Baseline,
  historicalScans: Scan[]
): DriftAnalysis {
  if (!currentScan.summary) {
    return createEmptyDriftAnalysis();
  }

  // Overall drift
  const overallDrift = currentScan.summary.overallScore - baseline.overallScore;
  const driftPercent = baseline.overallScore > 0
    ? (overallDrift / baseline.overallScore) * 100
    : 0;

  let driftDirection: "positive" | "negative" | "stable";
  if (Math.abs(driftPercent) < 5) {
    driftDirection = "stable";
  } else {
    driftDirection = overallDrift > 0 ? "positive" : "negative";
  }

  // Calculate drift velocity (change per day)
  const driftVelocity = calculateDriftVelocity(currentScan, historicalScans);

  // LLM-specific drift
  const byLLM: Record<string, any> = {};
  const llms = ["chatgpt", "gemini", "copilot", "perplexity"] as const;

  for (const llm of llms) {
    const currentScore = currentScan.summary.byLLM[llm] || 0;
    const baselineScore = baseline.byLLM[llm];
    const drift = currentScore - baselineScore;
    const driftPercent = baselineScore > 0 ? (drift / baselineScore) * 100 : 0;

    let direction: "positive" | "negative" | "stable";
    if (Math.abs(driftPercent) < 5) {
      direction = "stable";
    } else {
      direction = drift > 0 ? "positive" : "negative";
    }

    byLLM[llm] = { drift, driftPercent, direction };
  }

  return {
    overallDrift,
    driftPercent,
    driftDirection,
    driftVelocity,
    byLLM
  };
}

/**
 * Calculate drift velocity (points per day)
 */
function calculateDriftVelocity(
  currentScan: Scan,
  historicalScans: Scan[]
): number {
  if (historicalScans.length < 2 || !currentScan.summary) {
    return 0;
  }

  // Get most recent historical scan
  const sortedScans = [...historicalScans].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const previousScan = sortedScans[0];
  if (!previousScan.summary) return 0;

  // Calculate change
  const change = currentScan.summary.overallScore - previousScan.summary.overallScore;

  // Calculate time difference in days
  const currentTime = new Date(currentScan.timestamp).getTime();
  const previousTime = new Date(previousScan.timestamp).getTime();
  const daysDiff = (currentTime - previousTime) / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) return 0;

  return change / daysDiff;
}

/**
 * Analyze trends (short-term and long-term)
 */
function analyzeTrends(
  currentScan: Scan,
  historicalScans: Scan[],
  anomalies: Anomaly[]
): TrendAnalysis {
  const allScans = [...historicalScans, currentScan].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Short-term trend (last 7 scans or 7 days)
  const shortTermScans = allScans.slice(-7);
  const shortTerm = calculateTrend(shortTermScans, "7 scans/days");

  // Long-term trend (last 30 scans or 30 days)
  const longTermScans = allScans.slice(-30);
  const longTerm = calculateTrend(longTermScans, "30 scans/days");

  // Anomaly pattern
  const anomalyPattern = detectAnomalyPatterns(anomalies);

  return {
    shortTerm,
    longTerm,
    anomalyPattern
  };
}

/**
 * Calculate trend for a set of scans
 */
function calculateTrend(
  scans: Scan[],
  period: string
): {
  period: string;
  trend: "improving" | "declining" | "stable";
  changePercent: number;
} {
  if (scans.length < 2) {
    return {
      period,
      trend: "stable",
      changePercent: 0
    };
  }

  const firstScore = scans[0].summary?.overallScore || 0;
  const lastScore = scans[scans.length - 1].summary?.overallScore || 0;

  const change = lastScore - firstScore;
  const changePercent = firstScore > 0 ? (change / firstScore) * 100 : 0;

  let trend: "improving" | "declining" | "stable";
  if (Math.abs(changePercent) < 5) {
    trend = "stable";
  } else {
    trend = change > 0 ? "improving" : "declining";
  }

  return {
    period,
    trend,
    changePercent: Math.round(changePercent * 10) / 10
  };
}

/**
 * Create empty drift analysis
 */
function createEmptyDriftAnalysis(): DriftAnalysis {
  return {
    overallDrift: 0,
    driftPercent: 0,
    driftDirection: "stable",
    driftVelocity: 0,
    byLLM: {
      chatgpt: { drift: 0, driftPercent: 0, direction: "stable" },
      gemini: { drift: 0, driftPercent: 0, direction: "stable" },
      copilot: { drift: 0, driftPercent: 0, direction: "stable" },
      perplexity: { drift: 0, driftPercent: 0, direction: "stable" }
    }
  };
}

/**
 * Generate drift summary report
 */
export function generateDriftSummary(report: DriftReport): string {
  const lines: string[] = [];

  lines.push(`# Visibility Drift Report - ${new Date(report.timestamp).toLocaleDateString()}`);
  lines.push("");

  // Overall status
  lines.push("## Overall Status");
  lines.push(`- Current Score: ${report.currentScan.summary?.overallScore || 0}`);
  lines.push(`- Baseline Score: ${Math.round(report.baseline.overallScore)}`);
  lines.push(`- Drift: ${report.drift.overallDrift > 0 ? "+" : ""}${Math.round(report.drift.overallDrift)} (${report.drift.driftPercent > 0 ? "+" : ""}${report.drift.driftPercent.toFixed(1)}%)`);
  lines.push(`- Direction: ${report.drift.driftDirection.toUpperCase()}`);
  lines.push(`- Velocity: ${report.drift.driftVelocity > 0 ? "+" : ""}${report.drift.driftVelocity.toFixed(2)} points/day`);
  lines.push("");

  // Anomalies
  if (report.anomalies.length > 0) {
    lines.push("## Anomalies Detected");
    for (const anomaly of report.anomalies) {
      const icon = anomaly.severity === "CRITICAL" ? "🚨" :
                   anomaly.severity === "HIGH" ? "⚠️" :
                   anomaly.severity === "MEDIUM" ? "⚡" : "ℹ️";

      lines.push(`${icon} ${anomaly.type}: ${anomaly.direction} of ${Math.abs(anomaly.changePercent).toFixed(1)}% (${anomaly.severity})`);
    }
    lines.push("");
  }

  // Trends
  lines.push("## Trends");
  lines.push(`- Short-term (${report.trends.shortTerm.period}): ${report.trends.shortTerm.trend.toUpperCase()} (${report.trends.shortTerm.changePercent > 0 ? "+" : ""}${report.trends.shortTerm.changePercent}%)`);
  lines.push(`- Long-term (${report.trends.longTerm.period}): ${report.trends.longTerm.trend.toUpperCase()} (${report.trends.longTerm.changePercent > 0 ? "+" : ""}${report.trends.longTerm.changePercent}%)`);

  if (report.trends.anomalyPattern.hasPattern) {
    lines.push(`- Pattern: ${report.trends.anomalyPattern.description}`);
  }
  lines.push("");

  // LLM-specific drift
  lines.push("## Drift by LLM");
  for (const [llm, drift] of Object.entries(report.drift.byLLM)) {
    lines.push(`- ${llm}: ${drift.direction.toUpperCase()} (${drift.driftPercent > 0 ? "+" : ""}${drift.driftPercent.toFixed(1)}%)`);
  }
  lines.push("");

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push("## Recommendations");
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push("");
  }

  // Baseline validation
  if (!report.baselineValidation.isValid || report.baselineValidation.warnings.length > 0) {
    lines.push("## Baseline Warnings");
    lines.push(`- Confidence: ${report.baselineValidation.confidence}`);
    for (const warning of report.baselineValidation.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
  }

  return lines.join("\n");
}

/**
 * Compare two drift reports
 */
export function compareDriftReports(
  current: DriftReport,
  previous: DriftReport
): {
  driftChange: number;
  velocityChange: number;
  trendChange: "improving" | "worsening" | "stable";
  summary: string;
} {
  const driftChange = current.drift.overallDrift - previous.drift.overallDrift;
  const velocityChange = current.drift.driftVelocity - previous.drift.driftVelocity;

  let trendChange: "improving" | "worsening" | "stable";

  if (current.drift.driftDirection === "positive" && previous.drift.driftDirection !== "positive") {
    trendChange = "improving";
  } else if (current.drift.driftDirection === "negative" && previous.drift.driftDirection !== "negative") {
    trendChange = "worsening";
  } else if (Math.abs(velocityChange) > 1) {
    trendChange = velocityChange > 0 ? "improving" : "worsening";
  } else {
    trendChange = "stable";
  }

  let summary: string;
  if (trendChange === "improving") {
    summary = "Visibility trend is improving - continue current strategy";
  } else if (trendChange === "worsening") {
    summary = "Visibility trend is worsening - investigate and adjust strategy";
  } else {
    summary = "Visibility trend is stable - maintain current approach";
  }

  return {
    driftChange,
    velocityChange,
    trendChange,
    summary
  };
}

/**
 * Alert configuration for drift monitoring
 */
export interface DriftAlert {
  enabled: boolean;
  thresholds: {
    criticalDrift: number;      // Absolute drift points
    criticalDriftPercent: number; // Drift percentage
    criticalVelocity: number;   // Points per day
    anomalySeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  };
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}

/**
 * Check if drift report triggers alerts
 */
export function checkDriftAlerts(
  report: DriftReport,
  alertConfig: DriftAlert
): {
  shouldAlert: boolean;
  triggeredAlerts: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;
} {
  if (!alertConfig.enabled) {
    return { shouldAlert: false, triggeredAlerts: [], severity: null };
  }

  const triggeredAlerts: string[] = [];
  let maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null = null;

  const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  // Check drift thresholds
  if (Math.abs(report.drift.overallDrift) >= alertConfig.thresholds.criticalDrift) {
    triggeredAlerts.push(`Drift exceeds threshold: ${Math.abs(report.drift.overallDrift).toFixed(1)} points`);
    maxSeverity = "HIGH";
  }

  if (Math.abs(report.drift.driftPercent) >= alertConfig.thresholds.criticalDriftPercent) {
    triggeredAlerts.push(`Drift percentage exceeds threshold: ${Math.abs(report.drift.driftPercent).toFixed(1)}%`);
    maxSeverity = maxSeverity && severityOrder[maxSeverity] > severityOrder.HIGH ? maxSeverity : "HIGH";
  }

  if (Math.abs(report.drift.driftVelocity) >= alertConfig.thresholds.criticalVelocity) {
    triggeredAlerts.push(`Drift velocity exceeds threshold: ${Math.abs(report.drift.driftVelocity).toFixed(2)} points/day`);
    maxSeverity = maxSeverity && severityOrder[maxSeverity] > severityOrder.MEDIUM ? maxSeverity : "MEDIUM";
  }

  // Check anomaly severity
  const criticalAnomalies = report.anomalies.filter(a =>
    severityOrder[a.severity] >= severityOrder[alertConfig.thresholds.anomalySeverity]
  );

  if (criticalAnomalies.length > 0) {
    triggeredAlerts.push(`${criticalAnomalies.length} ${alertConfig.thresholds.anomalySeverity}+ anomal${criticalAnomalies.length === 1 ? "y" : "ies"} detected`);
    maxSeverity = "CRITICAL";
  }

  const shouldAlert = triggeredAlerts.length > 0;

  return {
    shouldAlert,
    triggeredAlerts,
    severity: maxSeverity
  };
}
