import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTickets } from '@/services/ticketService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const drawId = searchParams.get('drawId') || undefined;

    const tickets = await getAvailableTickets(page, limit, drawId);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Get available tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
