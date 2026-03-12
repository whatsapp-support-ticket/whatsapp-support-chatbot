import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { deletePayment, updatePayment } from '@/services/paymentService';

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { paymentId } = await context.params;
    const { phoneNumber, utrNumber, screenshotUrl } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    const payment = await updatePayment(paymentId, {
      phoneNumber,
      utrNumber,
      screenshotUrl,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : message === 'Payment not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    assertAdminRequest(req);
    const { paymentId } = await context.params;
    await deletePayment(paymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Payment not found'
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
