import 'dotenv/config';
import dbConnect from '../lib/mongodb';
import Draw from '../models/Draw';
import Ticket from '../models/Ticket';
import Payment from '../models/Payment';
import User from '../models/User';
import { generateTickets } from '../services/ticketService';

async function seed() {
  await dbConnect();

  // Clear existing data
  console.log('Clearing existing data...');
  await Draw.deleteMany({});
  await Ticket.deleteMany({});
  await Payment.deleteMany({});
  await User.deleteMany({});
  console.log('Existing data cleared.');

  // Create a draw
  const draw = new Draw({
    drawName: 'Weekly Lottery',
    drawDate: new Date('2026-03-15T20:00:00Z'),
    ticketPrice: 50,
  });
  await draw.save();
  console.log('Draw created:', draw._id);

  // Generate tickets
  await generateTickets(draw._id.toString(), 'A', 10);
  console.log('Tickets generated');

  process.exit(0);
}



seed().catch(console.error);