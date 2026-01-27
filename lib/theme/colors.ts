/**
 * Stratum UI Dashboard Color System
 *
 * Brand: Petrol #173D32, Orange #EB4200, Blue #396FFA
 * Canvas: Off-white #FBF9F5, Surface: #FFFFFF
 */

export const DASHBOARD_COLORS = {
  // Status colors
  positive: '#16a34a',
  warning: '#d97706',
  critical: '#dc2626',
  neutral: '#396FFA',        // Stratum blue

  // Muted
  muted: '#B0B0B0',          // Stratum off-grey
  mutedLight: '#E5E5E5',     // Stratum border
  mutedDark: '#4A5F5F',

  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FBF9F5',    // Stratum off-white
  bgTertiary: '#F5F3EF',

  // Text
  textPrimary: '#062121',    // Stratum off-black
  textSecondary: '#4A5F5F',
  textMuted: '#B0B0B0',

  // Brand (Stratum petrol for nav, blue for interactive)
  brand: '#173D32',           // Stratum petrol
  brandLight: '#ACD3C8',     // Stratum petrol lighter
  brandDark: '#1D5142',      // Stratum petrol light

  // Borders
  borderLight: '#E5E5E5',
  borderMedium: '#CCCCCC',
  borderStrong: '#B0B0B0',
} as const;

export const STATUS_COLORS = {
  good: DASHBOARD_COLORS.positive,
  ok: DASHBOARD_COLORS.neutral,
  warning: DASHBOARD_COLORS.warning,
  critical: DASHBOARD_COLORS.critical,
  inactive: DASHBOARD_COLORS.muted,
} as const;

export function getStatusColor(
  score: number,
  goodThreshold: number = 70,
  warningThreshold: number = 40
): string {
  if (score >= goodThreshold) return STATUS_COLORS.good;
  if (score >= warningThreshold) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}

export function getStatusLabel(
  score: number,
  goodThreshold: number = 70,
  warningThreshold: number = 40
): 'good' | 'warning' | 'critical' {
  if (score >= goodThreshold) return 'good';
  if (score >= warningThreshold) return 'warning';
  return 'critical';
}

export const SENTIMENT_COLORS = {
  positive: '#86efac',
  neutral: '#E5E5E5',
  negative: '#fca5a5',
} as const;

export const BULLET_RANGE_COLORS = {
  poor: '#fee2e2',
  ok: '#fef3c7',
  good: '#d1fae5',
} as const;

export const SEMANTIC_COLORS = DASHBOARD_COLORS;
