import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { fileToDataUri, uploadBase64ToCloudinary, uploadToCloudinary } from '@/lib/cloudinary';
import { getPaymentSettings, upsertPaymentSettings } from '@/services/adminService';

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const settings = await getPaymentSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Admin settings fetch error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const formData = await req.formData();
    const activeDrawId = String(formData.get('activeDrawId') ?? '');
    const paymentInstructions = String(formData.get('paymentInstructions') ?? '');
    const qrCodeUrlInput = String(formData.get('qrCodeUrl') ?? '');
    const qrCodeBase64 = String(formData.get('qrCodeBase64') ?? '');
    const qrCodeFile = formData.get('qrCodeFile');

    let qrCodeUrl = qrCodeUrlInput || undefined;
    let uploadFallbackUsed = false;

    if (qrCodeBase64) {
      try {
        qrCodeUrl = await uploadBase64ToCloudinary(qrCodeBase64, 'lottery-qr-codes');
      } catch (error) {
        console.warn('Cloudinary QR upload failed, storing base64 directly for local testing:', error);
        qrCodeUrl = qrCodeBase64.trim();
        uploadFallbackUsed = true;
      }
    } else if (qrCodeFile instanceof File && qrCodeFile.size > 0) {
      try {
        qrCodeUrl = await uploadToCloudinary(qrCodeFile, 'lottery-qr-codes');
      } catch (error) {
        console.warn('Cloudinary QR upload failed, storing file as data URI for local testing:', error);
        qrCodeUrl = await fileToDataUri(qrCodeFile);
        uploadFallbackUsed = true;
      }
    }

    const settings = await upsertPaymentSettings({
      activeDrawId,
      paymentInstructions,
      qrCodeUrl,
    });

    return NextResponse.json({
      success: true,
      settings,
      uploadFallbackUsed,
      message: uploadFallbackUsed
        ? 'QR saved locally as a data URI because Cloudinary upload failed. This works for dashboard preview/testing, but Twilio media requires a public URL.'
        : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.startsWith('QR upload failed:')
          ? 502
          : 500;
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
