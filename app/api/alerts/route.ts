import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/alerts - List all alerts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const alerts = await prisma.alertConfig.findMany({
      where: { userId },
      include: {
        events: {
          orderBy: { triggeredAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      alerts
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = 'demo-user',
      name,
      type,
      conditions = [],
      channels = [],
      throttleEnabled = false,
      throttleWindow,
      maxAlertsPerWindow,
      enabled = true
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const alert = await prisma.alertConfig.create({
      data: {
        userId,
        name,
        type,
        enabled,
        conditions,
        channels,
        throttleEnabled,
        throttleWindow,
        maxAlertsPerWindow
      }
    });

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
