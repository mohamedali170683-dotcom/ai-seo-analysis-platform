import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { calculateNextRun } from '@/lib/services/automation/scheduledScanManager';

// GET /api/automation/scans - List all scheduled scans
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

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
      scans
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
      enabled = true
    } = body;

    // Validate required fields
    if (!name || !brandOrKeyword || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRun = calculateNextRun({
      frequency,
      hour,
      dayOfWeek,
      dayOfMonth,
      cronExpression: null,
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
        nextRun
      }
    });

    return NextResponse.json({
      success: true,
      scan
    });
  } catch (error: any) {
    console.error('Error creating scheduled scan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
