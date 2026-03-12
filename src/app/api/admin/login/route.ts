import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let password = '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      password = body.password;
    } else {
      const formData = await req.formData();
      password = String(formData.get('password') || '');
    }

    if (password !== ADMIN_PASSWORD) {
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      return NextResponse.redirect(new URL('/admin/login?error=Invalid%20credentials', req.url), {
        status: 303,
      });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const response = contentType.includes('application/json')
      ? NextResponse.json({ token })
      : NextResponse.redirect(new URL('/admin', req.url), { status: 303 });
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
