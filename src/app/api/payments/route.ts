import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSubmission } from '@/services/paymentService';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const phoneNumber = formData.get('phoneNumber') as string;
    const ticketNumber = (formData.get('ticketNumber') as string) || undefined;
    const utrNumber = formData.get('utrNumber') as string;
    const screenshot = formData.get('screenshot') as File;

    let screenshotUrl: string | undefined;

    if (screenshot) {
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'lottery-payments' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        ).end(buffer);
      });
      screenshotUrl = uploadResult.secure_url;
    }

    const payment = await createPaymentSubmission({
      phoneNumber,
      ticketNumber,
      screenshotUrl,
      utrNumber,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Payment submission error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
