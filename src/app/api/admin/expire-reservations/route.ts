import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { expireReservations } from '@/services/ticketService';

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    await expireReservations();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Expire reservations error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
