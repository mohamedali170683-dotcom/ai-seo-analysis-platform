import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// PATCH /api/integrations/[id] - Update integration
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const integration = await prisma.integration.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Disconnect/Delete integration
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.integration.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
