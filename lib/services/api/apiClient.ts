/**
 * API Client SDK
 *
 * JavaScript/TypeScript SDK for interacting with the AI Visibility Platform API
 */

import type {
  ApiResponse,
  ApiError,
  SdkConfig,
  ListScansParams,
  ListResultsParams,
  ListAlertsParams,
  Webhook,
  ExportJob,
  ExportConfig,
  ExportFormat,
  WebhookDelivery
} from "@/lib/types/api";

/**
 * AI Visibility Platform API Client
 */
export class AiVisibilityClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retryConfig: { maxRetries: number; retryDelay: number };

  constructor(config: SdkConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.aivisibility.com/v1";
    this.timeout = config.timeout || 30000;
    this.retryConfig = config.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000
    };
  }

  // ==================== Scans ====================

  /**
   * List all scans
   */
  async listScans(params?: ListScansParams): Promise<ApiResponse<any[]>> {
    return await this.request("GET", "/scans", params);
  }

  /**
   * Get a specific scan
   */
  async getScan(scanId: string): Promise<ApiResponse<any>> {
    return await this.request("GET", `/scans/${scanId}`);
  }

  /**
   * Create a new scan
   */
  async createScan(config: any): Promise<ApiResponse<any>> {
    return await this.request("POST", "/scans", undefined, config);
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<ApiResponse<void>> {
    return await this.request("DELETE", `/scans/${scanId}`);
  }

  // ==================== Results ====================

  /**
   * Get scan results
   */
  async getResults(scanId: string): Promise<ApiResponse<any>> {
    return await this.request("GET", `/scans/${scanId}/results`);
  }

  /**
   * List all results
   */
  async listResults(params?: ListResultsParams): Promise<ApiResponse<any[]>> {
    return await this.request("GET", "/results", params);
  }

  // ==================== Alerts ====================

  /**
   * List alerts
   */
  async listAlerts(params?: ListAlertsParams): Promise<ApiResponse<any[]>> {
    return await this.request("GET", "/alerts", params);
  }

  /**
   * Get a specific alert
   */
  async getAlert(alertId: string): Promise<ApiResponse<any>> {
    return await this.request("GET", `/alerts/${alertId}`);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<ApiResponse<any>> {
    return await this.request("POST", `/alerts/${alertId}/acknowledge`);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<ApiResponse<any>> {
    return await this.request("POST", `/alerts/${alertId}/resolve`);
  }

  // ==================== Webhooks ====================

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<ApiResponse<Webhook[]>> {
    return await this.request("GET", "/webhooks");
  }

  /**
   * Create a webhook
   */
  async createWebhook(
    config: Omit<Webhook, "id" | "createdAt" | "updatedAt" | "stats">
  ): Promise<ApiResponse<Webhook>> {
    return await this.request("POST", "/webhooks", undefined, config);
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Webhook>
  ): Promise<ApiResponse<Webhook>> {
    return await this.request("PATCH", `/webhooks/${webhookId}`, undefined, updates);
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return await this.request("DELETE", `/webhooks/${webhookId}`);
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string): Promise<ApiResponse<WebhookDelivery>> {
    return await this.request("POST", `/webhooks/${webhookId}/test`);
  }

  // ==================== Exports ====================

  /**
   * Create an export job
   */
  async createExport(
    config: ExportConfig,
    format: ExportFormat
  ): Promise<ApiResponse<ExportJob>> {
    return await this.request("POST", "/exports", undefined, { config, format });
  }

  /**
   * Get export job status
   */
  async getExport(exportId: string): Promise<ApiResponse<ExportJob>> {
    return await this.request("GET", `/exports/${exportId}`);
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/exports/${exportId}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Export download failed: ${response.statusText}`);
    }

    return await response.blob();
  }

  // ==================== Analytics ====================

  /**
   * Get API usage analytics
   */
  async getAnalytics(period: "hour" | "day" | "week" | "month" = "day"): Promise<ApiResponse<any>> {
    return await this.request("GET", "/analytics", { period });
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<ApiResponse<any>> {
    return await this.request("GET", "/rate-limit");
  }

  // ==================== Core Request Method ====================

  /**
   * Make an API request
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    params?: Record<string, any>,
    body?: any,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "AI-Visibility-SDK/1.0"
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting with retry
        if (response.status === 429 && attempt <= this.retryConfig.maxRetries) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
          await this.sleep(retryAfter * 1000);
          return await this.request(method, endpoint, params, body, attempt + 1);
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt <= this.retryConfig.maxRetries) {
          await this.sleep(this.retryConfig.retryDelay * attempt);
          return await this.request(method, endpoint, params, body, attempt + 1);
        }

        // Return error response
        return {
          success: false,
          error: data.error || {
            code: `HTTP_${response.status}`,
            message: response.statusText,
            statusCode: response.status
          },
          rateLimit: this.extractRateLimitInfo(response)
        };
      }

      // Success response
      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
        rateLimit: this.extractRateLimitInfo(response)
      };

    } catch (error) {
      // Network error or timeout
      if (attempt <= this.retryConfig.maxRetries) {
        await this.sleep(this.retryConfig.retryDelay * attempt);
        return await this.request(method, endpoint, params, body, attempt + 1);
      }

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : String(error),
          statusCode: 0
        },
        rateLimit: {
          limit: 0,
          remaining: 0,
          reset: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Extract rate limit info from response headers
   */
  private extractRateLimitInfo(response: Response) {
    return {
      limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0", 10),
      remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "0", 10),
      reset: response.headers.get("X-RateLimit-Reset") || new Date().toISOString()
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convenience function to create a client instance
 */
export function createClient(apiKey: string, config?: Partial<SdkConfig>): AiVisibilityClient {
  return new AiVisibilityClient({
    apiKey,
    ...config
  });
}

/**
 * Batch request helper
 */
export class BatchRequest {
  private client: AiVisibilityClient;
  private requests: Array<{ method: string; endpoint: string; params?: any; body?: any }> = [];

  constructor(client: AiVisibilityClient) {
    this.client = client;
  }

  /**
   * Add a request to the batch
   */
  add(method: string, endpoint: string, params?: any, body?: any): BatchRequest {
    this.requests.push({ method, endpoint, params, body });
    return this;
  }

  /**
   * Execute all requests in parallel
   */
  async execute(): Promise<ApiResponse<any>[]> {
    const promises = this.requests.map(req =>
      (this.client as any).request(req.method, req.endpoint, req.params, req.body)
    );

    return await Promise.all(promises);
  }

  /**
   * Execute all requests sequentially
   */
  async executeSequential(): Promise<ApiResponse<any>[]> {
    const results: ApiResponse<any>[] = [];

    for (const req of this.requests) {
      const result = await (this.client as any).request(
        req.method,
        req.endpoint,
        req.params,
        req.body
      );
      results.push(result);
    }

    return results;
  }
}

/**
 * Error handling utilities
 */
export class ApiErrorHandler {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    return (
      error.statusCode >= 500 ||
      error.statusCode === 429 ||
      error.code === "NETWORK_ERROR" ||
      error.code === "TIMEOUT"
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError): string {
    const messages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Authentication failed. Please check your API key.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      429: "Rate limit exceeded. Please try again later.",
      500: "Server error. Please try again later.",
      503: "Service temporarily unavailable. Please try again later."
    };

    return messages[error.statusCode] || error.message || "An unexpected error occurred.";
  }

  /**
   * Log error for debugging
   */
  static logError(error: ApiError, context?: string): void {
    console.error(`API Error${context ? ` (${context})` : ""}:`, {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    });
  }
}

/**
 * Webhook verification helper
 */
export class WebhookVerifier {
  /**
   * Verify webhook signature
   */
  static verify(payload: string, signature: string, secret: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
