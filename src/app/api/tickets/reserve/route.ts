import { NextRequest, NextResponse } from 'next/server';
import { reserveTicket } from '@/services/ticketService';

export async function POST(req: NextRequest) {
  try {
    const { ticketNumber, phoneNumber } = await req.json();
    const ticket = await reserveTicket(ticketNumber, phoneNumber);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not available' }, { status: 400 });
    }
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Reserve ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}