import { NextRequest } from 'next/server';
import twilio from 'twilio';
import { handleWhatsAppMessage } from '@/services/whatsappService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const from = params.get('From')!;
    const messageBody = params.get('Body')!;
    const numMedia = parseInt(params.get('NumMedia') || '0');
    let mediaUrl: string | undefined;

    if (numMedia > 0) {
      mediaUrl = params.get('MediaUrl0')!;
    }

    console.info('[webhook] request', {
      from,
      body: messageBody,
      numMedia,
      hasMedia: Boolean(mediaUrl),
    });

    const reply = await handleWhatsAppMessage(from, messageBody, mediaUrl);
    const twiml = new twilio.twiml.MessagingResponse();
    const message = twiml.message(reply.body);

    if (reply.mediaUrl && !reply.mediaUrl.startsWith('data:')) {
      message.media(reply.mediaUrl);
    }

    console.info('[webhook] twiml_response', {
      to: from,
      hasMedia: Boolean(reply.mediaUrl && !reply.mediaUrl.startsWith('data:')),
      preview: reply.body.slice(0, 120),
    });

    return new Response(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Something went wrong. Please try again in a moment.');
    return new Response(twiml.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}
