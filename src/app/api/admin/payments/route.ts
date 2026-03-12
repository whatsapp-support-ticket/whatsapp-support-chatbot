import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { getAdminPaymentQueue } from '@/services/paymentService';

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const data = await getAdminPaymentQueue();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get payments error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
