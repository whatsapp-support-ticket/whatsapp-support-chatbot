import twilio from 'twilio';
import Draw from '../models/Draw';
import User from '../models/User';
import dbConnect from '../lib/mongodb';
import { getPaymentSettings } from './adminService';
import { createPaymentSubmission } from './paymentService';
import { formatDrawDate, normalizePhoneNumber, TICKETS_PER_PAGE } from '../lib/lottery';
import { getAvailableTickets, getUserReservedTicket, getUserTickets, reserveTicket } from './ticketService';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Lazy initialization of Twilio client
function getTwilioClient(): twilio.Twilio {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
  }
  return twilio(accountSid, authToken);
}

export async function handleWhatsAppMessage(from: string, body: string, mediaUrl?: string) {
  await dbConnect();

  const phoneNumber = normalizePhoneNumber(from);
  const input = body.trim().toUpperCase();

  // Ensure user exists
  await User.findOneAndUpdate(
    { phoneNumber },
    { phoneNumber },
    { upsert: true, new: true }
  );

  let response = '';

  if (['HI', 'HELLO', 'MENU', 'START'].includes(input)) {
    response = `Welcome to Lucky Lottery

1. Buy Ticket
2. Check Result
3. My Tickets

Reply with a number.

Commands:
BUY
NEXT
PREV
MENU`;
  } else if (input === '1' || input === 'BUY') {
    const settings = await getPaymentSettings();
    const drawId = settings?.activeDrawId?.toString();
    const availableTickets = await getAvailableTickets(1, TICKETS_PER_PAGE, drawId);
    if (availableTickets.tickets.length === 0) {
      response = 'No tickets available at the moment. Please try again later.';
    } else {
      response = `Available Tickets (Page ${availableTickets.pagination.page}/${availableTickets.pagination.totalPages})\n\n`;
      availableTickets.tickets.forEach((ticket) => {
        response += `${ticket.ticketNumber}\n`;
      });
      response += '\nReply with the ticket number to reserve it.\nSend NEXT for more tickets.';
    }
  } else if (input === 'NEXT' || input === 'PREV') {
    const settings = await getPaymentSettings();
    const drawId = settings?.activeDrawId?.toString();
    const page = input === 'NEXT' ? 2 : 1;
    const availableTickets = await getAvailableTickets(page, TICKETS_PER_PAGE, drawId);
    if (availableTickets.tickets.length === 0) {
      response = 'No more tickets available on that page. Send BUY to restart.';
    } else {
      response = `Available Tickets (Page ${availableTickets.pagination.page}/${availableTickets.pagination.totalPages})\n\n`;
      availableTickets.tickets.forEach((ticket) => {
        response += `${ticket.ticketNumber}\n`;
      });
      response += '\nReply with the ticket number to reserve it.';
    }
  } else if (input === '2') {
    const nextDraw = await Draw.findOne({ drawDate: { $gte: new Date() } }).sort({ drawDate: 1 }).lean();
    response = nextDraw
      ? `Next draw: ${nextDraw.drawName}\nDate: ${formatDrawDate(new Date(nextDraw.drawDate))}\nTicket Price: Rs.${nextDraw.ticketPrice}`
      : 'No upcoming draw is configured yet.';
  } else if (input === '3' || input === 'MY TICKETS') {
    const tickets = await getUserTickets(phoneNumber);
    if (tickets.length === 0) {
      response = 'You do not have any reserved or sold tickets.';
    } else {
      response = 'Your tickets:\n\n';
      for (const ticket of tickets) {
        const draw = ticket.drawId as { drawName?: string; drawDate?: Date } | null;
        response += `${ticket.ticketNumber} - ${ticket.status.toUpperCase()}`;
        if (draw?.drawDate) {
          response += ` - ${formatDrawDate(new Date(draw.drawDate))}`;
        }
        response += '\n';
      }
    }
  } else if (/^[A-Z]\d{3,}$/.test(input)) {
    try {
      const ticket = await reserveTicket(input, phoneNumber);
      if (!ticket) {
        response = 'Ticket not available or invalid. Please try another number.';
      } else {
        const draw = await Draw.findById(ticket.drawId).lean();
        const settings = await getPaymentSettings();
        const paymentLine = settings?.paymentInstructions
          ? `\nPayment Details: ${settings.paymentInstructions}\n`
          : '\n';
        response = `Ticket ${input} reserved for 5 minutes.

Ticket Price: Rs.${draw?.ticketPrice ?? '--'}
${paymentLine}
Complete payment using the QR code and send either:
1. Payment screenshot
2. UTR number`;
      }
    } catch (error) {
      response = error instanceof Error ? error.message : 'Ticket could not be reserved.';
    }
  } else if (mediaUrl || /^\d{10,20}$/.test(input)) {
    try {
      await createPaymentSubmission({
        phoneNumber,
        screenshotUrl: mediaUrl,
        utrNumber: /^\d{10,20}$/.test(input) ? input : undefined,
      });
      response = 'Payment submitted for verification. You will receive confirmation once it is approved.';
    } catch (error) {
      response = error instanceof Error ? error.message : 'Payment could not be submitted.';
    }
  } else {
    const reservedTicket = await getUserReservedTicket(phoneNumber);
    response = reservedTicket
      ? `You still have ticket ${reservedTicket.ticketNumber} reserved. Send payment screenshot or UTR number, or wait 5 minutes for expiry.`
      : 'Invalid input. Send MENU to see available options.';
  }

  // Send response
  try {
    const client = getTwilioClient();

    const messageData: {
      body: string;
      from: string;
      to: string;
      mediaUrl?: string[];
    } = {
      body: response,
      from: fromNumber!,
      to: from,
    };

    if (response.includes('reserved')) {
      const settings = await getPaymentSettings();
      const qrCodeUrl = settings?.qrCodeUrl || process.env.QR_CODE_URL;
      if (qrCodeUrl && !qrCodeUrl.startsWith('data:')) {
        messageData.mediaUrl = [qrCodeUrl];
      }
    }

    await client.messages.create(messageData);
  } catch (error) {
    console.warn('Twilio client not initialized. Skipping WhatsApp response:', error);
  }
}

export async function sendConfirmation(phoneNumber: string, ticketNumber: string, drawDate: Date) {
  const client = getTwilioClient();

  const message = `Payment verified.

Your Ticket Number: ${ticketNumber}
Draw Date: ${formatDrawDate(drawDate)}

Good luck!`;

  await client.messages.create({
    body: message,
    from: fromNumber!,
    to: `whatsapp:${phoneNumber}`,
  });
}
