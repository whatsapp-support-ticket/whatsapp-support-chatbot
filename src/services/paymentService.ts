import Payment from '@/models/Payment';
import Draw from '@/models/Draw';
import Ticket from '@/models/Ticket';
import dbConnect from '@/lib/mongodb';
import { getUserReservedTicket, releaseTicket, sellTicket } from '@/services/ticketService';
import { sendConfirmation } from '@/services/whatsappService';

export async function createPaymentSubmission(params: {
  phoneNumber: string;
  ticketNumber?: string;
  screenshotUrl?: string;
  utrNumber?: string;
}) {
  await dbConnect();

  const reservedTicket = await getUserReservedTicket(params.phoneNumber);
  if (!reservedTicket) {
    throw new Error('No active reservation found for this phone number.');
  }

  if (params.ticketNumber && params.ticketNumber !== reservedTicket.ticketNumber) {
    throw new Error('Payment does not match the active reserved ticket.');
  }

  const existingPendingPayment = await Payment.findOne({
    phoneNumber: params.phoneNumber,
    ticketNumber: reservedTicket.ticketNumber,
    status: 'pending',
  });

  if (existingPendingPayment) {
    return existingPendingPayment;
  }

  return await Payment.create({
    phoneNumber: params.phoneNumber,
    drawId: reservedTicket.drawId,
    ticketId: reservedTicket._id,
    ticketNumber: reservedTicket.ticketNumber,
    screenshotUrl: params.screenshotUrl,
    utrNumber: params.utrNumber,
  });
}

export async function approvePayment(paymentId: string) {
  await dbConnect();

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== 'pending') {
    throw new Error('Invalid payment');
  }

  const soldTicket = await sellTicket(payment.ticketNumber, payment.phoneNumber);
  if (!soldTicket) {
    throw new Error('Ticket is no longer reserved by this user.');
  }

  payment.status = 'approved';
  payment.reviewedAt = new Date();
  await payment.save();

  const draw = await Draw.findById(soldTicket.drawId);
  if (draw) {
    await sendConfirmation(payment.phoneNumber, payment.ticketNumber, draw.drawDate);
  }

  await Payment.updateMany(
    {
      _id: { $ne: payment._id },
      ticketNumber: payment.ticketNumber,
      status: 'pending',
    },
    {
      status: 'rejected',
      reviewedAt: new Date(),
    }
  );

  return { payment, soldTicket };
}

export async function rejectPayment(paymentId: string) {
  await dbConnect();

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== 'pending') {
    throw new Error('Invalid payment');
  }

  payment.status = 'rejected';
  payment.reviewedAt = new Date();
  await payment.save();

  await releaseTicket(payment.ticketNumber, payment.phoneNumber);

  return payment;
}

export async function getAdminPaymentQueue() {
  await dbConnect();

  const [payments, ticketSummary, pendingCount] = await Promise.all([
    Payment.find({})
      .sort({ createdAt: -1 })
      .lean(),
    Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.countDocuments({ status: 'pending' }),
  ]);

  const stats = {
    availableTickets: 0,
    reservedTickets: 0,
    soldTickets: 0,
    pendingPayments: pendingCount,
  };

  for (const entry of ticketSummary) {
    if (entry._id === 'available') stats.availableTickets = entry.count;
    if (entry._id === 'reserved') stats.reservedTickets = entry.count;
    if (entry._id === 'sold') stats.soldTickets = entry.count;
  }

  return { payments, stats };
}
