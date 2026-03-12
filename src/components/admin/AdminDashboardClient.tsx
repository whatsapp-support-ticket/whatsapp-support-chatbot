'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

interface Draw {
  _id: string;
  drawName: string;
  drawDate: string;
  ticketPrice: number;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  status: 'available' | 'reserved' | 'sold';
  reservedBy?: string;
  soldTo?: string;
}

interface Payment {
  _id: string;
  phoneNumber: string;
  ticketNumber: string;
  screenshotUrl?: string;
  utrNumber?: string;
  status: string;
}

interface Settings {
  qrCodeUrl?: string;
  paymentInstructions?: string;
  activeDrawId?: string;
}

interface DashboardResponse {
  stats: {
    availableTickets: number;
    reservedTickets: number;
    soldTickets: number;
    pendingPayments: number;
  };
  draws: Draw[];
  tickets: Ticket[];
  payments: Payment[];
  settings: Settings | null;
}

export default function AdminDashboardClient() {
  const [drawForm, setDrawForm] = useState({
    drawName: '',
    drawDate: '',
    ticketPrice: '',
  });
  const [ticketForm, setTicketForm] = useState({
    drawId: '',
    prefix: '',
    count: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    activeDrawId: '',
    paymentInstructions: '',
    qrCodeUrl: '',
    qrCodeBase64: '',
    qrCodeFile: null as File | null,
  });
  const [actionMessage, setActionMessage] = useState('');

  const { data, refetch, isLoading, isError, error } = useQuery<DashboardResponse>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [paymentsRes, drawsRes, ticketsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/payments', { credentials: 'include' }),
        fetch('/api/admin/draws', { credentials: 'include' }),
        fetch('/api/admin/tickets', { credentials: 'include' }),
        fetch('/api/admin/settings', { credentials: 'include' }),
      ]);

      const paymentsJson = await paymentsRes.json();
      const drawsJson = await drawsRes.json();
      const ticketsJson = await ticketsRes.json();
      const settingsJson = await settingsRes.json();

      if (!paymentsRes.ok) throw new Error(paymentsJson.error || 'Failed to load payments');
      if (!drawsRes.ok) throw new Error(drawsJson.error || 'Failed to load draws');
      if (!ticketsRes.ok) throw new Error(ticketsJson.error || 'Failed to load tickets');
      if (!settingsRes.ok) throw new Error(settingsJson.error || 'Failed to load settings');

      return {
        stats: paymentsJson.stats,
        payments: paymentsJson.payments,
        draws: drawsJson.draws,
        tickets: ticketsJson.tickets,
        settings: settingsJson.settings,
      };
    },
  });

  async function submitDraw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const res = await fetch('/api/admin/draws', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drawForm),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Failed to create draw');
      return;
    }

    setDrawForm({ drawName: '', drawDate: '', ticketPrice: '' });
    setTicketForm((current) => ({ ...current, drawId: json.draw._id }));
    setActionMessage('Draw created.');
    refetch();
  }

  async function submitTickets(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const res = await fetch('/api/admin/tickets/generate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drawId: ticketForm.drawId,
        prefix: ticketForm.prefix,
        count: Number(ticketForm.count),
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Failed to generate tickets');
      return;
    }

    setTicketForm((current) => ({ ...current, prefix: '', count: '' }));
    setActionMessage('Tickets generated.');
    refetch();
  }

  async function submitSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const formData = new FormData();
    formData.set('activeDrawId', settingsForm.activeDrawId);
    formData.set('paymentInstructions', settingsForm.paymentInstructions);
    formData.set('qrCodeUrl', settingsForm.qrCodeUrl);
    formData.set('qrCodeBase64', settingsForm.qrCodeBase64);
    if (settingsForm.qrCodeFile) {
      formData.set('qrCodeFile', settingsForm.qrCodeFile);
    }

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Failed to update payment settings');
      return;
    }

    setActionMessage(json.message || 'Payment settings updated.');
    refetch();
  }

  async function handleApprove(paymentId: string) {
    const res = await fetch('/api/admin/payments/approve', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Approval failed');
      return;
    }

    setActionMessage('Payment approved and ticket booked.');
    refetch();
  }

  async function handleReject(paymentId: string) {
    const res = await fetch('/api/admin/payments/reject', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Rejection failed');
      return;
    }

    setActionMessage('Payment rejected and ticket released.');
    refetch();
  }

  const draws = data?.draws ?? [];
  const tickets = data?.tickets ?? [];
  const payments = data?.payments ?? [];
  const settings = data?.settings;
  const qrPreviewSrc = settingsForm.qrCodeBase64.trim() || settingsForm.qrCodeUrl.trim() || settings?.qrCodeUrl || '';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">WhatsApp Ticket Sales Admin</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create draws, generate tickets, upload the payment QR code, and verify payment screenshots.
        </p>
        {actionMessage ? <p className="mt-3 text-sm text-green-700">{actionMessage}</p> : null}
        {isError ? (
          <p className="mt-3 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Dashboard load failed'}
          </p>
        ) : null}
        {isLoading ? <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending payments" value={data?.stats.pendingPayments ?? 0} />
        <StatCard label="Available tickets" value={data?.stats.availableTickets ?? 0} />
        <StatCard label="Reserved tickets" value={data?.stats.reservedTickets ?? 0} />
        <StatCard label="Sold tickets" value={data?.stats.soldTickets ?? 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Create Draw">
          <form className="space-y-3" onSubmit={submitDraw}>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Draw name" value={drawForm.drawName} onChange={(e) => setDrawForm((c) => ({ ...c, drawName: e.target.value }))} />
            <input type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={drawForm.drawDate} onChange={(e) => setDrawForm((c) => ({ ...c, drawDate: e.target.value }))} />
            <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Ticket price" value={drawForm.ticketPrice} onChange={(e) => setDrawForm((c) => ({ ...c, ticketPrice: e.target.value }))} />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">Create draw</button>
          </form>
        </Card>

        <Card title="Payment QR Setup">
          <form className="space-y-3" onSubmit={submitSettings}>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={settingsForm.activeDrawId || settings?.activeDrawId || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, activeDrawId: e.target.value }))}>
              <option value="">Select active draw</option>
              {draws.map((draw) => (
                <option key={draw._id} value={draw._id}>{draw.drawName}</option>
              ))}
            </select>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Payment instructions" rows={3} defaultValue={settings?.paymentInstructions || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, paymentInstructions: e.target.value }))} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="QR code image URL" defaultValue={settings?.qrCodeUrl || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeUrl: e.target.value }))} />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-950"
              placeholder="Paste QR base64 here. Supports either data:image/png;base64,... or raw base64."
              rows={5}
              value={settingsForm.qrCodeBase64}
              onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeBase64: e.target.value }))}
            />
            <input type="file" accept="image/*" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeFile: e.target.files?.[0] ?? null }))} />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">Save payment settings</button>
            {qrPreviewSrc ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-200">
                <Image src={qrPreviewSrc} alt="QR code preview" fill className="object-cover" unoptimized />
              </div>
            ) : null}
          </form>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Generate Tickets">
          <form className="space-y-3" onSubmit={submitTickets}>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={ticketForm.drawId} onChange={(e) => setTicketForm((c) => ({ ...c, drawId: e.target.value }))}>
              <option value="">Select draw</option>
              {draws.map((draw) => (
                <option key={draw._id} value={draw._id}>{draw.drawName}</option>
              ))}
            </select>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Prefix, e.g. A" value={ticketForm.prefix} onChange={(e) => setTicketForm((c) => ({ ...c, prefix: e.target.value.toUpperCase() }))} />
            <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Ticket count" value={ticketForm.count} onChange={(e) => setTicketForm((c) => ({ ...c, count: e.target.value }))} />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">Generate tickets</button>
          </form>
        </Card>

        <Card title="Draws">
          <div className="space-y-3 text-sm text-gray-700">
            {draws.map((draw) => (
              <div key={draw._id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{draw.drawName}</p>
                <p>{new Date(draw.drawDate).toLocaleString()}</p>
                <p>Price: Rs.{draw.ticketPrice}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Tickets">
          <div className="space-y-3 text-sm">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{ticket.ticketNumber}</p>
                <p className='text-gray-950'>Status: {ticket.status}</p>
                {ticket.reservedBy ? <p>Reserved by: {ticket.reservedBy}</p> : null}
                {ticket.soldTo ? <p>Sold to: {ticket.soldTo}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Payment Verification">
          <div className="space-y-3 text-sm">
            {payments.map((payment) => (
              <div key={payment._id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{payment.ticketNumber}</p>
                <p className='text-gray-950'>Phone: {payment.phoneNumber}</p>
                <p className='text-gray-950'>Status: {payment.status}</p>
                {payment.utrNumber ? <p className='text-gray-950'>UTR: {payment.utrNumber}</p> : null}
                {payment.screenshotUrl ? (
                  <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg">
                    <Image src={payment.screenshotUrl} alt="Payment screenshot" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                {payment.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => handleApprove(payment._id)} className="rounded-lg bg-green-600 px-4 py-2 text-white">Approve</button>
                    <button type="button" onClick={() => handleReject(payment._id)} className="rounded-lg bg-red-600 px-4 py-2 text-white">Reject</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
