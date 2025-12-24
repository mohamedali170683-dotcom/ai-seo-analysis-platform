/**
 * Type definitions for automation and alerting features
 */

// ==================== Scheduled Scans ====================

export interface ScheduledScan {
  id: string;
  userId: string;
  brandId: string;
  name: string;
  description?: string;
  frequency: ScanFrequency;
  schedule: ScanSchedule;
  config: ScanConfig;
  alerts: AlertConfig[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export type ScanFrequency = "hourly" | "daily" | "weekly" | "monthly" | "custom";

export interface ScanSchedule {
  frequency: ScanFrequency;
  // For daily: hour (0-23)
  hour?: number;
  // For weekly: day (0-6, 0=Sunday)
  dayOfWeek?: number;
  // For monthly: day (1-31)
  dayOfMonth?: number;
  // For custom: cron expression
  cronExpression?: string;
  // Timezone for scheduling
  timezone: string;
}

export interface ScanConfig {
  brand: string;
  domain: string;
  subcategory: string;
  competitors: string[];
  llms: string[];
  personas?: string[];
  queries?: string[];
  includeConversationTracking?: boolean;
  includeTriggerTesting?: boolean;
  includeContentGapAnalysis?: boolean;
}

// ==================== Alerts ====================

export interface AlertConfig {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  conditions: AlertCondition[];
  channels: NotificationChannel[];
  throttle?: AlertThrottle;
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | "visibility_drop"
  | "visibility_spike"
  | "competitor_takeover"
  | "hallucination_detected"
  | "citation_lost"
  | "citation_gained"
  | "anomaly_detected"
  | "content_gap_found"
  | "trigger_loss";

export interface AlertCondition {
  metric: AlertMetric;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "change";
  threshold: number;
  timeframe?: number; // minutes
}

export type AlertMetric =
  | "overall_visibility"
  | "awareness_score"
  | "consideration_score"
  | "decision_score"
  | "citation_rate"
  | "mention_rate"
  | "stickiness_score"
  | "competitor_mentions"
  | "hallucination_count"
  | "drift_velocity";

export interface AlertThrottle {
  enabled: boolean;
  windowMinutes: number; // Don't send duplicate alerts within this window
  maxAlertsPerWindow: number;
}

// ==================== Notifications ====================

export interface NotificationChannel {
  id: string;
  type: ChannelType;
  config: ChannelConfig;
  enabled: boolean;
}

export type ChannelType = "email" | "slack" | "webhook" | "discord" | "teams";

export type ChannelConfig =
  | EmailChannelConfig
  | SlackChannelConfig
  | WebhookChannelConfig
  | DiscordChannelConfig
  | TeamsChannelConfig;

export interface EmailChannelConfig {
  type: "email";
  recipients: string[];
  subject?: string;
  includeDetailedReport: boolean;
}

export interface SlackChannelConfig {
  type: "slack";
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface WebhookChannelConfig {
  type: "webhook";
  url: string;
  method: "POST" | "PUT";
  headers?: Record<string, string>;
  includeFullPayload: boolean;
}

export interface DiscordChannelConfig {
  type: "discord";
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface TeamsChannelConfig {
  type: "teams";
  webhookUrl: string;
}

// ==================== Alert Events ====================

export interface AlertEvent {
  id: string;
  alertConfigId: string;
  scheduledScanId?: string;
  triggeredAt: string;
  type: AlertType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  data: AlertEventData;
  notificationsSent: NotificationDelivery[];
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertEventData {
  metric: string;
  currentValue: number;
  previousValue?: number;
  threshold: number;
  change?: number;
  changePercent?: number;
  affectedLLMs?: string[];
  competitors?: string[];
  details?: any;
}

export interface NotificationDelivery {
  channelId: string;
  channelType: ChannelType;
  sentAt: string;
  status: "sent" | "failed" | "throttled";
  error?: string;
}

// ==================== Reports ====================

export interface AutomatedReport {
  id: string;
  scheduledScanId: string;
  scanId: string;
  generatedAt: string;
  type: ReportType;
  format: ReportFormat;
  data: ReportData;
  recipients?: string[];
  downloadUrl?: string;
}

export type ReportType = "scan_summary" | "weekly_digest" | "monthly_overview" | "alert_summary";

export type ReportFormat = "html" | "pdf" | "json" | "csv";

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  sections: ReportSection[];
  alerts?: AlertEvent[];
  recommendations?: string[];
}

export interface ReportSummary {
  overallScore: number;
  change: number;
  changePercent: number;
  trend: "improving" | "declining" | "stable";
  highlights: string[];
  concerns: string[];
}

export interface ReportSection {
  title: string;
  type: string;
  data: any;
  charts?: ChartData[];
}

export interface ChartData {
  type: "line" | "bar" | "pie" | "table";
  title: string;
  data: any;
}

// ==================== Scan History ====================

export interface ScanExecution {
  id: string;
  scheduledScanId: string;
  startedAt: string;
  completedAt?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  results?: ScanResults;
  error?: string;
  duration?: number;
  alertsTriggered: number;
}

export interface ScanResults {
  scanId: string;
  overallScore: number;
  byStage: {
    awareness: number;
    consideration: number;
    decision: number;
  };
  byLLM: {
    chatgpt: number;
    gemini: number;
    copilot: number;
    perplexity: number;
  };
  citations: number;
  mentions: number;
  competitors: CompetitorResult[];
  anomalies?: any[];
}

export interface CompetitorResult {
  name: string;
  mentions: number;
  citations: number;
  averagePosition: number;
}

// ==================== Webhook Payloads ====================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: WebhookEventData;
}

export type WebhookEventData =
  | ScanCompletedEvent
  | AlertTriggeredEvent
  | VisibilityChangedEvent;

export interface ScanCompletedEvent {
  type: "scan_completed";
  scanId: string;
  scheduledScanId: string;
  brand: string;
  results: ScanResults;
}

export interface AlertTriggeredEvent {
  type: "alert_triggered";
  alert: AlertEvent;
  brand: string;
}

export interface VisibilityChangedEvent {
  type: "visibility_changed";
  brand: string;
  metric: string;
  oldValue: number;
  newValue: number;
  change: number;
  changePercent: number;
}
