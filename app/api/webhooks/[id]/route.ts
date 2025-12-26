import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

// PATCH /api/webhooks/[id] - Update webhook
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      webhook
    });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks/[id] - Delete webhook
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.webhookConfig.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/webhooks/[id]/regenerate-secret - Regenerate webhook secret
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'regenerate-secret') {
      const newSecret = 'whsec_' + crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhookConfig.update({
        where: { id },
        data: { secret: newSecret }
      });

      return NextResponse.json({
        success: true,
        webhook
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error regenerating webhook secret:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
