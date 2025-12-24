/**
 * Type definitions for API and Integration Layer
 */

// ==================== API Authentication ====================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string; // Hashed
  prefix: string; // First 8 chars for display
  scopes: ApiScope[];
  rateLimit: RateLimit;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
}

export type ApiScope =
  | "scans:read"
  | "scans:write"
  | "scans:delete"
  | "results:read"
  | "alerts:read"
  | "alerts:write"
  | "webhooks:read"
  | "webhooks:write"
  | "exports:read";

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

// ==================== API Request/Response ====================

export interface ApiRequest<T = any> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  headers: Record<string, string>;
  params?: Record<string, string>;
  body?: T;
  apiKey?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
  rateLimit: RateLimitInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string; // ISO timestamp
}

// ==================== Webhook System ====================

export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string; // For signature verification
  enabled: boolean;
  retryConfig: WebhookRetryConfig;
  headers?: Record<string, string>; // Custom headers
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  stats: WebhookStats;
}

export type WebhookEvent =
  | "scan.completed"
  | "scan.failed"
  | "alert.triggered"
  | "visibility.changed"
  | "competitor.detected"
  | "hallucination.detected"
  | "report.generated";

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelays: number[]; // Delays in seconds [60, 300, 900] = 1min, 5min, 15min
  backoffMultiplier: number;
}

export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number; // milliseconds
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: "pending" | "sent" | "failed" | "retrying";
  attempt: number;
  maxAttempts: number;
  sentAt?: string;
  responseCode?: number;
  responseTime?: number; // milliseconds
  error?: string;
  nextRetryAt?: string;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

// ==================== Export System ====================

export interface ExportJob {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  config: ExportConfig;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string; // Download URL expiration
  fileSize?: number; // bytes
  error?: string;
}

export type ExportType =
  | "scan_results"
  | "visibility_trends"
  | "competitive_analysis"
  | "alert_history"
  | "hallucination_report"
  | "full_report";

export type ExportFormat = "csv" | "json" | "xlsx" | "pdf";

export interface ExportConfig {
  scanIds?: string[];
  dateRange?: DateRange;
  llms?: string[];
  stages?: string[];
  includeRawData?: boolean;
  includeCharts?: boolean; // For PDF
  fields?: string[]; // Custom field selection
}

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}

export interface ExportData {
  metadata: ExportMetadata;
  data: any[];
  summary?: Record<string, any>;
}

export interface ExportMetadata {
  exportId: string;
  type: ExportType;
  format: ExportFormat;
  generatedAt: string;
  recordCount: number;
  dateRange?: DateRange;
  filters?: Record<string, any>;
}

// ==================== Integration System ====================

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  config: IntegrationConfig;
  status: "connected" | "disconnected" | "error";
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  stats: IntegrationStats;
}

export type IntegrationType =
  | "zapier"
  | "make" // Formerly Integromat
  | "google_sheets"
  | "slack"
  | "teams"
  | "discord"
  | "datadog"
  | "hubspot"
  | "salesforce"
  | "custom_webhook";

export interface IntegrationConfig {
  // Type-specific config stored as JSON
  [key: string]: any;
}

export interface ZapierConfig extends IntegrationConfig {
  webhookUrl: string;
  triggerEvents: WebhookEvent[];
}

export interface GoogleSheetsConfig extends IntegrationConfig {
  spreadsheetId: string;
  sheetName: string;
  credentials: string; // OAuth token
  syncFrequency: "realtime" | "hourly" | "daily";
  mapping: FieldMapping[];
}

export interface FieldMapping {
  source: string; // Our field name
  destination: string; // External field name
  transform?: "uppercase" | "lowercase" | "date" | "number";
}

export interface IntegrationStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncDuration?: number; // milliseconds
}

export interface IntegrationSync {
  id: string;
  integrationId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  recordsSynced: number;
  error?: string;
}

// ==================== API Endpoints (SDK Interface) ====================

export interface ApiEndpoints {
  // Scans
  listScans: (params?: ListScansParams) => Promise<ApiResponse<any[]>>;
  getScan: (scanId: string) => Promise<ApiResponse<any>>;
  createScan: (config: any) => Promise<ApiResponse<any>>;
  deleteScan: (scanId: string) => Promise<ApiResponse<void>>;

  // Results
  getResults: (scanId: string) => Promise<ApiResponse<any>>;
  listResults: (params?: ListResultsParams) => Promise<ApiResponse<any[]>>;

  // Alerts
  listAlerts: (params?: ListAlertsParams) => Promise<ApiResponse<any[]>>;
  getAlert: (alertId: string) => Promise<ApiResponse<any>>;

  // Webhooks
  listWebhooks: () => Promise<ApiResponse<Webhook[]>>;
  createWebhook: (config: Omit<Webhook, "id" | "createdAt" | "updatedAt" | "stats">) => Promise<ApiResponse<Webhook>>;
  updateWebhook: (webhookId: string, updates: Partial<Webhook>) => Promise<ApiResponse<Webhook>>;
  deleteWebhook: (webhookId: string) => Promise<ApiResponse<void>>;
  testWebhook: (webhookId: string) => Promise<ApiResponse<WebhookDelivery>>;

  // Exports
  createExport: (config: ExportConfig, format: ExportFormat) => Promise<ApiResponse<ExportJob>>;
  getExport: (exportId: string) => Promise<ApiResponse<ExportJob>>;
  downloadExport: (exportId: string) => Promise<Blob>;
}

export interface ListScansParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}

export interface ListResultsParams {
  scanId?: string;
  dateFrom?: string;
  dateTo?: string;
  llm?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAlertsParams {
  scanId?: string;
  severity?: string;
  status?: "open" | "acknowledged" | "resolved";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ==================== SDK Configuration ====================

export interface SdkConfig {
  apiKey: string;
  baseUrl?: string; // Defaults to production
  timeout?: number; // Request timeout in ms
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

// ==================== Rate Limiting ====================

export interface RateLimitBucket {
  userId: string;
  apiKeyId: string;
  minute: RateLimitCounter;
  hour: RateLimitCounter;
  day: RateLimitCounter;
}

export interface RateLimitCounter {
  count: number;
  resetAt: string; // ISO timestamp
}

export interface RateLimitExceeded {
  exceeded: boolean;
  limit: number;
  current: number;
  resetAt: string;
  retryAfter: number; // seconds
}

// ==================== API Analytics ====================

export interface ApiAnalytics {
  userId: string;
  period: "hour" | "day" | "week" | "month";
  metrics: ApiMetrics;
  topEndpoints: EndpointUsage[];
  errors: ErrorBreakdown[];
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
}

export interface EndpointUsage {
  endpoint: string;
  method: string;
  requests: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface ErrorBreakdown {
  code: string;
  message: string;
  count: number;
  lastOccurred: string;
}
