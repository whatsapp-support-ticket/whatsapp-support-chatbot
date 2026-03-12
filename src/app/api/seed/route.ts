import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Draw from '../../../models/Draw';
import { generateTickets } from '../../../services/ticketService';

export async function GET() {
  try {
    await dbConnect();

    // Create a draw
    const draw = new Draw({
      drawName: 'Weekly Lottery',
      drawDate: new Date('2026-03-15T20:00:00Z'),
      ticketPrice: 50,
    });
    await draw.save();

    // Generate tickets
    await generateTickets(draw._id.toString(), 'A', 10);

    return NextResponse.json({ message: 'Seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}