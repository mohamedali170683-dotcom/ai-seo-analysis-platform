import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { calculateNextRun } from '@/lib/services/automation/scheduledScanManager';

// GET /api/automation/scans/[id] - Get single scheduled scan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scan = await prisma.scheduledScan.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startTime: 'desc' },
          take: 10
        }
      }
    });

    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scan
    });
  } catch (error: any) {
    console.error('Error fetching scheduled scan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/automation/scans/[id] - Update scheduled scan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If schedule parameters changed, recalculate nextRun
    let nextRun;
    if (body.frequency || body.hour !== undefined || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined) {
      const existingScan = await prisma.scheduledScan.findUnique({ where: { id } });
      if (!existingScan) {
        return NextResponse.json(
          { success: false, error: 'Scan not found' },
          { status: 404 }
        );
      }

      nextRun = calculateNextRun({
        frequency: body.frequency || existingScan.frequency,
        hour: body.hour !== undefined ? body.hour : existingScan.hour,
        dayOfWeek: body.dayOfWeek !== undefined ? body.dayOfWeek : existingScan.dayOfWeek,
        dayOfMonth: body.dayOfMonth !== undefined ? body.dayOfMonth : existingScan.dayOfMonth,
        cronExpression: body.cronExpression || existingScan.cronExpression,
        timezone: body.timezone || existingScan.timezone
      });
    }

    const scan = await prisma.scheduledScan.update({
      where: { id },
      data: {
        ...body,
        ...(nextRun && { nextRun })
      }
    });

    return NextResponse.json({
      success: true,
      scan
    });
  } catch (error: any) {
    console.error('Error updating scheduled scan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/automation/scans/[id] - Delete scheduled scan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.scheduledScan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting scheduled scan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
