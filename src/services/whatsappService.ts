import twilio from "twilio";
import Draw from "../models/Draw";
import User from "../models/User";
import dbConnect from "../lib/mongodb";
import { getPaymentSettings } from "./adminService";
import { createPaymentSubmission } from "./paymentService";
import {
  formatDrawDate,
  normalizePhoneNumber,
  normalizeWhatsAppAddress,
  TICKETS_PER_PAGE,
} from "../lib/lottery";
import {
  getAvailableTickets,
  getUserReservedTicket,
  getUserTickets,
  reserveTicket,
} from "./ticketService";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const TICKET_NUMBER_PATTERN = /^[A-Z]{2}\d{6}$/;

export type WhatsAppReply = {
  body: string;
  mediaUrl?: string;
};

// Lazy initialization of Twilio client
function getTwilioClient(): twilio.Twilio {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
    );
  }
  return twilio(accountSid, authToken);
}

export async function handleWhatsAppMessage(
  from: string,
  body: string,
  mediaUrl?: string,
): Promise<WhatsAppReply> {
  await dbConnect();

  const phoneNumber = normalizePhoneNumber(from);
  const replyTo = normalizeWhatsAppAddress(from);
  const input = body.trim().toUpperCase();
  console.info("[whatsapp] inbound", {
    from,
    phoneNumber,
    replyTo,
    body,
    input,
    hasMedia: Boolean(mediaUrl),
  });

  // Ensure user exists
  await User.findOneAndUpdate(
    { phoneNumber },
    { phoneNumber },
    { upsert: true, returnDocument: "after" },
  );

  let response = "";
  let responseMediaUrl: string | undefined;

  if (["HI", "HELLO", "MENU", "START"].includes(input)) {
    response = `Welcome to Kerala Lottery

1. Buy Ticket
2. Check Result
3. My Tickets

Reply with a number.

Commands:
BUY
NEXT
PREV
MENU`;
  } else if (input === "1" || input === "BUY") {
    const availableTickets = await getAvailableTickets(1, TICKETS_PER_PAGE);
    if (availableTickets.tickets.length === 0) {
      response = "No tickets available at the moment. Please try again later.";
    } else {
      response = `Available Tickets (Page ${availableTickets.pagination.page}/${availableTickets.pagination.totalPages})\n\n`;
      availableTickets.tickets.forEach((ticket) => {
        response += `${ticket.ticketNumber}\n`;
      });
      response +=
        "\nReply with the ticket number to reserve it.\nSend NEXT for more tickets.";
    }
  } else if (input === "NEXT" || input === "PREV") {
    const page = input === "NEXT" ? 2 : 1;
    const availableTickets = await getAvailableTickets(page, TICKETS_PER_PAGE);
    if (availableTickets.tickets.length === 0) {
      response = "No more tickets available on that page. Send BUY to restart.";
    } else {
      response = `Available Tickets (Page ${availableTickets.pagination.page}/${availableTickets.pagination.totalPages})\n\n`;
      availableTickets.tickets.forEach((ticket) => {
        response += `${ticket.ticketNumber}\n`;
      });
      response += "\nReply with the ticket number to reserve it.";
    }
  } else if (input === "2") {
    const nextDraw = await Draw.findOne({}).sort({ createdAt: -1 }).lean();
    response = nextDraw
      ? `Current draw: ${nextDraw.drawName}${nextDraw.drawDate ? `\nDate: ${formatDrawDate(new Date(nextDraw.drawDate))}` : ""}\nTicket Price: Rs.${nextDraw.ticketPrice}`
      : "No draw is configured yet.";
  } else if (input === "3" || input === "MY TICKETS") {
    const tickets = await getUserTickets(phoneNumber);
    if (tickets.length === 0) {
      response = "You do not have any reserved or sold tickets.";
    } else {
      response = "Your tickets:\n\n";
      for (const ticket of tickets) {
        const draw = ticket.drawId as {
          drawName?: string;
          drawDate?: Date;
        } | null;
        response += `${ticket.ticketNumber} - ${ticket.status.toUpperCase()}`;
        if (draw?.drawDate) {
          response += ` - ${formatDrawDate(new Date(draw.drawDate))}`;
        }
        response += "\n";
      }
    }
  } else if (TICKET_NUMBER_PATTERN.test(input)) {
    try {
      const ticket = await reserveTicket(input, phoneNumber);
      if (!ticket) {
        response =
          "Ticket not available or invalid. Please try another number.";
      } else {
        const draw = await Draw.findById(ticket.drawId).lean();
        const settings = await getPaymentSettings();
        const paymentLine = settings?.paymentInstructions
          ? `\nPayment Details: ${settings.paymentInstructions}\n`
          : "\n";
        response = `Ticket ${input} reserved for 5 minutes.

Ticket Price: Rs.${draw?.ticketPrice ?? "--"}
${paymentLine}
Complete payment using the QR code and send either:
1. Payment screenshot
2. UTR number`;
        const qrCodeUrl = settings?.qrCodeUrl || process.env.QR_CODE_URL;
        if (qrCodeUrl && !qrCodeUrl.startsWith("data:")) {
          responseMediaUrl = qrCodeUrl;
        }
      }
    } catch (error) {
      response =
        error instanceof Error
          ? error.message
          : "Ticket could not be reserved.";
    }
  } else if (mediaUrl || /^\d{10,20}$/.test(input)) {
    try {
      await createPaymentSubmission({
        phoneNumber,
        screenshotUrl: mediaUrl,
        utrNumber: /^\d{10,20}$/.test(input) ? input : undefined,
      });
      response =
        "Payment submitted for verification. You will receive confirmation once it is approved.";
    } catch (error) {
      response =
        error instanceof Error
          ? error.message
          : "Payment could not be submitted.";
    }
  } else {
    const reservedTicket = await getUserReservedTicket(phoneNumber);
    response = reservedTicket
      ? `You still have ticket ${reservedTicket.ticketNumber} reserved. Send payment screenshot or UTR number, or wait 5 minutes for expiry.`
      : "Invalid input. Send MENU to see available options.";
  }

  console.info("[whatsapp] twiml_reply", {
    to: replyTo,
    hasMedia: Boolean(responseMediaUrl),
    preview: response.slice(0, 120),
  });

  return {
    body: response,
    mediaUrl: responseMediaUrl,
  };
}

export async function sendConfirmation(
  phoneNumber: string,
  ticketNumber: string,
  drawDate?: Date,
) {
  const client = getTwilioClient();

  const messageLines = [
    "Payment verified.",
    "",
    `Your Ticket Number: ${ticketNumber}`,
    ...(drawDate ? [`Draw Date: ${formatDrawDate(drawDate)}`] : []),
    "",
    "Good luck!",
  ];
  const message = messageLines.join("\n");

  console.info("[whatsapp] confirmation_attempt", {
    to: `whatsapp:${phoneNumber}`,
    ticketNumber,
  });

  const result = await client.messages.create({
    body: message,
    from: fromNumber!,
    to: `whatsapp:${phoneNumber}`,
  });

  console.info("[whatsapp] confirmation_success", {
    sid: result.sid,
    status: result.status,
    to: result.to,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });
}
