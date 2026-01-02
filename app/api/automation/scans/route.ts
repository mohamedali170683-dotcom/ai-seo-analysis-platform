import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { calculateNextRun } from '@/lib/services/automation/scheduledScanManager';
import { getTierLimits, canScheduleScan, isFrequencyAllowed, type UserTier } from '@/lib/utils/tierLimits';

// GET /api/automation/scans - List all scheduled scans
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    // Get user with tier info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, scheduledScansUsed: true }
    });

    const tier = (user?.tier as UserTier) || 'free';
    const limits = getTierLimits(tier);

    const scans = await prisma.scheduledScan.findMany({
      where: { userId },
      include: {
        executions: {
          orderBy: { startTime: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      scans,
      tier,
      limits: {
        maxScheduledScans: limits.maxScheduledScans,
        allowedFrequencies: limits.allowedFrequencies,
        currentCount: scans.length,
        canCreateMore: canScheduleScan(tier, scans.length)
      }
    });
  } catch (error: any) {
    console.error('Error fetching scheduled scans:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/automation/scans - Create a new scheduled scan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = 'demo-user',
      name,
      brandOrKeyword,
      domain,
      competitors = [],
      frequency,
      hour,
      dayOfWeek,
      dayOfMonth,
      timezone = 'UTC',
      enabled = true,
      // Optional: link to brand positioning analysis
      brandGroundTruthId,
      analysisType = 'brand_positioning' // 'brand_positioning' | 'seo_analysis'
    } = body;

    // Validate required fields
    if (!name || !brandOrKeyword || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user tier and check limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    const tier = (user?.tier as UserTier) || 'free';
    const limits = getTierLimits(tier);

    // Check if user can access automation
    if (!limits.canAccessAutomation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Automation is not available on the Free tier. Upgrade to Professional to schedule scans.',
          requiresUpgrade: true,
          requiredTier: 'professional'
        },
        { status: 403 }
      );
    }

    // Check if frequency is allowed for this tier
    if (!isFrequencyAllowed(tier, frequency)) {
      return NextResponse.json(
        {
          success: false,
          error: `${frequency} frequency is not available on your tier. Allowed frequencies: ${limits.allowedFrequencies.join(', ')}`,
          allowedFrequencies: limits.allowedFrequencies
        },
        { status: 403 }
      );
    }

    // Check if user has reached their scan limit
    const existingScansCount = await prisma.scheduledScan.count({
      where: { userId }
    });

    if (!canScheduleScan(tier, existingScansCount)) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached your limit of ${limits.maxScheduledScans} scheduled scans. Upgrade to Partner for unlimited scans.`,
          currentCount: existingScansCount,
          maxAllowed: limits.maxScheduledScans,
          requiresUpgrade: true,
          requiredTier: 'partner'
        },
        { status: 403 }
      );
    }

    // Calculate next run time
    const nextRun = calculateNextRun({
      frequency,
      hour,
      dayOfWeek,
      dayOfMonth,
      cronExpression: undefined,
      timezone
    });

    const scan = await prisma.scheduledScan.create({
      data: {
        userId,
        name,
        brandOrKeyword,
        domain,
        competitors,
        enabled,
        frequency,
        hour,
        dayOfWeek,
        dayOfMonth,
        timezone,
        nextRun,
        // Store analysis type in description for now
        description: JSON.stringify({ analysisType, brandGroundTruthId })
      }
    });

    return NextResponse.json({
      success: true,
      scan,
      tier,
      remainingScans: limits.maxScheduledScans === -1
        ? 'unlimited'
        : limits.maxScheduledScans - existingScansCount - 1
    });
  } catch (error: any) {
    console.error('Error creating scheduled scan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
