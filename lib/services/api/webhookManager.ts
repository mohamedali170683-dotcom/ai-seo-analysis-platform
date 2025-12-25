/**
 * Webhook Manager
 *
 * Manages outbound webhooks for event notifications
 */

import type {
  Webhook,
  WebhookEvent,
  WebhookDelivery,
  WebhookPayload,
  WebhookRetryConfig
} from "@/lib/types/api";
import crypto from "crypto";

/**
 * Create webhook
 */
export function createWebhook(
  userId: string,
  name: string,
  url: string,
  events: WebhookEvent[],
  config?: Partial<Webhook>
): Webhook {
  const secret = generateWebhookSecret();

  return {
    id: generateWebhookId(),
    userId,
    name,
    url,
    events,
    secret,
    enabled: config?.enabled ?? true,
    retryConfig: config?.retryConfig || getDefaultRetryConfig(),
    headers: config?.headers || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageResponseTime: 0
    }
  };
}

/**
 * Get default retry configuration
 */
function getDefaultRetryConfig(): WebhookRetryConfig {
  return {
    maxRetries: 3,
    retryDelays: [60, 300, 900], // 1min, 5min, 15min
    backoffMultiplier: 2
  };
}

/**
 * Trigger webhook for event
 */
export async function triggerWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  data: any
): Promise<WebhookDelivery> {
  // Check if webhook listens to this event
  if (!webhook.events.includes(event)) {
    throw new Error(`Webhook ${webhook.id} does not listen to event ${event}`);
  }

  // Check if webhook is enabled
  if (!webhook.enabled) {
    throw new Error(`Webhook ${webhook.id} is disabled`);
  }

  // Create payload
  const payload: WebhookPayload = {
    id: generateDeliveryId(),
    event,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      webhookId: webhook.id,
      webhookName: webhook.name
    }
  };

  // Create delivery record
  const delivery: WebhookDelivery = {
    id: payload.id,
    webhookId: webhook.id,
    event,
    payload,
    status: "pending",
    attempt: 1,
    maxAttempts: webhook.retryConfig.maxRetries + 1
  };

  // Attempt delivery
  return await deliverWebhook(webhook, delivery);
}

/**
 * Deliver webhook with retries
 */
async function deliverWebhook(
  webhook: Webhook,
  delivery: WebhookDelivery
): Promise<WebhookDelivery> {
  const startTime = Date.now();

  try {
    // Create signature for verification
    const signature = createWebhookSignature(delivery.payload, webhook.secret);

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Event": delivery.event,
      "X-Webhook-Delivery-Id": delivery.id,
      "User-Agent": "AI-Visibility-Platform/1.0",
      ...webhook.headers
    };

    // Make HTTP request
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(delivery.payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      // Success
      delivery.status = "sent";
      delivery.sentAt = new Date().toISOString();
      delivery.responseCode = response.status;
      delivery.responseTime = responseTime;

      // Update webhook stats
      updateWebhookStats(webhook, delivery, true, responseTime);
    } else {
      // HTTP error
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Delivery failed
    const errorMessage = error instanceof Error ? error.message : String(error);

    delivery.status = "failed";
    delivery.error = errorMessage;
    delivery.responseTime = Date.now() - startTime;

    // Schedule retry if attempts remain
    if (delivery.attempt < delivery.maxAttempts) {
      delivery.status = "retrying";
      const retryDelay = calculateRetryDelay(delivery.attempt, webhook.retryConfig);
      const nextRetry = new Date();
      nextRetry.setSeconds(nextRetry.getSeconds() + retryDelay);
      delivery.nextRetryAt = nextRetry.toISOString();

      // In production, schedule the retry job
      // For now, we just mark it for retry
    } else {
      // Max retries exceeded
      updateWebhookStats(webhook, delivery, false, delivery.responseTime);
    }
  }

  return delivery;
}

/**
 * Retry webhook delivery
 */
export async function retryWebhookDelivery(
  webhook: Webhook,
  delivery: WebhookDelivery
): Promise<WebhookDelivery> {
  delivery.attempt++;
  return await deliverWebhook(webhook, delivery);
}

/**
 * Calculate retry delay
 */
function calculateRetryDelay(attempt: number, config: WebhookRetryConfig): number {
  // Use predefined delays if available
  if (attempt - 1 < config.retryDelays.length) {
    return config.retryDelays[attempt - 1];
  }

  // Otherwise use exponential backoff
  const baseDelay = config.retryDelays[config.retryDelays.length - 1] || 60;
  return baseDelay * Math.pow(config.backoffMultiplier, attempt - config.retryDelays.length);
}

/**
 * Create webhook signature for verification
 */
function createWebhookSignature(payload: WebhookPayload, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Update webhook statistics
 */
function updateWebhookStats(
  webhook: Webhook,
  delivery: WebhookDelivery,
  success: boolean,
  responseTime?: number
): void {
  webhook.stats.totalDeliveries++;

  if (success) {
    webhook.stats.successfulDeliveries++;
  } else {
    webhook.stats.failedDeliveries++;
  }

  if (responseTime) {
    // Update rolling average
    const total = webhook.stats.averageResponseTime * (webhook.stats.totalDeliveries - 1);
    webhook.stats.averageResponseTime = (total + responseTime) / webhook.stats.totalDeliveries;
  }

  webhook.lastTriggeredAt = new Date().toISOString();
  webhook.updatedAt = new Date().toISOString();
}

/**
 * Test webhook delivery
 */
export async function testWebhook(webhook: Webhook): Promise<WebhookDelivery> {
  const testPayload = {
    message: "This is a test webhook delivery",
    timestamp: new Date().toISOString(),
    webhook: {
      id: webhook.id,
      name: webhook.name
    }
  };

  return await triggerWebhook(webhook, "scan.completed", testPayload);
}

/**
 * Get webhook delivery history
 */
export function getWebhookHistory(
  deliveries: WebhookDelivery[],
  webhookId: string,
  limit: number = 50
): WebhookDelivery[] {
  return deliveries
    .filter(d => d.webhookId === webhookId)
    .sort((a, b) => {
      const timeA = a.sentAt || a.nextRetryAt || "0";
      const timeB = b.sentAt || b.nextRetryAt || "0";
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    })
    .slice(0, limit);
}

/**
 * Get pending retries
 */
export function getPendingRetries(deliveries: WebhookDelivery[]): WebhookDelivery[] {
  const now = new Date();

  return deliveries.filter(d => {
    if (d.status !== "retrying") return false;
    if (!d.nextRetryAt) return false;
    return new Date(d.nextRetryAt) <= now;
  });
}

/**
 * Batch trigger webhooks for event
 */
export async function batchTriggerWebhooks(
  webhooks: Webhook[],
  event: WebhookEvent,
  data: any
): Promise<WebhookDelivery[]> {
  // Filter webhooks that listen to this event and are enabled
  const relevantWebhooks = webhooks.filter(
    w => w.enabled && w.events.includes(event)
  );

  // Trigger all webhooks in parallel
  const deliveryPromises = relevantWebhooks.map(webhook =>
    triggerWebhook(webhook, event, data).catch(error => {
      // Log error but don't fail the batch
      console.error(`Failed to trigger webhook ${webhook.id}:`, error);
      return null;
    })
  );

  const results = await Promise.all(deliveryPromises);
  return results.filter((d): d is WebhookDelivery => d !== null);
}

/**
 * Disable webhook
 */
export function disableWebhook(webhook: Webhook, reason?: string): Webhook {
  webhook.enabled = false;
  webhook.updatedAt = new Date().toISOString();
  return webhook;
}

/**
 * Enable webhook
 */
export function enableWebhook(webhook: Webhook): Webhook {
  webhook.enabled = true;
  webhook.updatedAt = new Date().toISOString();
  return webhook;
}

/**
 * Update webhook configuration
 */
export function updateWebhook(
  webhook: Webhook,
  updates: Partial<Pick<Webhook, "name" | "url" | "events" | "retryConfig" | "headers">>
): Webhook {
  if (updates.name) webhook.name = updates.name;
  if (updates.url) webhook.url = updates.url;
  if (updates.events) webhook.events = updates.events;
  if (updates.retryConfig) webhook.retryConfig = updates.retryConfig;
  if (updates.headers) webhook.headers = updates.headers;

  webhook.updatedAt = new Date().toISOString();
  return webhook;
}

/**
 * Rotate webhook secret
 */
export function rotateWebhookSecret(webhook: Webhook): Webhook {
  webhook.secret = generateWebhookSecret();
  webhook.updatedAt = new Date().toISOString();
  return webhook;
}

/**
 * Get webhook health status
 */
export function getWebhookHealth(webhook: Webhook): {
  healthy: boolean;
  successRate: number;
  averageResponseTime: number;
  recentFailures: number;
  recommendation?: string;
} {
  const successRate = webhook.stats.totalDeliveries > 0
    ? (webhook.stats.successfulDeliveries / webhook.stats.totalDeliveries) * 100
    : 100;

  const healthy = successRate >= 95 && webhook.stats.averageResponseTime < 5000;

  let recommendation: string | undefined;
  if (successRate < 50) {
    recommendation = "High failure rate - check endpoint availability and configuration";
  } else if (successRate < 95) {
    recommendation = "Moderate failure rate - investigate recent errors";
  } else if (webhook.stats.averageResponseTime > 5000) {
    recommendation = "High response time - endpoint may be slow";
  }

  return {
    healthy,
    successRate,
    averageResponseTime: webhook.stats.averageResponseTime,
    recentFailures: webhook.stats.failedDeliveries,
    recommendation
  };
}

/**
 * Generate webhook ID
 */
function generateWebhookId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate delivery ID
 */
function generateDeliveryId(): string {
  return `whd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Parse webhook event from request
 */
export function parseWebhookPayload(body: string, signature: string, secret: string): WebhookPayload | null {
  // Verify signature first
  if (!verifyWebhookSignature(body, signature, secret)) {
    return null;
  }

  try {
    return JSON.parse(body) as WebhookPayload;
  } catch {
    return null;
  }
}
