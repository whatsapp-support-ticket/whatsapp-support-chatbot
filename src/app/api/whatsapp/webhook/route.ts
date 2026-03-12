import { NextRequest, NextResponse } from 'next/server';
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

    await handleWhatsAppMessage(from, messageBody, mediaUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}