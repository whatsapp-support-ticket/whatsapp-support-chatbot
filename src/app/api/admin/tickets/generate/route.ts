import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { generateTicketsForDraw } from '@/services/adminService';

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const { drawId, prefix, count } = await req.json();

    if (!drawId || !prefix || !count) {
      return NextResponse.json({ error: 'drawId, prefix and count are required' }, { status: 400 });
    }

    await generateTicketsForDraw({
      drawId,
      prefix: String(prefix).trim().toUpperCase(),
      count: Number(count),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
