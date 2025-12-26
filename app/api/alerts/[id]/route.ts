import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// PATCH /api/alerts/[id] - Update alert
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const alert = await prisma.alertConfig.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/[id] - Delete alert
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.alertConfig.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
