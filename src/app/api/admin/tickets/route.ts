import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { createTicket, listTicketsForDraw } from '@/services/adminService';

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

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const { drawId, ticketNumber } = await req.json();

    if (!drawId || !ticketNumber) {
      return NextResponse.json({ error: 'drawId and ticketNumber are required' }, { status: 400 });
    }

    const ticket = await createTicket({
      drawId,
      ticketNumber: String(ticketNumber).trim().toUpperCase(),
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
