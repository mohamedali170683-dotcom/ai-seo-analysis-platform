/**
 * Universal Dashboard Design System
 *
 * Based on peer-reviewed cognitive science research:
 * - Miller's Law (1956): 7±2 chunks in working memory
 * - Sweller's Cognitive Load Theory (1988)
 * - Tufte's Data-Ink Ratio (1983)
 * - Few's Dashboard Design (2006, 2013)
 * - Nielsen Norman Group eye-tracking research
 */

// ============================================================================
// SEMANTIC COLOR SYSTEM
// ============================================================================

export const SEMANTIC_COLORS = {
  // Status colors (use for data with meaning)
  positive: '#16a34a',      // Green - above target, success, growth
  warning: '#d97706',       // Amber - approaching threshold, caution
  critical: '#dc2626',      // Red - below target, urgent, needs action
  info: '#2563eb',          // Blue - neutral information, links
  neutral: '#6366f1',       // Indigo - informational data

  // De-emphasis colors (use for secondary data)
  muted: '#6b7280',         // Gray-500 - secondary metrics
  mutedLight: '#9ca3af',    // Gray-400 - tertiary info
  mutedDark: '#4b5563',     // Gray-600 - de-emphasized text
  disabled: '#d1d5db',      // Gray-300 - inactive states

  // Backgrounds (use for structure, not data)
  bgPrimary: '#ffffff',     // Main content
  bgSecondary: '#f9fafb',   // Cards, sections (gray-50)
  bgTertiary: '#f3f4f6',    // Nested elements (gray-100)

  // Text
  textPrimary: '#111827',   // Primary content (gray-900)
  textSecondary: '#4b5563', // Supporting text (gray-600)
  textMuted: '#9ca3af',     // Timestamps, meta info (gray-400)

  // Borders
  border: '#e5e7eb',        // Standard borders (gray-200)
  borderLight: '#f3f4f6',   // Subtle borders (gray-100)
};

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

export interface StatusConfig {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  good: {
    icon: '✓',
    color: SEMANTIC_COLORS.positive,
    bgColor: '#dcfce7',
    label: 'Good'
  },
  warning: {
    icon: '⚠',
    color: SEMANTIC_COLORS.warning,
    bgColor: '#fef3c7',
    label: 'Needs Attention'
  },
  critical: {
    icon: '!',
    color: SEMANTIC_COLORS.critical,
    bgColor: '#fee2e2',
    label: 'Critical'
  },
  neutral: {
    icon: '○',
    color: SEMANTIC_COLORS.muted,
    bgColor: '#f3f4f6',
    label: 'Neutral'
  }
};

// ============================================================================
// SCORING THRESHOLDS
// ============================================================================

export const SCORE_THRESHOLDS = {
  good: 70,      // >= 70 = good performance
  warning: 40,   // 40-69 = needs improvement
  // < 40 = critical
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get semantic color based on score value
 * @param score Numeric score (0-100)
 * @param goodThreshold Threshold for "good" status (default 70)
 * @param warningThreshold Threshold for "warning" status (default 40)
 * @returns Hex color code
 */
export function getStatusColor(
  score: number,
  goodThreshold: number = SCORE_THRESHOLDS.good,
  warningThreshold: number = SCORE_THRESHOLDS.warning
): string {
  if (score >= goodThreshold) return SEMANTIC_COLORS.positive;
  if (score >= warningThreshold) return SEMANTIC_COLORS.warning;
  return SEMANTIC_COLORS.critical;
}

/**
 * Get status label based on score
 * @param score Numeric score (0-100)
 * @param goodThreshold Threshold for "good" status (default 70)
 * @param warningThreshold Threshold for "warning" status (default 40)
 * @returns Status label string
 */
export function getStatusLabel(
  score: number,
  goodThreshold: number = SCORE_THRESHOLDS.good,
  warningThreshold: number = SCORE_THRESHOLDS.warning
): string {
  if (score >= goodThreshold) return 'Good';
  if (score >= warningThreshold) return 'Needs Work';
  return 'Critical';
}

/**
 * Get status configuration based on score
 * @param score Numeric score (0-100)
 * @param goodThreshold Threshold for "good" status (default 70)
 * @param warningThreshold Threshold for "warning" status (default 40)
 * @returns StatusConfig object
 */
export function getStatusConfig(
  score: number,
  goodThreshold: number = SCORE_THRESHOLDS.good,
  warningThreshold: number = SCORE_THRESHOLDS.warning
): StatusConfig {
  if (score >= goodThreshold) return STATUS_CONFIG.good;
  if (score >= warningThreshold) return STATUS_CONFIG.warning;
  return STATUS_CONFIG.critical;
}

/**
 * Get Tailwind CSS classes for status-based styling
 * @param score Numeric score (0-100)
 * @returns Object with text and bg class names
 */
export function getStatusClasses(score: number) {
  if (score >= SCORE_THRESHOLDS.good) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-100',
      border: 'border-green-200',
      icon: 'text-green-600'
    };
  }
  if (score >= SCORE_THRESHOLDS.warning) {
    return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      icon: 'text-yellow-600'
    };
  }
  return {
    text: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
    icon: 'text-red-600'
  };
}

// ============================================================================
// SPACING SYSTEM (Based on 8px grid)
// ============================================================================

export const SPACING = {
  xs: '4px',   // Inside compact elements
  sm: '8px',   // Between related items
  md: '16px',  // Between grouped elements
  lg: '24px',  // Between sections
  xl: '32px',  // Between major sections
  '2xl': '48px', // Page-level separation
};

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const TYPOGRAPHY = {
  // Hero/Primary KPI
  hero: {
    fontSize: '64px',
    lineHeight: '1',
    fontWeight: '700',
  },
  // Section headings
  h1: {
    fontSize: '32px',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  h2: {
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '600',
  },
  h3: {
    fontSize: '20px',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  // Body text
  bodyLarge: {
    fontSize: '16px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  body: {
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: '12px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  // Labels
  label: {
    fontSize: '12px',
    lineHeight: '1.5',
    fontWeight: '500',
  },
};

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

export const CHART_CONFIG = {
  sparkline: {
    defaultWidth: 80,
    defaultHeight: 24,
    strokeWidth: 1.5,
    dotRadius: 2.5,
  },
  bulletGraph: {
    height: 32,
    barHeight: 12,
    targetLineWidth: 2,
  },
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const A11Y = {
  minContrastRatio: {
    normal: 4.5,      // Normal text
    large: 3,         // Large text (18px+)
    ui: 3,            // UI components
  },
  focusOutline: {
    color: SEMANTIC_COLORS.info,
    width: '2px',
    offset: '2px',
  },
};

// ============================================================================
// COGNITIVE LOAD LIMITS
// ============================================================================

export const COGNITIVE_LIMITS = {
  maxVisibleModules: 7,        // Miller's Law: 7±2 chunks
  maxCategoricalColors: 6,     // Beyond 6, use patterns/labels
  maxChartDataPoints: 50,      // For sparklines/trends
  maxTableRowsBeforePaging: 10, // Before requiring pagination
};
