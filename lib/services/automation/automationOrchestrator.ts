/**
 * Automation Orchestrator
 *
 * Main service that orchestrates scheduled scans, alerts, and notifications
 */

import type {
  ScheduledScan,
  ScanExecution,
  AlertEvent,
  ScanResults
} from "@/lib/types/automation";
import { getDueScans, updateAfterExecution } from "./scheduledScanManager";
import { evaluateAlerts, shouldThrottleAlert } from "./alertEngine";
import { sendNotifications } from "./notificationService";

export interface AutomationContext {
  getScheduledScans: () => Promise<ScheduledScan[]>;
  updateScheduledScan: (scan: ScheduledScan) => Promise<void>;
  createScanExecution: (execution: ScanExecution) => Promise<ScanExecution>;
  updateScanExecution: (execution: ScanExecution) => Promise<void>;
  executeScan: (scan: ScheduledScan) => Promise<ScanResults>;
  getPreviousScanResults: (scanId: string) => Promise<ScanResults | undefined>;
  getRecentAlerts: (scanId: string) => Promise<AlertEvent[]>;
  saveAlertEvent: (event: AlertEvent) => Promise<void>;
}

/**
 * Run automation cycle (called by cron job)
 */
export async function runAutomationCycle(
  context: AutomationContext
): Promise<{
  scansExecuted: number;
  alertsTriggered: number;
  notificationsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let scansExecuted = 0;
  let alertsTriggered = 0;
  let notificationsSent = 0;

  try {
    // 1. Get all scheduled scans
    const allScans = await context.getScheduledScans();

    // 2. Filter to scans that are due
    const dueScans = getDueScans(allScans);

    console.log(`Found ${dueScans.length} scans due to run`);

    // 3. Execute each due scan
    for (const scan of dueScans) {
      try {
        const result = await executeSingleScan(scan, context);

        scansExecuted++;
        alertsTriggered += result.alertsTriggered;
        notificationsSent += result.notificationsSent;
      } catch (error) {
        const errorMessage = `Failed to execute scan ${scan.id}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }
  } catch (error) {
    const errorMessage = `Automation cycle failed: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(errorMessage);
    console.error(errorMessage);
  }

  return {
    scansExecuted,
    alertsTriggered,
    notificationsSent,
    errors
  };
}

/**
 * Execute a single scheduled scan
 */
async function executeSingleScan(
  scan: ScheduledScan,
  context: AutomationContext
): Promise<{
  alertsTriggered: number;
  notificationsSent: number;
}> {
  // 1. Create scan execution record
  const execution: ScanExecution = {
    id: generateExecutionId(),
    scheduledScanId: scan.id,
    startedAt: new Date().toISOString(),
    status: "running",
    alertsTriggered: 0
  };

  await context.createScanExecution(execution);

  try {
    // 2. Execute the actual scan
    const results = await context.executeScan(scan);

    // 3. Get previous results for comparison
    const previousResults = await context.getPreviousScanResults(scan.id);

    // 4. Evaluate alerts
    const triggeredAlerts = evaluateAlerts(scan.alerts, results, previousResults);

    // 5. Filter out throttled alerts
    const recentAlerts = await context.getRecentAlerts(scan.id);
    const activeAlerts = triggeredAlerts.filter(alert => {
      const config = scan.alerts.find(a => a.id === alert.alertConfigId);
      return config && !shouldThrottleAlert(config, recentAlerts);
    });

    // 6. Send notifications for each alert
    let totalNotificationsSent = 0;
    for (const alert of activeAlerts) {
      const config = scan.alerts.find(a => a.id === alert.alertConfigId);
      if (!config) continue;

      const deliveries = await sendNotifications(alert, config.channels);
      alert.notificationsSent = deliveries;

      totalNotificationsSent += deliveries.filter(d => d.status === "sent").length;

      // Save alert event
      await context.saveAlertEvent(alert);
    }

    // 7. Update execution with results
    execution.completedAt = new Date().toISOString();
    execution.status = "completed";
    execution.results = results;
    execution.alertsTriggered = activeAlerts.length;
    execution.duration = Math.floor(
      (new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000
    );

    await context.updateScanExecution(execution);

    // 8. Update scheduled scan (next run time, last run)
    const updatedScan = updateAfterExecution(scan, execution);
    await context.updateScheduledScan(updatedScan);

    return {
      alertsTriggered: activeAlerts.length,
      notificationsSent: totalNotificationsSent
    };
  } catch (error) {
    // Update execution with error
    execution.completedAt = new Date().toISOString();
    execution.status = "failed";
    execution.error = error instanceof Error ? error.message : String(error);

    await context.updateScanExecution(execution);

    throw error;
  }
}

/**
 * Execute scan on demand (manual trigger)
 */
export async function executeOnDemandScan(
  scan: ScheduledScan,
  context: AutomationContext
): Promise<{
  execution: ScanExecution;
  alerts: AlertEvent[];
}> {
  const result = await executeSingleScan(scan, context);
  const recentAlerts = await context.getRecentAlerts(scan.id);

  // Get the execution we just created
  const executions = await getRecentExecutions(scan.id, 1, context);
  const execution = executions[0];

  return {
    execution,
    alerts: recentAlerts.slice(0, result.alertsTriggered)
  };
}

/**
 * Pause scheduled scan
 */
export async function pauseScheduledScan(
  scanId: string,
  context: AutomationContext
): Promise<void> {
  const scans = await context.getScheduledScans();
  const scan = scans.find(s => s.id === scanId);

  if (!scan) {
    throw new Error(`Scheduled scan ${scanId} not found`);
  }

  scan.enabled = false;
  scan.updatedAt = new Date().toISOString();

  await context.updateScheduledScan(scan);
}

/**
 * Resume scheduled scan
 */
export async function resumeScheduledScan(
  scanId: string,
  context: AutomationContext
): Promise<void> {
  const scans = await context.getScheduledScans();
  const scan = scans.find(s => s.id === scanId);

  if (!scan) {
    throw new Error(`Scheduled scan ${scanId} not found`);
  }

  scan.enabled = true;
  scan.updatedAt = new Date().toISOString();

  await context.updateScheduledScan(scan);
}

/**
 * Get recent executions for a scan
 */
async function getRecentExecutions(
  scanId: string,
  limit: number,
  context: AutomationContext
): Promise<ScanExecution[]> {
  // This would query your database
  // Placeholder implementation
  return [];
}

/**
 * Generate execution ID
 */
function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get automation health status
 */
export async function getAutomationHealth(
  context: AutomationContext
): Promise<{
  totalScans: number;
  activeScans: number;
  pausedScans: number;
  failedScansLast24h: number;
  alertsLast24h: number;
  nextScheduledRun?: string;
}> {
  const scans = await context.getScheduledScans();
  const totalScans = scans.length;
  const activeScans = scans.filter(s => s.enabled).length;
  const pausedScans = scans.filter(s => !s.enabled).length;

  // Find next scheduled run
  const nextRuns = scans
    .filter(s => s.enabled)
    .map(s => new Date(s.nextRun))
    .sort((a, b) => a.getTime() - b.getTime());

  const nextScheduledRun = nextRuns.length > 0 ? nextRuns[0].toISOString() : undefined;

  return {
    totalScans,
    activeScans,
    pausedScans,
    failedScansLast24h: 0, // Would query actual failures
    alertsLast24h: 0, // Would query actual alerts
    nextScheduledRun
  };
}

/**
 * Cleanup old executions and alerts
 */
export async function cleanupOldRecords(
  retentionDays: number,
  context: AutomationContext
): Promise<{
  executionsDeleted: number;
  alertsDeleted: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // This would delete old records from database
  // Placeholder implementation

  return {
    executionsDeleted: 0,
    alertsDeleted: 0
  };
}
