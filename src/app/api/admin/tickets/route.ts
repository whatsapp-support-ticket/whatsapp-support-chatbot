import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { listTicketsForDraw } from '@/services/adminService';

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const drawId = searchParams.get('drawId') || undefined;
    const tickets = await listTicketsForDraw(drawId);
    return NextResponse.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
