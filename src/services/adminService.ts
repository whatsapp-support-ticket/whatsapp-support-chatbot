import dbConnect from '@/lib/mongodb';
import Draw from '@/models/Draw';
import Payment from '@/models/Payment';
import Setting from '@/models/Setting';
import Ticket from '@/models/Ticket';
import { generateTickets } from '@/services/ticketService';

const PAYMENT_SETTINGS_KEY = 'payment-config';

export async function getPaymentSettings() {
  await dbConnect();

  const settings = await Setting.findOne({ key: PAYMENT_SETTINGS_KEY }).lean();
  return settings ?? null;
}

export async function upsertPaymentSettings(input: {
  qrCodeUrl?: string;
  paymentInstructions?: string;
  activeDrawId?: string;
}) {
  await dbConnect();

  const update = {
    ...(input.qrCodeUrl !== undefined ? { qrCodeUrl: input.qrCodeUrl } : {}),
    ...(input.paymentInstructions !== undefined ? { paymentInstructions: input.paymentInstructions } : {}),
    ...(input.activeDrawId !== undefined ? { activeDrawId: input.activeDrawId || null } : {}),
    updatedAt: new Date(),
  };

  return await Setting.findOneAndUpdate(
    { key: PAYMENT_SETTINGS_KEY },
    update,
    { upsert: true, new: true }
  ).lean();
}

export async function createDraw(input: {
  drawName: string;
  drawDate: Date;
  ticketPrice: number;
}) {
  await dbConnect();

  return await Draw.create(input);
}

export async function updateDraw(drawId: string, input: {
  drawName: string;
  drawDate: Date;
  ticketPrice: number;
}) {
  await dbConnect();

  return await Draw.findByIdAndUpdate(
    drawId,
    input,
    { new: true }
  ).lean();
}

export async function deleteDraw(drawId: string) {
  await dbConnect();

  await Promise.all([
    Draw.findByIdAndDelete(drawId),
    Ticket.deleteMany({ drawId }),
    Setting.updateMany({ activeDrawId: drawId }, { activeDrawId: null }),
  ]);
}

export async function listDraws() {
  await dbConnect();

  return await Draw.find({}).sort({ drawDate: 1 }).lean();
}

export async function generateTicketsForDraw(input: {
  drawId: string;
  prefix: string;
  count: number;
}) {
  await generateTickets(input.drawId, input.prefix, input.count);
}

export async function createTicket(input: {
  drawId: string;
  ticketNumber: string;
}) {
  await dbConnect();

  return await Ticket.create({
    drawId: input.drawId,
    ticketNumber: input.ticketNumber,
    status: 'available',
  });
}

export async function listTicketsForDraw(drawId?: string) {
  await dbConnect();

  const filter = drawId ? { drawId } : {};

  return await Ticket.find(filter)
    .sort({ createdAt: -1, ticketNumber: 1 })
    .limit(200)
    .lean();
}

export async function updateTicket(ticketId: string, input: {
  ticketNumber: string;
  status: 'available' | 'reserved' | 'sold';
}) {
  await dbConnect();

  const update: {
    ticketNumber: string;
    status: 'available' | 'reserved' | 'sold';
    reservedBy?: null;
    reservedAt?: null;
    soldTo?: null;
    soldAt?: null;
  } = {
    ticketNumber: input.ticketNumber,
    status: input.status,
  };

  if (input.status === 'available') {
    update.reservedBy = null;
    update.reservedAt = null;
    update.soldTo = null;
    update.soldAt = null;
  }

  return await Ticket.findByIdAndUpdate(ticketId, update, { new: true }).lean();
}

export async function deleteTicket(ticketId: string) {
  await dbConnect();

  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) {
    return;
  }

  await Promise.all([
    Ticket.findByIdAndDelete(ticketId),
    Payment.deleteMany({ ticketNumber: ticket.ticketNumber }),
  ]);
}

export async function getAdminDashboardSnapshot() {
  await dbConnect();

  const [draws, tickets, settings, payments, ticketSummary] = await Promise.all([
    Draw.find({}).sort({ drawDate: 1 }).lean(),
    Ticket.find({}).sort({ createdAt: -1 }).limit(200).lean(),
    getPaymentSettings(),
    Payment.find({}).sort({ createdAt: -1 }).limit(50).lean(),
    Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats = {
    availableTickets: 0,
    reservedTickets: 0,
    soldTickets: 0,
    pendingPayments: payments.filter((payment) => payment.status === 'pending').length,
  };

  for (const entry of ticketSummary) {
    if (entry._id === 'available') stats.availableTickets = entry.count;
    if (entry._id === 'reserved') stats.reservedTickets = entry.count;
    if (entry._id === 'sold') stats.soldTickets = entry.count;
  }

  return {
    stats,
    draws,
    tickets,
    payments,
    settings,
  };
}
