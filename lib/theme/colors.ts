/**
 * Evidence-Based Dashboard Color System
 * Based on research from Stephen Few, Edward Tufte, and Nielsen Norman Group
 *
 * Key Principles:
 * - Use color sparingly for data that requires attention
 * - Gray for secondary/non-actionable information
 * - Semantic colors for status (good/warning/critical)
 * - Brand colors ONLY for navigation, NOT data visualization
 */

export const DASHBOARD_COLORS = {
  // Primary data colors (use sparingly)
  positive: '#16a34a',      // Green - above target, good performance
  warning: '#d97706',       // Amber - approaching limit, needs monitoring
  critical: '#dc2626',      // Red - needs immediate attention
  neutral: '#6366f1',       // Indigo - informational, no action needed

  // Secondary/de-emphasis (use for non-critical data)
  muted: '#9ca3af',         // Gray-400 - de-emphasized data
  mutedLight: '#d1d5db',    // Gray-300 - very low emphasis
  mutedDark: '#6b7280',     // Gray-500 - slightly more emphasis

  // Backgrounds
  bgPrimary: '#ffffff',     // White - main content background
  bgSecondary: '#f9fafb',   // Gray-50 - secondary sections
  bgTertiary: '#f3f4f6',    // Gray-100 - tertiary elements

  // Text
  textPrimary: '#111827',   // Gray-900 - primary text, headlines
  textSecondary: '#4b5563', // Gray-600 - secondary text, labels
  textMuted: '#9ca3af',     // Gray-400 - metadata, timestamps

  // Brand (use ONLY for navigation/UI, NOT data)
  brand: '#7c3aed',         // Purple - navigation, buttons
  brandLight: '#ede9fe',    // Purple-100 - brand backgrounds
  brandDark: '#5b21b6',     // Purple-800 - brand hover states

  // Borders
  borderLight: '#e5e7eb',   // Gray-200 - subtle borders
  borderMedium: '#d1d5db',  // Gray-300 - card borders
  borderStrong: '#9ca3af',  // Gray-400 - emphasized borders
} as const;

/**
 * Status-based color mapping
 * Maps semantic states to their corresponding colors
 */
export const STATUS_COLORS = {
  good: DASHBOARD_COLORS.positive,
  ok: DASHBOARD_COLORS.neutral,
  warning: DASHBOARD_COLORS.warning,
  critical: DASHBOARD_COLORS.critical,
  inactive: DASHBOARD_COLORS.muted,
} as const;

/**
 * Get status color based on score thresholds
 * @param score - Numeric score (0-100)
 * @param goodThreshold - Score above this is considered good (default: 70)
 * @param warningThreshold - Score above this is considered warning (default: 40)
 * @returns Hex color code
 */
export function getStatusColor(
  score: number,
  goodThreshold: number = 70,
  warningThreshold: number = 40
): string {
  if (score >= goodThreshold) return STATUS_COLORS.good;
  if (score >= warningThreshold) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}

/**
 * Get status label based on score thresholds
 * @param score - Numeric score (0-100)
 * @param goodThreshold - Score above this is considered good (default: 70)
 * @param warningThreshold - Score above this is considered warning (default: 40)
 * @returns Status label
 */
export function getStatusLabel(
  score: number,
  goodThreshold: number = 70,
  warningThreshold: number = 40
): 'good' | 'warning' | 'critical' {
  if (score >= goodThreshold) return 'good';
  if (score >= warningThreshold) return 'warning';
  return 'critical';
}

/**
 * Sentiment colors for visualization
 */
export const SENTIMENT_COLORS = {
  positive: '#86efac',    // Light green - positive sentiment
  neutral: '#d1d5db',     // Gray - neutral sentiment
  negative: '#fca5a5',    // Light red - negative sentiment
} as const;

/**
 * Bullet graph qualitative range colors
 */
export const BULLET_RANGE_COLORS = {
  poor: '#fee2e2',        // Light red
  ok: '#fef3c7',          // Light yellow
  good: '#d1fae5',        // Light green
} as const;

/**
 * Alias for backwards compatibility with design-system.ts
 * SEMANTIC_COLORS is the same as DASHBOARD_COLORS
 */
export const SEMANTIC_COLORS = DASHBOARD_COLORS;
