import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import { verifyToken } from '@/lib/auth';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('admin-token')?.value ??
    cookieStore.get('token')?.value;

  if (!token || verifyToken(token)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return <AdminDashboardClient />;
}
