/**
 * Export Service
 *
 * Handles data exports in multiple formats (CSV, JSON, XLSX, PDF)
 */

import type {
  ExportJob,
  ExportType,
  ExportFormat,
  ExportConfig,
  ExportData,
  ExportMetadata
} from "@/lib/types/api";

/**
 * Create export job
 */
export async function createExportJob(
  userId: string,
  type: ExportType,
  format: ExportFormat,
  config: ExportConfig
): Promise<ExportJob> {
  const job: ExportJob = {
    id: generateExportId(),
    userId,
    type,
    format,
    config,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  return job;
}

/**
 * Process export job
 */
export async function processExportJob(
  job: ExportJob,
  dataFetcher: (config: ExportConfig) => Promise<any[]>
): Promise<ExportJob> {
  try {
    job.status = "processing";

    // Fetch data
    const rawData = await dataFetcher(job.config);

    // Transform data based on type
    const transformedData = transformDataForExport(rawData, job.type, job.config);

    // Create export data structure
    const exportData: ExportData = {
      metadata: createExportMetadata(job, transformedData),
      data: transformedData,
      summary: generateSummary(transformedData, job.type)
    };

    // Generate file based on format
    const fileContent = await generateExportFile(exportData, job.format);
    const fileSize = Buffer.byteLength(fileContent);

    // In production, upload to S3/cloud storage and get URL
    const downloadUrl = await uploadExportFile(job.id, fileContent, job.format);

    job.status = "completed";
    job.completedAt = new Date().toISOString();
    job.downloadUrl = downloadUrl;
    job.fileSize = fileSize;

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    job.expiresAt = expiresAt.toISOString();

    return job;
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.error = error instanceof Error ? error.message : String(error);
    return job;
  }
}

/**
 * Transform data for export based on type
 */
function transformDataForExport(
  data: any[],
  type: ExportType,
  config: ExportConfig
): any[] {
  switch (type) {
    case "scan_results":
      return transformScanResults(data, config);
    case "visibility_trends":
      return transformVisibilityTrends(data, config);
    case "competitive_analysis":
      return transformCompetitiveAnalysis(data, config);
    case "alert_history":
      return transformAlertHistory(data, config);
    case "hallucination_report":
      return transformHallucinationReport(data, config);
    case "full_report":
      return transformFullReport(data, config);
    default:
      return data;
  }
}

/**
 * Transform scan results for export
 */
function transformScanResults(data: any[], config: ExportConfig): any[] {
  return data.map(scan => {
    const row: any = {
      scan_id: scan.id,
      timestamp: scan.timestamp,
      overall_score: scan.overallScore
    };

    // Add LLM breakdown if requested
    if (!config.fields || config.fields.includes("llm_scores")) {
      row.chatgpt_score = scan.byLLM?.chatgpt || 0;
      row.gemini_score = scan.byLLM?.gemini || 0;
      row.copilot_score = scan.byLLM?.copilot || 0;
      row.perplexity_score = scan.byLLM?.perplexity || 0;
    }

    // Add stage breakdown if requested
    if (!config.fields || config.fields.includes("stage_scores")) {
      row.awareness_score = scan.byStage?.awareness || 0;
      row.consideration_score = scan.byStage?.consideration || 0;
      row.decision_score = scan.byStage?.decision || 0;
    }

    // Add raw data if requested
    if (config.includeRawData) {
      row.raw_responses = JSON.stringify(scan.responses);
    }

    return row;
  });
}

/**
 * Transform visibility trends for export
 */
function transformVisibilityTrends(data: any[], config: ExportConfig): any[] {
  return data.map(point => ({
    date: point.date,
    overall_score: point.score,
    change_from_previous: point.change || 0,
    trend: point.trend || "stable",
    llm: point.llm || "all",
    stage: point.stage || "all"
  }));
}

/**
 * Transform competitive analysis for export
 */
function transformCompetitiveAnalysis(data: any[], config: ExportConfig): any[] {
  return data.map(comp => ({
    query: comp.query,
    your_position: comp.yourPosition,
    your_score: comp.yourScore,
    competitor: comp.competitor,
    competitor_position: comp.competitorPosition,
    competitor_score: comp.competitorScore,
    gap: comp.gap,
    llm: comp.llm,
    stage: comp.stage,
    timestamp: comp.timestamp
  }));
}

/**
 * Transform alert history for export
 */
function transformAlertHistory(data: any[], config: ExportConfig): any[] {
  return data.map(alert => ({
    alert_id: alert.id,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    triggered_at: alert.triggeredAt,
    status: alert.status,
    scan_id: alert.scanId,
    metric: alert.data?.metric,
    value: alert.data?.value,
    threshold: alert.data?.threshold
  }));
}

/**
 * Transform hallucination report for export
 */
function transformHallucinationReport(data: any[], config: ExportConfig): any[] {
  return data.flatMap(detection =>
    detection.hallucinations.map((hall: any) => ({
      detection_id: detection.id,
      hallucination_id: hall.id,
      llm: detection.llm,
      query: detection.query,
      type: hall.type,
      severity: hall.severity,
      claim: hall.claim,
      truth: hall.truth,
      category: hall.category,
      brand_damage: hall.impact.brandDamage,
      user_confusion: hall.impact.userConfusion,
      legal_risk: hall.impact.legalRisk,
      recommendations: hall.recommendations.join("; "),
      detected_at: detection.detectedAt
    }))
  );
}

/**
 * Transform full report for export
 */
function transformFullReport(data: any[], config: ExportConfig): any[] {
  // Combines all data types into comprehensive export
  return data;
}

/**
 * Create export metadata
 */
function createExportMetadata(job: ExportJob, data: any[]): ExportMetadata {
  return {
    exportId: job.id,
    type: job.type,
    format: job.format,
    generatedAt: new Date().toISOString(),
    recordCount: data.length,
    dateRange: job.config.dateRange,
    filters: {
      scanIds: job.config.scanIds,
      llms: job.config.llms,
      stages: job.config.stages
    }
  };
}

/**
 * Generate summary statistics
 */
function generateSummary(data: any[], type: ExportType): Record<string, any> {
  switch (type) {
    case "scan_results":
      return {
        totalScans: data.length,
        averageScore: data.reduce((sum, d) => sum + (d.overall_score || 0), 0) / data.length || 0,
        highestScore: Math.max(...data.map(d => d.overall_score || 0)),
        lowestScore: Math.min(...data.map(d => d.overall_score || 0))
      };

    case "alert_history":
      return {
        totalAlerts: data.length,
        critical: data.filter(d => d.severity === "critical").length,
        high: data.filter(d => d.severity === "high").length,
        medium: data.filter(d => d.severity === "medium").length,
        low: data.filter(d => d.severity === "low").length
      };

    case "hallucination_report":
      return {
        totalHallucinations: data.length,
        bySeverity: {
          critical: data.filter(d => d.severity === "critical").length,
          high: data.filter(d => d.severity === "high").length,
          medium: data.filter(d => d.severity === "medium").length,
          low: data.filter(d => d.severity === "low").length
        },
        byType: data.reduce((acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

    default:
      return {
        totalRecords: data.length
      };
  }
}

/**
 * Generate export file based on format
 */
async function generateExportFile(
  exportData: ExportData,
  format: ExportFormat
): Promise<string> {
  switch (format) {
    case "json":
      return generateJSON(exportData);
    case "csv":
      return generateCSV(exportData);
    case "xlsx":
      return generateXLSX(exportData);
    case "pdf":
      return generatePDF(exportData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate JSON export
 */
function generateJSON(exportData: ExportData): string {
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate CSV export
 */
function generateCSV(exportData: ExportData): string {
  if (exportData.data.length === 0) {
    return "No data available";
  }

  const headers = Object.keys(exportData.data[0]);
  const rows = exportData.data.map(row =>
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma/quote/newline
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",")
  );

  return [
    `# Export ID: ${exportData.metadata.exportId}`,
    `# Generated: ${exportData.metadata.generatedAt}`,
    `# Records: ${exportData.metadata.recordCount}`,
    "",
    headers.join(","),
    ...rows
  ].join("\n");
}

/**
 * Generate XLSX export (basic implementation)
 * In production, use a library like 'xlsx' or 'exceljs'
 */
function generateXLSX(exportData: ExportData): string {
  // This is a placeholder - in production use xlsx library
  // For now, return CSV-like format
  return generateCSV(exportData);
}

/**
 * Generate PDF export (basic implementation)
 * In production, use a library like 'pdfkit' or 'puppeteer'
 */
function generatePDF(exportData: ExportData): string {
  // This is a placeholder - in production use PDF generation library
  // For now, return formatted text
  const lines = [
    `AI Visibility Export Report`,
    `Export ID: ${exportData.metadata.exportId}`,
    `Generated: ${new Date(exportData.metadata.generatedAt).toLocaleString()}`,
    ``,
    `Summary:`,
    ...Object.entries(exportData.summary || {}).map(([key, value]) =>
      `  ${key}: ${JSON.stringify(value)}`
    ),
    ``,
    `Records: ${exportData.metadata.recordCount}`,
    ``,
    `Data:`,
    JSON.stringify(exportData.data, null, 2)
  ];

  return lines.join("\n");
}

/**
 * Upload export file to storage
 * In production, this would upload to S3/cloud storage
 */
async function uploadExportFile(
  exportId: string,
  content: string,
  format: ExportFormat
): Promise<string> {
  // Placeholder implementation
  // In production:
  // 1. Upload to S3/cloud storage
  // 2. Generate signed URL with expiration
  // 3. Return URL

  // For now, return a mock URL
  return `/api/exports/${exportId}/download`;
}

/**
 * Convert export to streaming format
 */
export async function* streamExport(
  job: ExportJob,
  dataFetcher: (config: ExportConfig) => AsyncGenerator<any>
): AsyncGenerator<string> {
  // Stream data in chunks for large exports
  const format = job.format;

  if (format === "json") {
    yield '{"metadata":';
    yield JSON.stringify(createExportMetadata(job, []));
    yield ',"data":[';

    let first = true;
    for await (const chunk of dataFetcher(job.config)) {
      if (!first) yield ",";
      yield JSON.stringify(chunk);
      first = false;
    }

    yield "]}";
  } else if (format === "csv") {
    // Yield CSV header first
    yield "# Streaming export\n";

    let headersWritten = false;
    for await (const chunk of dataFetcher(job.config)) {
      if (!headersWritten) {
        const headers = Object.keys(chunk);
        yield headers.join(",") + "\n";
        headersWritten = true;
      }

      const values = Object.values(chunk).map(v => String(v));
      yield values.join(",") + "\n";
    }
  }
}

/**
 * Generate export ID
 */
function generateExportId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get export statistics
 */
export function getExportStats(jobs: ExportJob[]): {
  total: number;
  byFormat: Record<ExportFormat, number>;
  byType: Record<ExportType, number>;
  byStatus: Record<string, number>;
  averageFileSize: number;
  totalDataExported: number; // bytes
} {
  const stats = {
    total: jobs.length,
    byFormat: {} as Record<ExportFormat, number>,
    byType: {} as Record<ExportType, number>,
    byStatus: {} as Record<string, number>,
    averageFileSize: 0,
    totalDataExported: 0
  };

  for (const job of jobs) {
    stats.byFormat[job.format] = (stats.byFormat[job.format] || 0) + 1;
    stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;

    if (job.fileSize) {
      stats.totalDataExported += job.fileSize;
    }
  }

  stats.averageFileSize = jobs.length > 0
    ? stats.totalDataExported / jobs.filter(j => j.fileSize).length
    : 0;

  return stats;
}

/**
 * Clean up expired exports
 */
export function getExpiredExports(jobs: ExportJob[]): ExportJob[] {
  const now = new Date();

  return jobs.filter(job => {
    if (!job.expiresAt) return false;
    return new Date(job.expiresAt) < now;
  });
}
