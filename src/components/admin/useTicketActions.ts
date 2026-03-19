'use client';

import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { emptyTicketForm } from '@/components/admin/state';
import { readJsonResponse } from '@/components/admin/api';
import type { TicketFormState, TicketMode } from '@/components/admin/types';

type UseTicketActionsParams = {
  editingTicketId: string | null;
  refetch: () => Promise<unknown>;
  setActionMessage: Dispatch<SetStateAction<string>>;
  setEditingTicketId: Dispatch<SetStateAction<string | null>>;
  setTicketForm: Dispatch<SetStateAction<TicketFormState>>;
  setTicketMode: Dispatch<SetStateAction<TicketMode>>;
  ticketForm: TicketFormState;
  ticketMode: TicketMode;
};

type TicketStatus = 'available' | 'reserved' | 'sold';

type MutationResponse = {
  success: boolean;
};

export function useTicketActions({
  editingTicketId,
  refetch,
  setActionMessage,
  setEditingTicketId,
  setTicketForm,
  setTicketMode,
  ticketForm,
  ticketMode,
}: UseTicketActionsParams) {
  async function submitTickets(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const isEdit = ticketMode === 'edit' && !!editingTicketId;
    const isSingleCreate = ticketMode === 'single';
    const endpoint = isEdit
      ? `/api/admin/tickets/${editingTicketId}`
      : isSingleCreate
        ? '/api/admin/tickets'
        : '/api/admin/tickets/generate';

    const res = await fetch(endpoint, {
      method: isEdit ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isEdit
          ? {
              ticketNumber: ticketForm.ticketNumber,
              status: ticketForm.count as TicketStatus,
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
              }
      ),
    });
    await readJsonResponse<MutationResponse>(
      res,
      isSingleCreate ? 'Could not create the ticket.' : 'Could not generate tickets.'
    );

    setTicketForm((current) => ({
      ...current,
      prefix: '',
      count: '',
      ticketNumber: '',
      drawId: current.drawId,
    }));
    setEditingTicketId(null);
    setTicketMode('bulk');
    setActionMessage(
      isEdit ? 'Ticket updated successfully.' : isSingleCreate ? 'Ticket created successfully.' : 'Tickets generated successfully.'
    );
    await refetch();
  }

  async function deleteTicketItem(ticketId: string) {
    setActionMessage('');

    const res = await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await readJsonResponse<MutationResponse>(res, 'Could not delete the ticket.');

    if (editingTicketId === ticketId) {
      setEditingTicketId(null);
      setTicketMode('bulk');
      setTicketForm(emptyTicketForm);
    }

    setActionMessage('Ticket deleted successfully.');
    await refetch();
  }

  return {
    submitTickets,
    deleteTicketItem,
  };
}
