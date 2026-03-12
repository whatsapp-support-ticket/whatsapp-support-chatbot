import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { deleteTicket, updateTicket } from '@/services/adminService';

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { ticketId } = await context.params;
    const { ticketNumber, status } = await req.json();

    const ticket = await updateTicket(ticketId, {
      ticketNumber,
      status,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { ticketId } = await context.params;
    await deleteTicket(ticketId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
