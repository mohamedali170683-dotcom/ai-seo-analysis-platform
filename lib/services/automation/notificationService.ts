/**
 * Notification Service
 *
 * Sends notifications through multiple channels (Email, Slack, Webhook, Discord, Teams)
 */

import type {
  AlertEvent,
  NotificationChannel,
  NotificationDelivery,
  EmailChannelConfig,
  SlackChannelConfig,
  WebhookChannelConfig,
  DiscordChannelConfig,
  TeamsChannelConfig
} from "@/lib/types/automation";

/**
 * Send notifications for an alert event
 */
export async function sendNotifications(
  event: AlertEvent,
  channels: NotificationChannel[]
): Promise<NotificationDelivery[]> {
  const deliveries: NotificationDelivery[] = [];

  for (const channel of channels) {
    if (!channel.enabled) continue;

    try {
      await sendNotification(event, channel);

      deliveries.push({
        channelId: channel.id,
        channelType: channel.type,
        sentAt: new Date().toISOString(),
        status: "sent"
      });
    } catch (error) {
      deliveries.push({
        channelId: channel.id,
        channelType: channel.type,
        sentAt: new Date().toISOString(),
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return deliveries;
}

/**
 * Send notification to a single channel
 */
async function sendNotification(
  event: AlertEvent,
  channel: NotificationChannel
): Promise<void> {
  switch (channel.type) {
    case "email":
      await sendEmailNotification(event, channel.config as EmailChannelConfig);
      break;

    case "slack":
      await sendSlackNotification(event, channel.config as SlackChannelConfig);
      break;

    case "webhook":
      await sendWebhookNotification(event, channel.config as WebhookChannelConfig);
      break;

    case "discord":
      await sendDiscordNotification(event, channel.config as DiscordChannelConfig);
      break;

    case "teams":
      await sendTeamsNotification(event, channel.config as TeamsChannelConfig);
      break;

    default:
      throw new Error(`Unsupported channel type: ${channel.type}`);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  event: AlertEvent,
  config: EmailChannelConfig
): Promise<void> {
  const subject = config.subject || event.title;
  const body = formatEmailBody(event, config.includeDetailedReport);

  // In production, use SendGrid, AWS SES, or similar
  // For now, this is a placeholder
  console.log("Sending email:", {
    to: config.recipients,
    subject,
    body
  });

  // Example using fetch to a hypothetical email API
  /*
  await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: config.recipients,
      subject,
      html: body
    })
  });
  */
}

/**
 * Format email body
 */
function formatEmailBody(event: AlertEvent, includeDetails: boolean): string {
  const severityColor = {
    critical: "#dc2626",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#6b7280"
  }[event.severity];

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${event.title}</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Severity: ${event.severity.toUpperCase()}</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          ${event.message}
        </p>
      </div>
  `;

  if (includeDetails && event.data) {
    html += `
      <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="font-size: 18px; margin-top: 0;">Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Metric:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${event.data.metric}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Current Value:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${event.data.currentValue.toFixed(2)}</td>
          </tr>
          ${event.data.previousValue !== undefined ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Previous Value:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${event.data.previousValue.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${event.data.change !== undefined ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Change:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              ${event.data.change > 0 ? '+' : ''}${event.data.change.toFixed(2)}
              ${event.data.changePercent ? ` (${event.data.changePercent > 0 ? '+' : ''}${event.data.changePercent.toFixed(1)}%)` : ''}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;
  }

  html += `
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Triggered at: ${new Date(event.triggeredAt).toLocaleString()}
        </p>
      </div>
    </div>
  `;

  return html;
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
  event: AlertEvent,
  config: SlackChannelConfig
): Promise<void> {
  const payload = formatSlackPayload(event, config);

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Format Slack message payload
 */
function formatSlackPayload(event: AlertEvent, config: SlackChannelConfig) {
  const severityColor = {
    critical: "#dc2626",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#6b7280"
  }[event.severity];

  return {
    username: config.username || "AI Visibility Alerts",
    icon_emoji: config.iconEmoji || ":rotating_light:",
    channel: config.channel,
    attachments: [
      {
        color: severityColor,
        title: event.title,
        text: event.message,
        fields: [
          {
            title: "Severity",
            value: event.severity.toUpperCase(),
            short: true
          },
          {
            title: "Metric",
            value: event.data.metric,
            short: true
          },
          {
            title: "Current Value",
            value: event.data.currentValue.toFixed(2),
            short: true
          },
          ...(event.data.change !== undefined ? [{
            title: "Change",
            value: `${event.data.change > 0 ? '+' : ''}${event.data.change.toFixed(2)}${event.data.changePercent ? ` (${event.data.changePercent.toFixed(1)}%)` : ''}`,
            short: true
          }] : [])
        ],
        footer: "AI Visibility Platform",
        ts: Math.floor(new Date(event.triggeredAt).getTime() / 1000)
      }
    ]
  };
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  event: AlertEvent,
  config: WebhookChannelConfig
): Promise<void> {
  const payload = config.includeFullPayload ? event : {
    id: event.id,
    type: event.type,
    severity: event.severity,
    title: event.title,
    message: event.message,
    triggeredAt: event.triggeredAt
  };

  const headers = {
    "Content-Type": "application/json",
    ...(config.headers || {})
  };

  const response = await fetch(config.url, {
    method: config.method,
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Send Discord notification
 */
async function sendDiscordNotification(
  event: AlertEvent,
  config: DiscordChannelConfig
): Promise<void> {
  const payload = formatDiscordPayload(event, config);

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Format Discord message payload
 */
function formatDiscordPayload(event: AlertEvent, config: DiscordChannelConfig) {
  const severityColor = {
    critical: 0xdc2626,
    high: 0xf59e0b,
    medium: 0x3b82f6,
    low: 0x6b7280
  }[event.severity];

  return {
    username: config.username || "AI Visibility Alerts",
    avatar_url: config.avatarUrl,
    embeds: [
      {
        title: event.title,
        description: event.message,
        color: severityColor,
        fields: [
          {
            name: "Severity",
            value: event.severity.toUpperCase(),
            inline: true
          },
          {
            name: "Metric",
            value: event.data.metric,
            inline: true
          },
          {
            name: "Current Value",
            value: event.data.currentValue.toFixed(2),
            inline: true
          }
        ],
        timestamp: event.triggeredAt,
        footer: {
          text: "AI Visibility Platform"
        }
      }
    ]
  };
}

/**
 * Send Microsoft Teams notification
 */
async function sendTeamsNotification(
  event: AlertEvent,
  config: TeamsChannelConfig
): Promise<void> {
  const payload = formatTeamsPayload(event);

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Teams API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Format Teams message payload (Adaptive Card)
 */
function formatTeamsPayload(event: AlertEvent) {
  const severityColor = {
    critical: "Attention",
    high: "Warning",
    medium: "Accent",
    low: "Default"
  }[event.severity];

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: event.title,
              size: "Large",
              weight: "Bolder",
              color: severityColor
            },
            {
              type: "TextBlock",
              text: event.message,
              wrap: true
            },
            {
              type: "FactSet",
              facts: [
                {
                  title: "Severity:",
                  value: event.severity.toUpperCase()
                },
                {
                  title: "Metric:",
                  value: event.data.metric
                },
                {
                  title: "Current Value:",
                  value: event.data.currentValue.toFixed(2)
                },
                ...(event.data.change !== undefined ? [{
                  title: "Change:",
                  value: `${event.data.change > 0 ? '+' : ''}${event.data.change.toFixed(2)}`
                }] : [])
              ]
            },
            {
              type: "TextBlock",
              text: `Triggered at: ${new Date(event.triggeredAt).toLocaleString()}`,
              size: "Small",
              color: "Default",
              isSubtle: true
            }
          ]
        }
      }
    ]
  };
}

/**
 * Test notification channel
 */
export async function testNotificationChannel(
  channel: NotificationChannel
): Promise<{ success: boolean; error?: string }> {
  const testEvent: AlertEvent = {
    id: "test_" + Date.now(),
    alertConfigId: "test",
    triggeredAt: new Date().toISOString(),
    type: "visibility_drop",
    severity: "medium",
    title: "Test Notification",
    message: "This is a test notification from AI Visibility Platform. If you received this, your notification channel is configured correctly!",
    data: {
      metric: "overall_visibility",
      currentValue: 75,
      previousValue: 80,
      threshold: 5,
      change: -5,
      changePercent: -6.25
    },
    notificationsSent: [],
    acknowledged: false
  };

  try {
    await sendNotification(testEvent, channel);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
