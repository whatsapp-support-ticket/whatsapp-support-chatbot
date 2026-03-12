import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function assertAdminRequest(request: NextRequest) {
  const token =
    request.cookies.get('admin-token')?.value ??
    request.cookies.get('token')?.value;

  const payload = token ? verifyToken(token) : null;

  if (!payload || payload.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}
