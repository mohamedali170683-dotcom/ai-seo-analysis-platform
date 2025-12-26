import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

// Generate secure webhook secret
function generateWebhookSecret(): string {
  return 'whsec_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/webhooks - List all webhooks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const webhooks = await prisma.webhookConfig.findMany({
      where: { userId },
      include: {
        deliveries: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      webhooks
    });
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create new webhook
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = 'demo-user',
      name,
      url,
      events = [],
      enabled = true
    } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate secure secret
    const secret = generateWebhookSecret();

    const webhook = await prisma.webhookConfig.create({
      data: {
        userId,
        name,
        url,
        secret,
        events,
        enabled
      }
    });

    return NextResponse.json({
      success: true,
      webhook
    });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
