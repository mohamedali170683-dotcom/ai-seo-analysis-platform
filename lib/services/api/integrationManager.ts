/**
 * Integration Manager
 *
 * Manages third-party integrations (Zapier, Make, Google Sheets, etc.)
 */

import type {
  Integration,
  IntegrationType,
  IntegrationConfig,
  IntegrationSync,
  ZapierConfig,
  GoogleSheetsConfig,
  FieldMapping
} from "@/lib/types/api";
import type { WebhookEvent } from "@/lib/types/api";

/**
 * Create integration
 */
export function createIntegration(
  userId: string,
  type: IntegrationType,
  name: string,
  config: IntegrationConfig
): Integration {
  return {
    id: generateIntegrationId(),
    userId,
    type,
    name,
    enabled: true,
    config,
    status: "disconnected",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0
    }
  };
}

/**
 * Connect integration (test and activate)
 */
export async function connectIntegration(
  integration: Integration
): Promise<Integration> {
  try {
    // Test connection based on type
    const connected = await testConnection(integration);

    if (connected) {
      integration.status = "connected";
      integration.updatedAt = new Date().toISOString();
    } else {
      integration.status = "error";
    }
  } catch (error) {
    integration.status = "error";
    console.error(`Failed to connect integration ${integration.id}:`, error);
  }

  return integration;
}

/**
 * Test connection for integration
 */
async function testConnection(integration: Integration): Promise<boolean> {
  switch (integration.type) {
    case "zapier":
      return await testZapierConnection(integration.config as ZapierConfig);

    case "make":
      return await testMakeConnection(integration.config);

    case "google_sheets":
      return await testGoogleSheetsConnection(integration.config as GoogleSheetsConfig);

    case "slack":
      return await testSlackConnection(integration.config);

    case "teams":
      return await testTeamsConnection(integration.config);

    case "discord":
      return await testDiscordConnection(integration.config);

    case "custom_webhook":
      return await testWebhookConnection(integration.config);

    default:
      return false;
  }
}

/**
 * Test Zapier connection
 */
async function testZapierConnection(config: ZapierConfig): Promise<boolean> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test: true,
        message: "Connection test from AI Visibility Platform",
        timestamp: new Date().toISOString()
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Test Make (Integromat) connection
 */
async function testMakeConnection(config: any): Promise<boolean> {
  // Similar to Zapier
  return await testZapierConnection(config as ZapierConfig);
}

/**
 * Test Google Sheets connection
 */
async function testGoogleSheetsConnection(config: GoogleSheetsConfig): Promise<boolean> {
  try {
    // In production, use Google Sheets API
    // This is a placeholder
    if (!config.spreadsheetId || !config.credentials) {
      return false;
    }

    // Test by reading spreadsheet metadata
    // const sheets = google.sheets({ version: 'v4', auth: config.credentials });
    // await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });

    return true;
  } catch {
    return false;
  }
}

/**
 * Test Slack connection
 */
async function testSlackConnection(config: any): Promise<boolean> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Connection test from AI Visibility Platform"
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Test Teams connection
 */
async function testTeamsConnection(config: any): Promise<boolean> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "text": "Connection test from AI Visibility Platform"
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Test Discord connection
 */
async function testDiscordConnection(config: any): Promise<boolean> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Connection test from AI Visibility Platform"
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Test webhook connection
 */
async function testWebhookConnection(config: any): Promise<boolean> {
  return await testZapierConnection(config);
}

/**
 * Sync data to integration
 */
export async function syncToIntegration(
  integration: Integration,
  data: any[]
): Promise<IntegrationSync> {
  const sync: IntegrationSync = {
    id: generateSyncId(),
    integrationId: integration.id,
    startedAt: new Date().toISOString(),
    status: "running",
    recordsSynced: 0
  };

  try {
    let recordsSynced = 0;

    switch (integration.type) {
      case "zapier":
      case "make":
        recordsSynced = await syncToZapier(integration, data);
        break;

      case "google_sheets":
        recordsSynced = await syncToGoogleSheets(integration, data);
        break;

      case "slack":
      case "teams":
      case "discord":
        recordsSynced = await syncToMessaging(integration, data);
        break;

      case "custom_webhook":
        recordsSynced = await syncToWebhook(integration, data);
        break;

      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    sync.status = "completed";
    sync.completedAt = new Date().toISOString();
    sync.recordsSynced = recordsSynced;

    // Update integration stats
    integration.stats.totalSyncs++;
    integration.stats.successfulSyncs++;
    integration.lastSyncAt = sync.completedAt;

    const duration = new Date(sync.completedAt).getTime() - new Date(sync.startedAt).getTime();
    integration.stats.lastSyncDuration = duration;

  } catch (error) {
    sync.status = "failed";
    sync.completedAt = new Date().toISOString();
    sync.error = error instanceof Error ? error.message : String(error);

    // Update integration stats
    integration.stats.totalSyncs++;
    integration.stats.failedSyncs++;
  }

  integration.updatedAt = new Date().toISOString();
  return sync;
}

/**
 * Sync data to Zapier
 */
async function syncToZapier(integration: Integration, data: any[]): Promise<number> {
  const config = integration.config as ZapierConfig;
  let synced = 0;

  // Send data in batches to avoid overwhelming the webhook
  const batchSize = 10;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const record of batch) {
      try {
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        });

        if (response.ok) {
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync record to Zapier:`, error);
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return synced;
}

/**
 * Sync data to Google Sheets
 */
async function syncToGoogleSheets(integration: Integration, data: any[]): Promise<number> {
  const config = integration.config as GoogleSheetsConfig;

  try {
    // Map data to sheet columns
    const mappedData = data.map(record => mapFieldsForExport(record, config.mapping));

    // In production, use Google Sheets API to append rows
    // const sheets = google.sheets({ version: 'v4', auth: config.credentials });
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: config.spreadsheetId,
    //   range: `${config.sheetName}!A1`,
    //   valueInputOption: 'RAW',
    //   resource: { values: mappedData }
    // });

    return mappedData.length;
  } catch (error) {
    console.error(`Failed to sync to Google Sheets:`, error);
    return 0;
  }
}

/**
 * Sync data to messaging platforms (Slack, Teams, Discord)
 */
async function syncToMessaging(integration: Integration, data: any[]): Promise<number> {
  const config = integration.config;

  // Format data as message
  const message = formatDataAsMessage(data, integration.type);

  try {
    let payload: any;
    switch (integration.type) {
      case "slack":
        payload = { text: message };
        break;
      case "teams":
        payload = { "@type": "MessageCard", text: message };
        break;
      case "discord":
        payload = { content: message };
        break;
    }

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return response.ok ? 1 : 0;
  } catch {
    return 0;
  }
}

/**
 * Sync data to custom webhook
 */
async function syncToWebhook(integration: Integration, data: any[]): Promise<number> {
  return await syncToZapier(integration, data);
}

/**
 * Map fields for export
 */
function mapFieldsForExport(record: any, mappings: FieldMapping[]): any {
  const mapped: any = {};

  for (const mapping of mappings) {
    let value = record[mapping.source];

    // Apply transformation
    if (mapping.transform && value) {
      switch (mapping.transform) {
        case "uppercase":
          value = String(value).toUpperCase();
          break;
        case "lowercase":
          value = String(value).toLowerCase();
          break;
        case "date":
          value = new Date(value).toLocaleDateString();
          break;
        case "number":
          value = Number(value);
          break;
      }
    }

    mapped[mapping.destination] = value;
  }

  return mapped;
}

/**
 * Format data as message for messaging platforms
 */
function formatDataAsMessage(data: any[], platform: IntegrationType): string {
  const summary = `📊 AI Visibility Update - ${data.length} record(s)\n\n`;

  const records = data.slice(0, 5).map((record, i) => {
    const lines = Object.entries(record)
      .slice(0, 5)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");
    return `Record ${i + 1}:\n${lines}`;
  }).join("\n\n");

  const footer = data.length > 5 ? `\n\n... and ${data.length - 5} more` : "";

  return summary + records + footer;
}

/**
 * Setup Zapier triggers
 */
export function getZapierTriggers(): {
  key: string;
  name: string;
  description: string;
  sampleData: any;
}[] {
  return [
    {
      key: "scan_completed",
      name: "Scan Completed",
      description: "Triggers when a visibility scan completes",
      sampleData: {
        scanId: "scan_123",
        timestamp: "2025-01-15T10:00:00Z",
        overallScore: 75.5,
        byLLM: {
          chatgpt: 80,
          gemini: 75,
          copilot: 70,
          perplexity: 77
        }
      }
    },
    {
      key: "alert_triggered",
      name: "Alert Triggered",
      description: "Triggers when an alert condition is met",
      sampleData: {
        alertId: "alert_123",
        severity: "high",
        title: "Visibility Drop Detected",
        message: "Overall visibility decreased by 15%",
        triggeredAt: "2025-01-15T10:00:00Z"
      }
    },
    {
      key: "hallucination_detected",
      name: "Hallucination Detected",
      description: "Triggers when AI hallucination is detected",
      sampleData: {
        detectionId: "det_123",
        llm: "ChatGPT",
        type: "pricing_error",
        severity: "critical",
        claim: "Incorrect pricing mentioned",
        detectedAt: "2025-01-15T10:00:00Z"
      }
    }
  ];
}

/**
 * Setup Zapier actions
 */
export function getZapierActions(): {
  key: string;
  name: string;
  description: string;
  inputFields: any[];
}[] {
  return [
    {
      key: "create_scan",
      name: "Create Scan",
      description: "Create a new visibility scan",
      inputFields: [
        { key: "brandId", label: "Brand ID", required: true },
        { key: "queries", label: "Queries", type: "text", list: true },
        { key: "llms", label: "LLMs", type: "text", list: true }
      ]
    },
    {
      key: "export_results",
      name: "Export Results",
      description: "Export scan results",
      inputFields: [
        { key: "scanId", label: "Scan ID", required: true },
        { key: "format", label: "Format", choices: ["csv", "json", "xlsx"] }
      ]
    }
  ];
}

/**
 * Disconnect integration
 */
export function disconnectIntegration(integration: Integration): Integration {
  integration.status = "disconnected";
  integration.enabled = false;
  integration.updatedAt = new Date().toISOString();
  return integration;
}

/**
 * Get integration health
 */
export function getIntegrationHealth(integration: Integration): {
  healthy: boolean;
  successRate: number;
  lastSync?: string;
  recommendation?: string;
} {
  const successRate = integration.stats.totalSyncs > 0
    ? (integration.stats.successfulSyncs / integration.stats.totalSyncs) * 100
    : 100;

  const healthy = integration.status === "connected" && successRate >= 90;

  let recommendation: string | undefined;
  if (integration.status === "error") {
    recommendation = "Connection error - check credentials and permissions";
  } else if (integration.status === "disconnected") {
    recommendation = "Integration disconnected - reconnect to resume syncing";
  } else if (successRate < 50) {
    recommendation = "High failure rate - investigate sync errors";
  } else if (successRate < 90) {
    recommendation = "Moderate failure rate - review recent sync logs";
  }

  return {
    healthy,
    successRate,
    lastSync: integration.lastSyncAt,
    recommendation
  };
}

/**
 * Generate integration ID
 */
function generateIntegrationId(): string {
  return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate sync ID
 */
function generateSyncId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get popular integration templates
 */
export function getIntegrationTemplates(): {
  type: IntegrationType;
  name: string;
  description: string;
  setupSteps: string[];
  configTemplate: IntegrationConfig;
}[] {
  return [
    {
      type: "zapier",
      name: "Zapier Integration",
      description: "Connect to 5000+ apps via Zapier",
      setupSteps: [
        "Create a Zap in Zapier",
        "Select 'Webhooks by Zapier' as trigger",
        "Copy the webhook URL",
        "Paste URL here and select events"
      ],
      configTemplate: {
        webhookUrl: "",
        triggerEvents: ["scan.completed"]
      }
    },
    {
      type: "google_sheets",
      name: "Google Sheets Sync",
      description: "Auto-sync results to Google Sheets",
      setupSteps: [
        "Connect Google account",
        "Select spreadsheet",
        "Choose sheet and columns",
        "Configure sync frequency"
      ],
      configTemplate: {
        spreadsheetId: "",
        sheetName: "AI Visibility Data",
        syncFrequency: "daily",
        mapping: []
      }
    },
    {
      type: "slack",
      name: "Slack Notifications",
      description: "Send alerts to Slack channels",
      setupSteps: [
        "Create incoming webhook in Slack",
        "Copy webhook URL",
        "Paste URL here",
        "Select notification triggers"
      ],
      configTemplate: {
        webhookUrl: "",
        channel: "#ai-visibility"
      }
    }
  ];
}
