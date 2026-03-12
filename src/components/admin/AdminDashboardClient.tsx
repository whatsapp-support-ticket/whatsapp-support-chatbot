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
  createdAt?: string;
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
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [ticketMode, setTicketMode] = useState<'bulk' | 'single' | 'edit'>('bulk');
  const [drawForm, setDrawForm] = useState({
    drawName: '',
    drawDate: '',
    ticketPrice: '',
  });
  const [ticketForm, setTicketForm] = useState({
    drawId: '',
    prefix: '',
    count: '',
    ticketNumber: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    activeDrawId: '',
    paymentInstructions: '',
    qrCodeUrl: '',
    qrCodeBase64: '',
    qrCodeFile: null as File | null,
  });
  const [paymentForm, setPaymentForm] = useState({
    phoneNumber: '',
    utrNumber: '',
    screenshotUrl: '',
  });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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

    const res = await fetch(editingDrawId ? `/api/admin/draws/${editingDrawId}` : '/api/admin/draws', {
      method: editingDrawId ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drawForm),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Could not save the draw.');
      return;
    }

    setDrawForm({ drawName: '', drawDate: '', ticketPrice: '' });
    setEditingDrawId(null);
    setTicketForm((current) => ({ ...current, drawId: json.draw._id }));
    setActionMessage(editingDrawId ? 'Draw updated successfully.' : 'Draw created successfully.');
    refetch();
  }

  async function submitTickets(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const isEdit = ticketMode === 'edit' && !!editingTicketId;
    const isSingleCreate = ticketMode === 'single';
    const endpoint = isEdit
      ? `/api/admin/tickets/${editingTicketId}`
      : isSingleCreate
        ? '/api/admin/tickets'
        : '/api/admin/tickets/generate';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(isEdit
          ? {
              ticketNumber: ticketForm.ticketNumber,
              status: ticketForm.count as 'available' | 'reserved' | 'sold',
            }
          : isSingleCreate
            ? {
                drawId: ticketForm.drawId,
                ticketNumber: ticketForm.ticketNumber,
              }
          : {
              drawId: ticketForm.drawId,
              prefix: ticketForm.prefix,
              count: Number(ticketForm.count),
            }),
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || (isSingleCreate ? 'Could not create the ticket.' : 'Could not generate tickets.'));
      return;
    }

    setTicketForm((current) => ({
      ...current,
      prefix: '',
      count: '',
      ticketNumber: '',
      drawId: isEdit ? current.drawId : current.drawId,
    }));
    setEditingTicketId(null);
    setTicketMode('bulk');
    setActionMessage(
      isEdit ? 'Ticket updated successfully.' : isSingleCreate ? 'Ticket created successfully.' : 'Tickets generated successfully.'
    );
    refetch();
  }

  async function deleteDrawItem(drawId: string) {
    const res = await fetch(`/api/admin/draws/${drawId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Could not delete the draw.');
      return;
    }

    if (editingDrawId === drawId) {
      setEditingDrawId(null);
      setDrawForm({ drawName: '', drawDate: '', ticketPrice: '' });
    }

    setActionMessage('Draw deleted successfully.');
    refetch();
  }

  async function deleteTicketItem(ticketId: string) {
    const res = await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Could not delete the ticket.');
      return;
    }

    if (editingTicketId === ticketId) {
      setEditingTicketId(null);
      setTicketMode('bulk');
      setTicketForm({ drawId: '', prefix: '', count: '', ticketNumber: '' });
    }

    setActionMessage('Ticket deleted successfully.');
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
      setActionMessage(json.error || 'Could not save payment settings.');
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
      setActionMessage(json.error || 'Could not approve this payment.');
      return;
    }

    setActionMessage('Payment approved and ticket marked as booked.');
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
      setActionMessage(json.error || 'Could not reject this payment.');
      return;
    }

    setActionMessage('Payment rejected and ticket released.');
    refetch();
  }

  async function submitPaymentUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPaymentId) {
      return;
    }

    setActionMessage('');

    const res = await fetch(`/api/admin/payments/${editingPaymentId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentForm),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Could not update the payment record.');
      return;
    }

    setEditingPaymentId(null);
    setPaymentForm({ phoneNumber: '', utrNumber: '', screenshotUrl: '' });
    setActionMessage('Payment updated successfully.');
    refetch();
  }

  async function deletePaymentItem(paymentId: string) {
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok) {
      setActionMessage(json.error || 'Could not delete the payment record.');
      return;
    }

    if (editingPaymentId === paymentId) {
      setEditingPaymentId(null);
      setPaymentForm({ phoneNumber: '', utrNumber: '', screenshotUrl: '' });
    }

    setActionMessage('Payment deleted successfully.');
    refetch();
  }

  const draws = data?.draws ?? [];
  const tickets = data?.tickets ?? [];
  const payments = data?.payments ?? [];
  const settings = data?.settings;
  const filteredPayments = payments.filter((payment) =>
    paymentFilter === 'all' ? true : payment.status === paymentFilter
  );
  const qrPreviewSrc = settingsForm.qrCodeBase64.trim() || settingsForm.qrCodeUrl.trim() || settings?.qrCodeUrl || '';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Lottery Booking Admin</h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage draws, tickets, payment QR settings, and customer payment verification from one place.
        </p>
        {actionMessage ? <p className="mt-3 text-sm text-green-700">{actionMessage}</p> : null}
        {isError ? (
          <p className="mt-3 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Dashboard load failed'}
          </p>
        ) : null}
        {isLoading ? <p className="mt-3 text-sm text-gray-500">Loading dashboard data...</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending payments" value={data?.stats.pendingPayments ?? 0} />
        <StatCard label="Available tickets" value={data?.stats.availableTickets ?? 0} />
        <StatCard label="Reserved tickets" value={data?.stats.reservedTickets ?? 0} />
        <StatCard label="Sold tickets" value={data?.stats.soldTickets ?? 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Draw Details">
          <form className="space-y-3" onSubmit={submitDraw}>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Draw name" value={drawForm.drawName} onChange={(e) => setDrawForm((c) => ({ ...c, drawName: e.target.value }))} />
            <input type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={drawForm.drawDate} onChange={(e) => setDrawForm((c) => ({ ...c, drawDate: e.target.value }))} />
            <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Ticket price in rupees" value={drawForm.ticketPrice} onChange={(e) => setDrawForm((c) => ({ ...c, ticketPrice: e.target.value }))} />
            <div className="flex gap-2">
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">
                {editingDrawId ? 'Save changes' : 'Create draw'}
              </button>
              {editingDrawId ? (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                  onClick={() => {
                    setEditingDrawId(null);
                    setDrawForm({ drawName: '', drawDate: '', ticketPrice: '' });
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card title="Payment QR Setup">
          <form className="space-y-3" onSubmit={submitSettings}>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={settingsForm.activeDrawId || settings?.activeDrawId || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, activeDrawId: e.target.value }))}>
              <option value="">Choose the active draw</option>
              {draws.map((draw) => (
                <option key={draw._id} value={draw._id}>{draw.drawName}</option>
              ))}
            </select>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Payment instructions shown to customers" rows={3} defaultValue={settings?.paymentInstructions || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, paymentInstructions: e.target.value }))} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Public QR image URL" defaultValue={settings?.qrCodeUrl || ''} onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeUrl: e.target.value }))} />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-950"
              placeholder="Paste QR base64 here. Supports a full data URI or raw base64."
              rows={5}
              value={settingsForm.qrCodeBase64}
              onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeBase64: e.target.value }))}
            />
            <input type="file" accept="image/*" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" onChange={(e) => setSettingsForm((c) => ({ ...c, qrCodeFile: e.target.files?.[0] ?? null }))} />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">Save QR settings</button>
            {qrPreviewSrc ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-200">
                <Image src={qrPreviewSrc} alt="QR code preview" fill className="object-cover" unoptimized />
              </div>
            ) : null}
          </form>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Ticket Manager">
          <form className="space-y-3" onSubmit={submitTickets}>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 ${ticketMode === 'bulk' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-900'}`}
                onClick={() => {
                  setTicketMode('bulk');
                  setEditingTicketId(null);
                  setTicketForm({ drawId: ticketForm.drawId, prefix: '', count: '', ticketNumber: '' });
                }}
              >
                Bulk create
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 ${ticketMode === 'single' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-900'}`}
                onClick={() => {
                  setTicketMode('single');
                  setEditingTicketId(null);
                  setTicketForm({ drawId: ticketForm.drawId, prefix: '', count: '', ticketNumber: '' });
                }}
              >
                Single ticket
              </button>
            </div>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={ticketForm.drawId} onChange={(e) => setTicketForm((c) => ({ ...c, drawId: e.target.value }))}>
              <option value="">Choose a draw</option>
              {draws.map((draw) => (
                <option key={draw._id} value={draw._id}>{draw.drawName}</option>
              ))}
            </select>
            {ticketMode === 'edit' ? (
              <>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
                  placeholder="Ticket number, for example A001"
                  value={ticketForm.ticketNumber}
                  onChange={(e) => setTicketForm((c) => ({ ...c, ticketNumber: e.target.value.toUpperCase() }))}
                />
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" value={ticketForm.count} onChange={(e) => setTicketForm((c) => ({ ...c, count: e.target.value }))}>
                  <option value="">Choose status</option>
                  <option value="available">available</option>
                  <option value="reserved">reserved</option>
                  <option value="sold">sold</option>
                </select>
              </>
            ) : ticketMode === 'single' ? (
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
                placeholder="Ticket number, for example A001"
                value={ticketForm.ticketNumber}
                onChange={(e) => setTicketForm((c) => ({ ...c, ticketNumber: e.target.value.toUpperCase() }))}
              />
            ) : (
              <>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="Ticket prefix, for example A" value={ticketForm.prefix} onChange={(e) => setTicketForm((c) => ({ ...c, prefix: e.target.value.toUpperCase() }))} />
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950" placeholder="How many tickets to generate" value={ticketForm.count} onChange={(e) => setTicketForm((c) => ({ ...c, count: e.target.value }))} />
              </>
            )}
            <div className="flex gap-2">
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">
                {ticketMode === 'edit' ? 'Save ticket' : ticketMode === 'single' ? 'Create ticket' : 'Generate tickets'}
              </button>
              {ticketMode === 'edit' ? (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                  onClick={() => {
                    setEditingTicketId(null);
                    setTicketMode('bulk');
                    setTicketForm({ drawId: '', prefix: '', count: '', ticketNumber: '' });
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card title="Saved Draws">
          <div className="space-y-3 text-sm text-gray-700">
            {draws.map((draw) => (
              <div key={draw._id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{draw.drawName}</p>
                <p>{new Date(draw.drawDate).toLocaleString()}</p>
                <p>Price: Rs. {draw.ticketPrice}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                    onClick={() => {
                      setEditingDrawId(draw._id);
                      setDrawForm({
                        drawName: draw.drawName,
                        drawDate: new Date(draw.drawDate).toISOString().slice(0, 16),
                        ticketPrice: String(draw.ticketPrice),
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1 text-white"
                    onClick={() => deleteDrawItem(draw._id)}
                  >
                    Delete
                  </button>
                </div>
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
                {ticket.soldTo ? <p>Booked by: {ticket.soldTo}</p> : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                    onClick={() => {
                      setEditingTicketId(ticket._id);
                      setTicketMode('edit');
                      setTicketForm({
                        drawId: '',
                        prefix: '',
                        count: ticket.status,
                        ticketNumber: ticket.ticketNumber,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1 text-white"
                    onClick={() => deleteTicketItem(ticket._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Payment Records">
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`rounded-lg px-3 py-2 ${
                    paymentFilter === status
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-900'
                  }`}
                  onClick={() => setPaymentFilter(status)}
                >
                  {status[0].toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            {editingPaymentId ? (
              <form className="space-y-3 rounded-lg border border-gray-200 p-3" onSubmit={submitPaymentUpdate}>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
                  placeholder="Customer phone number"
                  value={paymentForm.phoneNumber}
                  onChange={(e) => setPaymentForm((c) => ({ ...c, phoneNumber: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
                  placeholder="UTR / reference number"
                  value={paymentForm.utrNumber}
                  onChange={(e) => setPaymentForm((c) => ({ ...c, utrNumber: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
                  placeholder="Screenshot URL"
                  value={paymentForm.screenshotUrl}
                  onChange={(e) => setPaymentForm((c) => ({ ...c, screenshotUrl: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-white">
                    Save payment
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                    onClick={() => {
                      setEditingPaymentId(null);
                      setPaymentForm({ phoneNumber: '', utrNumber: '', screenshotUrl: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
            {filteredPayments.length === 0 ? (
              <p className="text-gray-500">No payment records found for this filter.</p>
            ) : null}
            {filteredPayments.map((payment) => (
              <div key={payment._id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{payment.ticketNumber}</p>
                <p className='text-gray-950'>Customer: {payment.phoneNumber}</p>
                <p className='text-gray-950'>Status: {payment.status}</p>
                {payment.utrNumber ? <p className='text-gray-950'>UTR: {payment.utrNumber}</p> : null}
                {payment.screenshotUrl ? (
                  <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg">
                    <Image src={payment.screenshotUrl} alt="Payment screenshot" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                {payment.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => handleApprove(payment._id)} className="rounded-lg bg-green-600 px-4 py-2 text-white">Approve payment</button>
                    <button type="button" onClick={() => handleReject(payment._id)} className="rounded-lg bg-red-600 px-4 py-2 text-white">Reject payment</button>
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                    onClick={() => {
                      setEditingPaymentId(payment._id);
                      setPaymentForm({
                        phoneNumber: payment.phoneNumber,
                        utrNumber: payment.utrNumber || '',
                        screenshotUrl: payment.screenshotUrl || '',
                      });
                    }}
                  >
                    Edit
                  </button>
                  {payment.status !== 'approved' ? (
                    <button
                      type="button"
                      className="rounded-lg bg-red-600 px-3 py-1 text-white"
                      onClick={() => deletePaymentItem(payment._id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
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
