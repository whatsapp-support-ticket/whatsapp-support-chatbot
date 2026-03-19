import Ticket from '../models/Ticket';
import dbConnect from '../lib/mongodb';
import { getReservationExpiryDate } from '../lib/lottery';

export async function getAvailableTickets(page: number = 1, limit: number = 10, drawId?: string) {
  await dbConnect();
  await expireReservations();

  const skip = (page - 1) * limit;
  const filter = {
    status: 'available',
    ...(drawId ? { drawId } : {}),
  };

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ ticketNumber: 1 }).skip(skip).limit(limit).lean(),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + tickets.length < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function reserveTicket(ticketNumber: string, phoneNumber: string) {
  await dbConnect();

  await expireReservations();

  const activeReservation = await Ticket.findOne({
    reservedBy: phoneNumber,
    status: 'reserved',
  }).lean();

  if (activeReservation && activeReservation.ticketNumber !== ticketNumber) {
    throw new Error(`You already have ticket ${activeReservation.ticketNumber} reserved. Complete payment or wait for it to expire.`);
  }

  const matchingTickets = await Ticket.find({
    ticketNumber,
    $or: [
      { status: 'available' },
      { status: 'reserved', reservedBy: phoneNumber },
    ],
  })
    .select({ _id: 1 })
    .lean();

  if (matchingTickets.length > 1) {
    throw new Error('This ticket number exists in multiple draws. Use unique ticket numbers across draws to support all-draw booking.');
  }

  const ticket = await Ticket.findOneAndUpdate(
    {
      ticketNumber,
      $or: [
        { status: 'available' },
        { status: 'reserved', reservedBy: phoneNumber },
      ],
    },
    { status: 'reserved', reservedBy: phoneNumber, reservedAt: new Date() },
    { returnDocument: 'after' }
  );
  return ticket;
}

export async function expireReservations() {
  await dbConnect();

  await Ticket.updateMany(
    { status: 'reserved', reservedAt: { $lt: getReservationExpiryDate() } },
    { status: 'available', reservedBy: null, reservedAt: null }
  );
}

export async function sellTicket(ticketNumber: string, phoneNumber: string) {
  await dbConnect();
  return await Ticket.findOneAndUpdate(
    { ticketNumber, reservedBy: phoneNumber, status: 'reserved' },
    {
      status: 'sold',
      soldTo: phoneNumber,
      soldAt: new Date(),
      reservedBy: null,
      reservedAt: null,
    },
    { returnDocument: 'after' }
  );
}

export async function releaseTicket(ticketNumber: string, phoneNumber?: string) {
  await dbConnect();
  const filter = phoneNumber
    ? { ticketNumber, reservedBy: phoneNumber, status: 'reserved' }
    : { ticketNumber, status: 'reserved' };

  return await Ticket.findOneAndUpdate(
    filter,
    { status: 'available', reservedBy: null, reservedAt: null },
    { returnDocument: 'after' }
  );
}

export async function getUserTickets(phoneNumber: string) {
  await dbConnect();
  await expireReservations();

  return await Ticket.find({
    $or: [
      { soldTo: phoneNumber, status: 'sold' },
      { reservedBy: phoneNumber, status: 'reserved' },
    ],
  })
    .populate('drawId')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getUserReservedTicket(phoneNumber: string) {
  await dbConnect();
  await expireReservations();

  return await Ticket.findOne({
    reservedBy: phoneNumber,
    status: 'reserved',
  }).populate('drawId');
}

export async function generateTickets(drawId: string, prefix: string, count: number) {
  await dbConnect();
  const tickets = [];
  for (let i = 1; i <= count; i++) {
    const ticketNumber = `${prefix}${i.toString().padStart(6, '0')}`;
    tickets.push({
      ticketNumber,
      drawId,
      status: 'available',
    });
  }
  await Ticket.insertMany(tickets, { ordered: false });
}
