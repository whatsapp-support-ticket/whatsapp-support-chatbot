'use client';

import { useState } from 'react';
import DashboardIntro from '@/components/admin/DashboardIntro';
import DashboardStats from '@/components/admin/DashboardStats';
import DrawEditorCard from '@/components/admin/DrawEditorCard';
import PaymentRecordsCard from '@/components/admin/PaymentRecordsCard';
import PaymentSettingsCard from '@/components/admin/PaymentSettingsCard';
import RecentTicketsCard from '@/components/admin/RecentTicketsCard';
import SavedDrawsCard from '@/components/admin/SavedDrawsCard';
import TicketManagerCard from '@/components/admin/TicketManagerCard';
import {
  emptyDrawForm,
  emptyPaymentForm,
  emptySettingsForm,
  emptyTicketForm,
} from '@/components/admin/state';
import type {
  DrawFormState,
  PaymentFilter,
  PaymentFormState,
  SettingsFormState,
  TicketFormState,
  TicketMode,
} from '@/components/admin/types';
import { useAdminDashboardData } from '@/components/admin/useAdminDashboardData';
import { useDrawActions } from '@/components/admin/useDrawActions';
import { usePaymentActions } from '@/components/admin/usePaymentActions';
import { useSettingsActions } from '@/components/admin/useSettingsActions';
import { useTicketActions } from '@/components/admin/useTicketActions';

export default function AdminDashboardClient() {
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [ticketMode, setTicketMode] = useState<TicketMode>('bulk');
  const [drawForm, setDrawForm] = useState<DrawFormState>(emptyDrawForm);
  const [ticketForm, setTicketForm] = useState<TicketFormState>(emptyTicketForm);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(emptySettingsForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [actionMessage, setActionMessage] = useState('');

  const {
    draws,
    tickets,
    payments,
    settings,
    isLoading,
    isError,
    error,
    refetch,
    stats,
  } = useAdminDashboardData();

  const { submitDraw, deleteDrawItem } = useDrawActions({
    drawForm,
    editingDrawId,
    refetch,
    setActionMessage,
    setDrawForm,
    setEditingDrawId,
    setTicketForm,
  });

  const { submitTickets, deleteTicketItem } = useTicketActions({
    editingTicketId,
    refetch,
    setActionMessage,
    setEditingTicketId,
    setTicketForm,
    setTicketMode,
    ticketForm,
    ticketMode,
  });

  const { submitSettings } = useSettingsActions({
    refetch,
    setActionMessage,
    settingsForm,
  });

  const { handleApprove, handleReject, submitPaymentUpdate, deletePaymentItem } = usePaymentActions({
    editingPaymentId,
    paymentForm,
    refetch,
    setActionMessage,
    setEditingPaymentId,
    setPaymentForm,
  });

  const filteredPayments = payments.filter((payment) =>
    paymentFilter === 'all' ? true : payment.status === paymentFilter
  );
  const qrPreviewSrc = settingsForm.qrCodeBase64.trim() || settingsForm.qrCodeUrl.trim() || settings?.qrCodeUrl || '';

  return (
    <div className="space-y-6">
      <DashboardIntro
        actionMessage={actionMessage}
        error={error}
        isError={isError}
        isLoading={isLoading}
      />

      <DashboardStats stats={stats} />

      <section className="grid gap-6 lg:grid-cols-2">
        <DrawEditorCard
          drawForm={drawForm}
          editingDrawId={editingDrawId}
          onCancel={() => {
            setEditingDrawId(null);
            setDrawForm(emptyDrawForm);
          }}
          onChange={setDrawForm}
          onSubmit={submitDraw}
        />

        <PaymentSettingsCard
          draws={draws}
          qrPreviewSrc={qrPreviewSrc}
          settings={settings}
          settingsForm={settingsForm}
          onChange={setSettingsForm}
          onSubmit={submitSettings}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TicketManagerCard
          draws={draws}
          editingTicketId={editingTicketId}
          ticketForm={ticketForm}
          ticketMode={ticketMode}
          onCancelEdit={() => {
            setEditingTicketId(null);
            setTicketMode('bulk');
            setTicketForm(emptyTicketForm);
          }}
          onChange={setTicketForm}
          onModeChange={(mode) => {
            setTicketMode(mode);
            setEditingTicketId(null);
            setTicketForm({
              drawId: ticketForm.drawId,
              prefix: '',
              count: '',
              ticketNumber: '',
            });
          }}
          onSubmit={submitTickets}
        />

        <SavedDrawsCard
          draws={draws}
          onDelete={deleteDrawItem}
          onEdit={(draw) => {
            setEditingDrawId(draw._id);
            setDrawForm({
              drawName: draw.drawName,
              ticketPrice: String(draw.ticketPrice),
            });
          }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RecentTicketsCard
          tickets={tickets}
          onDelete={deleteTicketItem}
          onEdit={(ticket) => {
            setEditingTicketId(ticket._id);
            setTicketMode('edit');
            setTicketForm({
              drawId: '',
              prefix: '',
              count: ticket.status,
              ticketNumber: ticket.ticketNumber,
            });
          }}
        />

        <PaymentRecordsCard
          editingPaymentId={editingPaymentId}
          filteredPayments={filteredPayments}
          paymentFilter={paymentFilter}
          paymentForm={paymentForm}
          onApprove={handleApprove}
          onCancelEdit={() => {
            setEditingPaymentId(null);
            setPaymentForm(emptyPaymentForm);
          }}
          onChange={setPaymentForm}
          onDelete={deletePaymentItem}
          onEdit={(payment) => {
            setEditingPaymentId(payment._id);
            setPaymentForm({
              phoneNumber: payment.phoneNumber,
              utrNumber: payment.utrNumber || '',
              screenshotUrl: payment.screenshotUrl || '',
            });
          }}
          onFilterChange={setPaymentFilter}
          onReject={handleReject}
          onSubmitEdit={submitPaymentUpdate}
        />
      </section>
    </div>
  );
}
