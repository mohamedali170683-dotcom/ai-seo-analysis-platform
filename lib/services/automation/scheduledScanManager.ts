/**
 * Scheduled Scan Manager
 *
 * Manages automated scans with cron-based scheduling
 */

import type {
  ScheduledScan,
  ScanExecution,
  ScanSchedule,
  ScanFrequency
} from "@/lib/types/automation";

/**
 * Calculate next run time based on schedule
 */
export function calculateNextRun(schedule: ScanSchedule, from: Date = new Date()): Date {
  const next = new Date(from);

  switch (schedule.frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      break;

    case "daily":
      next.setDate(next.getDate() + 1);
      next.setHours(schedule.hour || 9); // Default 9 AM
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      break;

    case "weekly":
      const currentDay = next.getDay();
      const targetDay = schedule.dayOfWeek || 1; // Default Monday
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) daysUntilTarget += 7;

      next.setDate(next.getDate() + daysUntilTarget);
      next.setHours(schedule.hour || 9);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      break;

    case "monthly":
      next.setMonth(next.getMonth() + 1);
      next.setDate(schedule.dayOfMonth || 1); // Default 1st of month
      next.setHours(schedule.hour || 9);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      break;

    case "custom":
      // For custom cron expressions, use a cron parser library
      // This is a simplified implementation
      throw new Error("Custom cron expressions require additional implementation");
  }

  return next;
}

/**
 * Check if scheduled scan should run now
 */
export function shouldRunNow(scheduledScan: ScheduledScan): boolean {
  if (!scheduledScan.enabled) {
    return false;
  }

  const now = new Date();
  const nextRun = new Date(scheduledScan.nextRun);

  // Run if next run time has passed
  return now >= nextRun;
}

/**
 * Get scans that are due to run
 */
export function getDueScans(scans: ScheduledScan[]): ScheduledScan[] {
  return scans.filter(scan => shouldRunNow(scan));
}

/**
 * Update scheduled scan after execution
 */
export function updateAfterExecution(
  scheduledScan: ScheduledScan,
  execution: ScanExecution
): ScheduledScan {
  const now = new Date();
  const nextRun = calculateNextRun(scheduledScan.schedule, now);

  return {
    ...scheduledScan,
    lastRun: execution.completedAt || now.toISOString(),
    nextRun: nextRun.toISOString(),
    updatedAt: now.toISOString()
  };
}

/**
 * Validate scan schedule
 */
export function validateSchedule(schedule: ScanSchedule): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate hour (0-23)
  if (schedule.hour !== undefined && (schedule.hour < 0 || schedule.hour > 23)) {
    errors.push("Hour must be between 0 and 23");
  }

  // Validate day of week (0-6)
  if (schedule.dayOfWeek !== undefined && (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6)) {
    errors.push("Day of week must be between 0 (Sunday) and 6 (Saturday)");
  }

  // Validate day of month (1-31)
  if (schedule.dayOfMonth !== undefined && (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31)) {
    errors.push("Day of month must be between 1 and 31");
  }

  // Validate timezone
  if (!isValidTimezone(schedule.timezone)) {
    errors.push("Invalid timezone");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if timezone is valid
 */
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get human-readable schedule description
 */
export function getScheduleDescription(schedule: ScanSchedule): string {
  switch (schedule.frequency) {
    case "hourly":
      return "Every hour";

    case "daily":
      const hour = schedule.hour || 9;
      return `Daily at ${formatHour(hour)}`;

    case "weekly":
      const day = schedule.dayOfWeek || 1;
      const weekHour = schedule.hour || 9;
      return `Weekly on ${getDayName(day)} at ${formatHour(weekHour)}`;

    case "monthly":
      const date = schedule.dayOfMonth || 1;
      const monthHour = schedule.hour || 9;
      return `Monthly on day ${date} at ${formatHour(monthHour)}`;

    case "custom":
      return `Custom: ${schedule.cronExpression || "Not configured"}`;

    default:
      return "Unknown schedule";
  }
}

/**
 * Format hour in 12-hour format
 */
function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Get day name from day number
 */
function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day] || "Unknown";
}

/**
 * Estimate scan duration based on config
 */
export function estimateScanDuration(scan: ScheduledScan): number {
  let baseMinutes = 5; // Base scan time

  // Add time per LLM
  baseMinutes += scan.config.llms.length * 2;

  // Add time for conversation tracking
  if (scan.config.includeConversationTracking) {
    baseMinutes += 15;
  }

  // Add time for trigger testing
  if (scan.config.includeTriggerTesting) {
    baseMinutes += 30;
  }

  // Add time for content gap analysis
  if (scan.config.includeContentGapAnalysis) {
    baseMinutes += 10;
  }

  return baseMinutes;
}

/**
 * Check if scans overlap
 */
export function checkScheduleConflict(
  scan1: ScheduledScan,
  scan2: ScheduledScan
): boolean {
  const next1 = new Date(scan1.nextRun);
  const next2 = new Date(scan2.nextRun);

  const duration1 = estimateScanDuration(scan1) * 60 * 1000; // Convert to ms
  const duration2 = estimateScanDuration(scan2) * 60 * 1000;

  const end1 = new Date(next1.getTime() + duration1);
  const end2 = new Date(next2.getTime() + duration2);

  // Check for overlap
  return next1 < end2 && next2 < end1;
}

/**
 * Generate recommended schedule based on brand size
 */
export function recommendSchedule(
  brandSize: "small" | "medium" | "large"
): ScanSchedule {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  switch (brandSize) {
    case "small":
      // Small brands: weekly scans
      return {
        frequency: "weekly",
        dayOfWeek: 1, // Monday
        hour: 9,
        timezone
      };

    case "medium":
      // Medium brands: daily scans
      return {
        frequency: "daily",
        hour: 9,
        timezone
      };

    case "large":
      // Large brands: hourly scans
      return {
        frequency: "hourly",
        timezone
      };

    default:
      return {
        frequency: "daily",
        hour: 9,
        timezone
      };
  }
}
