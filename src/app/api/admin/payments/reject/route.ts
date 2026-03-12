import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { rejectPayment } from '@/services/paymentService';

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const { paymentId } = await req.json();
    await rejectPayment(paymentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
