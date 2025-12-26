import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/integrations - List all integrations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const integrations = await prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      integrations
    });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create/Connect new integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = 'demo-user',
      type,
      name,
      config = {},
      enabled = true
    } = body;

    if (!type || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.create({
      data: {
        userId,
        type,
        name,
        config,
        enabled
      }
    });

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error: any) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
