/**
 * User Tier Limits and Permissions
 *
 * Defines what each tier can access:
 * - free: Manual analysis only, no scheduling
 * - professional: 5 scheduled scans, weekly/monthly frequency
 * - partner: Unlimited scheduled scans, daily/weekly/monthly frequency
 */

export type UserTier = 'free' | 'professional' | 'partner';

export interface TierLimits {
  maxScheduledScans: number;
  allowedFrequencies: string[];
  canAccessAutomation: boolean;
  canExportReports: boolean;
  canCompareCompetitors: boolean;
  maxCompetitorsPerScan: number;
  supportPriority: 'standard' | 'priority' | 'dedicated';
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxScheduledScans: 0,
    allowedFrequencies: [],
    canAccessAutomation: false,
    canExportReports: true,
    canCompareCompetitors: true,
    maxCompetitorsPerScan: 3,
    supportPriority: 'standard'
  },
  professional: {
    maxScheduledScans: 5,
    allowedFrequencies: ['weekly', 'monthly'],
    canAccessAutomation: true,
    canExportReports: true,
    canCompareCompetitors: true,
    maxCompetitorsPerScan: 10,
    supportPriority: 'priority'
  },
  partner: {
    maxScheduledScans: -1, // Unlimited
    allowedFrequencies: ['daily', 'weekly', 'monthly'],
    canAccessAutomation: true,
    canExportReports: true,
    canCompareCompetitors: true,
    maxCompetitorsPerScan: -1, // Unlimited
    supportPriority: 'dedicated'
  }
};

export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canScheduleScan(tier: UserTier, currentScheduledScans: number): boolean {
  const limits = getTierLimits(tier);
  if (!limits.canAccessAutomation) return false;
  if (limits.maxScheduledScans === -1) return true; // Unlimited
  return currentScheduledScans < limits.maxScheduledScans;
}

export function isFrequencyAllowed(tier: UserTier, frequency: string): boolean {
  const limits = getTierLimits(tier);
  return limits.allowedFrequencies.includes(frequency);
}

export function getRemainingScheduledScans(tier: UserTier, currentScheduledScans: number): number | 'unlimited' {
  const limits = getTierLimits(tier);
  if (limits.maxScheduledScans === -1) return 'unlimited';
  return Math.max(0, limits.maxScheduledScans - currentScheduledScans);
}

export function getTierDisplayName(tier: UserTier): string {
  const names: Record<UserTier, string> = {
    free: 'Free',
    professional: 'Professional',
    partner: 'Partner'
  };
  return names[tier] || 'Free';
}

export function getTierBadgeColor(tier: UserTier): string {
  const colors: Record<UserTier, string> = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    partner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };
  return colors[tier] || colors.free;
}

export function getUpgradeMessage(tier: UserTier, feature: string): string {
  if (tier === 'free') {
    return `Upgrade to Professional to ${feature}`;
  }
  if (tier === 'professional') {
    return `Upgrade to Partner for ${feature}`;
  }
  return '';
}
