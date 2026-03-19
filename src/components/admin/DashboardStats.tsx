import AdminStatCard from '@/components/admin/AdminStatCard';
import type { DashboardResponse } from '@/components/admin/types';

export default function DashboardStats({
  stats,
}: {
  stats: DashboardResponse['stats'] | undefined;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <AdminStatCard label="Pending payments" value={stats?.pendingPayments ?? 0} />
      <AdminStatCard label="Available tickets" value={stats?.availableTickets ?? 0} />
      <AdminStatCard label="Reserved tickets" value={stats?.reservedTickets ?? 0} />
      <AdminStatCard label="Sold tickets" value={stats?.soldTickets ?? 0} />
    </section>
  );
}
