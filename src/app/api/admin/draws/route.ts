import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { createDraw, listDraws } from '@/services/adminService';

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const draws = await listDraws();
    return NextResponse.json({ draws });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const { drawName, ticketPrice } = await req.json();

    if (!drawName || !ticketPrice) {
      return NextResponse.json({ error: 'drawName and ticketPrice are required' }, { status: 400 });
    }

    const draw = await createDraw({
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
