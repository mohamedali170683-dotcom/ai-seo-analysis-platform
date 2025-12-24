/**
 * Report Generator
 *
 * Generates automated reports for scheduled scans (weekly digests, monthly overviews, etc.)
 */

import type {
  AutomatedReport,
  ReportData,
  ReportSummary,
  ReportSection,
  ScanExecution,
  AlertEvent
} from "@/lib/types/automation";

/**
 * Generate weekly digest report
 */
export async function generateWeeklyDigest(
  scanId: string,
  executions: ScanExecution[],
  alerts: AlertEvent[]
): Promise<AutomatedReport> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to last week's data
  const weekExecutions = executions.filter(e => {
    const execTime = new Date(e.startedAt);
    return execTime >= weekAgo && execTime <= now;
  });

  const weekAlerts = alerts.filter(a => {
    const alertTime = new Date(a.triggeredAt);
    return alertTime >= weekAgo && alertTime <= now;
  });

  // Calculate summary
  const summary = calculateWeeklySummary(weekExecutions, weekAlerts);

  // Generate sections
  const sections: ReportSection[] = [];

  // Section 1: Visibility Trend
  sections.push(generateVisibilityTrendSection(weekExecutions));

  // Section 2: Alert Summary
  if (weekAlerts.length > 0) {
    sections.push(generateAlertSummarySection(weekAlerts));
  }

  // Section 3: LLM Performance
  sections.push(generateLLMPerformanceSection(weekExecutions));

  // Section 4: Recommendations
  sections.push(generateRecommendationsSection(summary, weekAlerts));

  const data: ReportData = {
    period: {
      start: weekAgo.toISOString(),
      end: now.toISOString()
    },
    summary,
    sections,
    alerts: weekAlerts
  };

  return {
    id: generateReportId(),
    scheduledScanId: scanId,
    scanId: weekExecutions[weekExecutions.length - 1]?.id || scanId,
    generatedAt: now.toISOString(),
    type: "weekly_digest",
    format: "html",
    data
  };
}

/**
 * Calculate weekly summary
 */
function calculateWeeklySummary(
  executions: ScanExecution[],
  alerts: AlertEvent[]
): ReportSummary {
  if (executions.length === 0) {
    return {
      overallScore: 0,
      change: 0,
      changePercent: 0,
      trend: "stable",
      highlights: [],
      concerns: []
    };
  }

  const completed = executions.filter(e => e.status === "completed" && e.results);

  if (completed.length === 0) {
    return {
      overallScore: 0,
      change: 0,
      changePercent: 0,
      trend: "stable",
      highlights: [],
      concerns: []
    };
  }

  const latestScore = completed[completed.length - 1].results!.overallScore;
  const earliestScore = completed[0].results!.overallScore;
  const change = latestScore - earliestScore;
  const changePercent = earliestScore > 0 ? (change / earliestScore) * 100 : 0;

  const trend = Math.abs(changePercent) < 5 ? "stable" :
                changePercent > 0 ? "improving" : "declining";

  // Generate highlights
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (changePercent > 10) {
    highlights.push(`Visibility increased by ${changePercent.toFixed(1)}% this week`);
  }

  if (changePercent < -10) {
    concerns.push(`Visibility decreased by ${Math.abs(changePercent).toFixed(1)}% this week`);
  }

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  if (criticalAlerts.length > 0) {
    concerns.push(`${criticalAlerts.length} critical alert(s) triggered`);
  }

  const highAlerts = alerts.filter(a => a.severity === "high");
  if (highAlerts.length > 3) {
    concerns.push(`${highAlerts.length} high-priority alerts require attention`);
  }

  if (completed.length === executions.length) {
    highlights.push("All scheduled scans completed successfully");
  }

  return {
    overallScore: latestScore,
    change,
    changePercent,
    trend,
    highlights,
    concerns
  };
}

/**
 * Generate visibility trend section
 */
function generateVisibilityTrendSection(executions: ScanExecution[]): ReportSection {
  const completed = executions.filter(e => e.status === "completed" && e.results);

  const chartData = completed.map(exec => ({
    date: new Date(exec.startedAt).toLocaleDateString(),
    score: exec.results!.overallScore,
    awareness: exec.results!.byStage.awareness,
    consideration: exec.results!.byStage.consideration,
    decision: exec.results!.byStage.decision
  }));

  return {
    title: "Visibility Trend",
    type: "chart",
    data: chartData,
    charts: [
      {
        type: "line",
        title: "Overall Visibility Score",
        data: chartData
      }
    ]
  };
}

/**
 * Generate alert summary section
 */
function generateAlertSummarySection(alerts: AlertEvent[]): ReportSection {
  const bySeverity = {
    critical: alerts.filter(a => a.severity === "critical").length,
    high: alerts.filter(a => a.severity === "high").length,
    medium: alerts.filter(a => a.severity === "medium").length,
    low: alerts.filter(a => a.severity === "low").length
  };

  const byType: Record<string, number> = {};
  for (const alert of alerts) {
    byType[alert.type] = (byType[alert.type] || 0) + 1;
  }

  return {
    title: "Alerts This Week",
    type: "table",
    data: {
      bySeverity,
      byType,
      total: alerts.length,
      topAlerts: alerts
        .filter(a => a.severity === "critical" || a.severity === "high")
        .slice(0, 5)
        .map(a => ({
          title: a.title,
          severity: a.severity,
          triggeredAt: new Date(a.triggeredAt).toLocaleString()
        }))
    }
  };
}

/**
 * Generate LLM performance section
 */
function generateLLMPerformanceSection(executions: ScanExecution[]): ReportSection {
  const completed = executions.filter(e => e.status === "completed" && e.results);

  if (completed.length === 0) {
    return {
      title: "Performance by Platform",
      type: "table",
      data: {}
    };
  }

  const latest = completed[completed.length - 1].results!;
  const earliest = completed[0].results!;

  const llmData = [
    {
      platform: "ChatGPT",
      current: latest.byLLM.chatgpt,
      change: latest.byLLM.chatgpt - earliest.byLLM.chatgpt
    },
    {
      platform: "Gemini",
      current: latest.byLLM.gemini,
      change: latest.byLLM.gemini - earliest.byLLM.gemini
    },
    {
      platform: "Copilot",
      current: latest.byLLM.copilot,
      change: latest.byLLM.copilot - earliest.byLLM.copilot
    },
    {
      platform: "Perplexity",
      current: latest.byLLM.perplexity,
      change: latest.byLLM.perplexity - earliest.byLLM.perplexity
    }
  ];

  return {
    title: "Performance by Platform",
    type: "table",
    data: llmData,
    charts: [
      {
        type: "bar",
        title: "Current Scores by Platform",
        data: llmData
      }
    ]
  };
}

/**
 * Generate recommendations section
 */
function generateRecommendationsSection(
  summary: ReportSummary,
  alerts: AlertEvent[]
): ReportSection {
  const recommendations: string[] = [];

  // Based on trend
  if (summary.trend === "declining") {
    recommendations.push("🔍 Investigate causes of declining visibility - review recent content changes and competitor activity");
  }

  if (summary.trend === "improving") {
    recommendations.push("✅ Continue current strategy - visibility is trending positively");
  }

  // Based on alerts
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  if (criticalAlerts.length > 0) {
    recommendations.push(`🚨 Address ${criticalAlerts.length} critical alert(s) immediately`);
  }

  const visibilityDrops = alerts.filter(a => a.type === "visibility_drop");
  if (visibilityDrops.length > 2) {
    recommendations.push("📉 Multiple visibility drops detected - consider content optimization or increased publishing frequency");
  }

  const competitorAlerts = alerts.filter(a => a.type === "competitor_takeover");
  if (competitorAlerts.length > 0) {
    recommendations.push("⚔️ Competitors gaining ground - review competitive analysis and adjust strategy");
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push("📊 Continue monitoring - no critical issues detected");
    recommendations.push("💡 Consider expanding content coverage to improve citation rate");
  }

  return {
    title: "Recommendations",
    type: "list",
    data: recommendations
  };
}

/**
 * Format report as HTML email
 */
export function formatReportAsHTML(report: AutomatedReport): string {
  const { summary, sections } = report.data;

  const trendColor = {
    improving: "#10b981",
    declining: "#ef4444",
    stable: "#6b7280"
  }[summary.trend];

  const trendIcon = {
    improving: "📈",
    declining: "📉",
    stable: "➡️"
  }[summary.trend];

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; margin: 20px 0; }
        .change { font-size: 24px; }
        .section { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
        .highlights { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; }
        .concerns { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; }
        .list-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .footer { text-align: center; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Weekly AI Visibility Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">
          ${new Date(report.data.period.start).toLocaleDateString()} - ${new Date(report.data.period.end).toLocaleDateString()}
        </p>
        <div class="score">${summary.overallScore.toFixed(1)}</div>
        <div class="change" style="color: ${trendColor};">
          ${trendIcon} ${summary.change > 0 ? '+' : ''}${summary.change.toFixed(1)} (${summary.changePercent > 0 ? '+' : ''}${summary.changePercent.toFixed(1)}%)
        </div>
      </div>
  `;

  // Highlights and Concerns
  if (summary.highlights.length > 0) {
    html += `
      <div class="highlights">
        <strong>✨ Highlights</strong>
        <ul style="margin: 10px 0 0 0;">
          ${summary.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (summary.concerns.length > 0) {
    html += `
      <div class="concerns">
        <strong>⚠️ Concerns</strong>
        <ul style="margin: 10px 0 0 0;">
          ${summary.concerns.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Sections
  for (const section of sections) {
    html += `<div class="section">`;
    html += `<div class="section-title">${section.title}</div>`;

    if (section.type === "list" && Array.isArray(section.data)) {
      html += `<ul>${section.data.map((item: string) => `<li class="list-item">${item}</li>`).join('')}</ul>`;
    } else if (section.type === "table") {
      html += formatTableData(section.data);
    }

    html += `</div>`;
  }

  html += `
      <div class="footer">
        <p>Generated by AI Visibility Platform | ${new Date(report.generatedAt).toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Format table data as HTML
 */
function formatTableData(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return "<p>No data available</p>";

    const headers = Object.keys(data[0]);
    let html = "<table><thead><tr>";
    headers.forEach(h => {
      html += `<th>${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
    });
    html += "</tr></thead><tbody>";

    data.forEach((row: any) => {
      html += "<tr>";
      headers.forEach(h => {
        const value = row[h];
        const formatted = typeof value === "number" ? value.toFixed(1) : value;
        html += `<td>${formatted}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    return html;
  }

  return "<p>No data available</p>";
}

/**
 * Generate report ID
 */
function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
