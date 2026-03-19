import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { deleteDraw, updateDraw } from '@/services/adminService';

type RouteContext = {
  params: Promise<{ drawId: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { drawId } = await context.params;
    const { drawName, ticketPrice } = await req.json();

    const draw = await updateDraw(drawId, {
      drawName,
      ticketPrice: Number(ticketPrice),
    });

    return NextResponse.json({ success: true, draw });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { drawId } = await context.params;
    await deleteDraw(drawId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
