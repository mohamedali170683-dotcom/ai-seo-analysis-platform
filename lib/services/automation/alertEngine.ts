/**
 * Alert Engine
 *
 * Evaluates alert conditions and triggers notifications
 */

import type {
  AlertConfig,
  AlertCondition,
  AlertEvent,
  AlertEventData,
  ScanResults,
  AlertMetric
} from "@/lib/types/automation";

/**
 * Evaluate alert conditions against scan results
 */
export function evaluateAlerts(
  alerts: AlertConfig[],
  currentResults: ScanResults,
  previousResults?: ScanResults
): AlertEvent[] {
  const triggeredAlerts: AlertEvent[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;

    const shouldTrigger = evaluateAlertConditions(
      alert.conditions,
      currentResults,
      previousResults
    );

    if (shouldTrigger) {
      const event = createAlertEvent(alert, currentResults, previousResults);
      triggeredAlerts.push(event);
    }
  }

  return triggeredAlerts;
}

/**
 * Evaluate all conditions for an alert (AND logic)
 */
function evaluateAlertConditions(
  conditions: AlertCondition[],
  current: ScanResults,
  previous?: ScanResults
): boolean {
  if (conditions.length === 0) return false;

  // All conditions must be true
  return conditions.every(condition =>
    evaluateCondition(condition, current, previous)
  );
}

/**
 * Evaluate a single alert condition
 */
function evaluateCondition(
  condition: AlertCondition,
  current: ScanResults,
  previous?: ScanResults
): boolean {
  const currentValue = extractMetricValue(condition.metric, current);

  if (currentValue === null) return false;

  // For "change" operator, need previous value
  if (condition.operator === "change") {
    if (!previous) return false;

    const previousValue = extractMetricValue(condition.metric, previous);
    if (previousValue === null) return false;

    const change = Math.abs(currentValue - previousValue);
    return change >= condition.threshold;
  }

  // Standard comparison operators
  switch (condition.operator) {
    case ">":
      return currentValue > condition.threshold;
    case "<":
      return currentValue < condition.threshold;
    case ">=":
      return currentValue >= condition.threshold;
    case "<=":
      return currentValue <= condition.threshold;
    case "==":
      return currentValue === condition.threshold;
    case "!=":
      return currentValue !== condition.threshold;
    default:
      return false;
  }
}

/**
 * Extract metric value from scan results
 */
function extractMetricValue(metric: AlertMetric, results: ScanResults): number | null {
  switch (metric) {
    case "overall_visibility":
      return results.overallScore;

    case "awareness_score":
      return results.byStage.awareness;

    case "consideration_score":
      return results.byStage.consideration;

    case "decision_score":
      return results.byStage.decision;

    case "citation_rate":
      return results.citations;

    case "mention_rate":
      return results.mentions;

    case "stickiness_score":
      // Would need to be included in results
      return null;

    case "competitor_mentions":
      return results.competitors.reduce((sum, c) => sum + c.mentions, 0);

    case "hallucination_count":
      // Would need to be included in results
      return null;

    case "drift_velocity":
      // Would need to be included in results
      return null;

    default:
      return null;
  }
}

/**
 * Create alert event from triggered alert
 */
function createAlertEvent(
  alert: AlertConfig,
  current: ScanResults,
  previous?: ScanResults
): AlertEvent {
  const condition = alert.conditions[0]; // Use first condition for event data
  const currentValue = extractMetricValue(condition.metric, current) || 0;
  const previousValue = previous ? extractMetricValue(condition.metric, previous) ?? undefined : undefined;

  const change = typeof previousValue === 'number' ? currentValue - previousValue : undefined;
  const changePercent = typeof previousValue === 'number' && previousValue !== 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : undefined;

  const severity = determineSeverity(alert.type, condition, currentValue, previousValue);
  const { title, message } = generateAlertMessage(alert, currentValue, previousValue, change);

  const data: AlertEventData = {
    metric: condition.metric,
    currentValue,
    previousValue,
    threshold: condition.threshold,
    change,
    changePercent,
    competitors: current.competitors.map(c => c.name)
  };

  return {
    id: generateAlertId(),
    alertConfigId: alert.id,
    triggeredAt: new Date().toISOString(),
    type: alert.type,
    severity,
    title,
    message,
    data,
    notificationsSent: [],
    acknowledged: false
  };
}

/**
 * Determine alert severity
 */
function determineSeverity(
  type: string,
  condition: AlertCondition,
  currentValue: number,
  previousValue?: number
): "critical" | "high" | "medium" | "low" {
  // Critical severity for large drops
  if (type === "visibility_drop" && previousValue) {
    const dropPercent = ((previousValue - currentValue) / previousValue) * 100;
    if (dropPercent >= 50) return "critical";
    if (dropPercent >= 30) return "high";
    if (dropPercent >= 15) return "medium";
    return "low";
  }

  // Critical for hallucinations
  if (type === "hallucination_detected") {
    return "critical";
  }

  // High for competitor takeovers
  if (type === "competitor_takeover") {
    return "high";
  }

  // Medium for citation changes
  if (type === "citation_lost" || type === "citation_gained") {
    return "medium";
  }

  // Default to medium
  return "medium";
}

/**
 * Generate alert title and message
 */
function generateAlertMessage(
  alert: AlertConfig,
  currentValue: number,
  previousValue?: number,
  change?: number
): { title: string; message: string } {
  let title = alert.name;
  let message = "";

  switch (alert.type) {
    case "visibility_drop":
      if (previousValue !== undefined && change !== undefined) {
        const changePercent = ((change / previousValue) * 100).toFixed(1);
        title = "⚠️ Visibility Score Dropped";
        message = `Your visibility score decreased from ${previousValue.toFixed(1)} to ${currentValue.toFixed(1)} (${changePercent}% drop). Immediate action recommended.`;
      }
      break;

    case "visibility_spike":
      if (previousValue !== undefined && change !== undefined) {
        const changePercent = ((change / previousValue) * 100).toFixed(1);
        title = "🚀 Visibility Score Increased";
        message = `Your visibility score increased from ${previousValue.toFixed(1)} to ${currentValue.toFixed(1)} (${changePercent}% gain). Great work!`;
      }
      break;

    case "competitor_takeover":
      title = "⚔️ Competitor Takeover Detected";
      message = `Competitors are being mentioned more frequently than your brand. Current competitor mentions: ${currentValue}. Review competitive analysis for details.`;
      break;

    case "hallucination_detected":
      title = "🚨 AI Hallucination Detected";
      message = `AI platforms are generating incorrect information about your brand. ${currentValue} hallucinations detected. Immediate review required.`;
      break;

    case "citation_lost":
      title = "📉 Citation Lost";
      message = `Your brand lost ${Math.abs(change || 0)} citation(s). Current citations: ${currentValue}. Review content strategy.`;
      break;

    case "citation_gained":
      title = "📈 New Citation Gained";
      message = `Your brand gained ${change || 0} new citation(s). Current citations: ${currentValue}. Keep up the great work!`;
      break;

    case "anomaly_detected":
      title = "🔔 Anomaly Detected";
      message = `Unusual pattern detected in your visibility metrics. Current value: ${currentValue}. Investigation recommended.`;
      break;

    case "content_gap_found":
      title = "💡 Content Gap Identified";
      message = `${currentValue} new content gap(s) identified where competitors are cited instead of your brand. Review gap analysis for opportunities.`;
      break;

    case "trigger_loss":
      title = "⚠️ Query Trigger Lost";
      message = `Your brand is no longer appearing for ${currentValue} query modifier(s). Review competitive trigger analysis.`;
      break;

    default:
      title = alert.name;
      message = `Alert triggered: ${alert.name}. Current value: ${currentValue}.`;
  }

  return { title, message };
}

/**
 * Check if alert should be throttled
 */
export function shouldThrottleAlert(
  alert: AlertConfig,
  recentEvents: AlertEvent[]
): boolean {
  if (!alert.throttle || !alert.throttle.enabled) {
    return false;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - alert.throttle.windowMinutes * 60 * 1000);

  // Count alerts of same type in the window
  const recentAlertsInWindow = recentEvents.filter(event => {
    const eventTime = new Date(event.triggeredAt);
    return event.alertConfigId === alert.id && eventTime >= windowStart;
  });

  return recentAlertsInWindow.length >= alert.throttle.maxAlertsPerWindow;
}

/**
 * Get alert summary for reporting
 */
export function getAlertSummary(
  events: AlertEvent[],
  period: { start: string; end: string }
): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  critical: AlertEvent[];
  unacknowledged: AlertEvent[];
} {
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);

  const eventsInPeriod = events.filter(event => {
    const eventDate = new Date(event.triggeredAt);
    return eventDate >= startDate && eventDate <= endDate;
  });

  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  const byType: Record<string, number> = {};

  for (const event of eventsInPeriod) {
    bySeverity[event.severity]++;
    byType[event.type] = (byType[event.type] || 0) + 1;
  }

  const critical = eventsInPeriod.filter(e => e.severity === "critical");
  const unacknowledged = eventsInPeriod.filter(e => !e.acknowledged);

  return {
    total: eventsInPeriod.length,
    bySeverity,
    byType,
    critical,
    unacknowledged
  };
}

/**
 * Generate alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format alert for display
 */
export function formatAlertForDisplay(event: AlertEvent): string {
  const timestamp = new Date(event.triggeredAt).toLocaleString();
  const severityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "🔔",
    low: "ℹ️"
  }[event.severity];

  return `${severityEmoji} **${event.title}**\n${event.message}\n\n_Triggered at: ${timestamp}_`;
}
