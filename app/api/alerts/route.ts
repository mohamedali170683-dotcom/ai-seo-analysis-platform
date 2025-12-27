import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateBody, alertCreateSchema } from '@/lib/validations/schemas';
import { PAGINATION } from '@/lib/constants';

// GET /api/alerts - List all alerts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      PAGINATION.MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10))
    );

    const [alerts, total] = await Promise.all([
      prisma.alertConfig.findMany({
        where: { userId },
        include: {
          events: {
            orderBy: { triggeredAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.alertConfig.count({ where: { userId } })
    ]);

    return NextResponse.json({
      success: true,
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching alerts:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: Request) {
  try {
    const [validatedBody, validationError] = await validateBody(request, alertCreateSchema);

    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    const {
      userId,
      name,
      type,
      conditions,
      channels,
      throttleEnabled,
      throttleWindow,
      maxAlertsPerWindow,
      enabled
    } = validatedBody;

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating alert:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
