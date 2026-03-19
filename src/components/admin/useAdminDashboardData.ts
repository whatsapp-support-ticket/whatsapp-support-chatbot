'use client';

import { useQuery } from '@tanstack/react-query';
import { readJsonResponse } from '@/components/admin/api';
import type { DashboardResponse, Draw, Payment, Settings, Ticket } from '@/components/admin/types';

type PaymentsResponse = {
  stats: DashboardResponse['stats'];
  payments: Payment[];
};

type DrawsResponse = {
  draws: Draw[];
};

type TicketsResponse = {
  tickets: Ticket[];
};

type SettingsResponse = {
  settings: Settings | null;
};

export function useAdminDashboardData() {
  const query = useQuery<DashboardResponse>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [paymentsRes, drawsRes, ticketsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/payments', { credentials: 'include' }),
        fetch('/api/admin/draws', { credentials: 'include' }),
        fetch('/api/admin/tickets', { credentials: 'include' }),
        fetch('/api/admin/settings', { credentials: 'include' }),
      ]);

      const [paymentsJson, drawsJson, ticketsJson, settingsJson] = await Promise.all([
        readJsonResponse<PaymentsResponse>(paymentsRes, 'Failed to load payments'),
        readJsonResponse<DrawsResponse>(drawsRes, 'Failed to load draws'),
        readJsonResponse<TicketsResponse>(ticketsRes, 'Failed to load tickets'),
        readJsonResponse<SettingsResponse>(settingsRes, 'Failed to load settings'),
      ]);

      return {
        stats: paymentsJson.stats,
        payments: paymentsJson.payments,
        draws: drawsJson.draws,
        tickets: ticketsJson.tickets,
        settings: settingsJson.settings,
      };
    },
  });

  return {
    ...query,
    draws: query.data?.draws ?? [],
    tickets: query.data?.tickets ?? [],
    payments: query.data?.payments ?? [],
    settings: query.data?.settings,
    stats: query.data?.stats,
  };
}
