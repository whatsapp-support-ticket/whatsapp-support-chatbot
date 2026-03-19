'use client';

import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { emptyDrawForm } from '@/components/admin/state';
import { readJsonResponse } from '@/components/admin/api';
import type { DrawFormState, TicketFormState } from '@/components/admin/types';

type UseDrawActionsParams = {
  drawForm: DrawFormState;
  editingDrawId: string | null;
  refetch: () => Promise<unknown>;
  setActionMessage: Dispatch<SetStateAction<string>>;
  setDrawForm: Dispatch<SetStateAction<DrawFormState>>;
  setEditingDrawId: Dispatch<SetStateAction<string | null>>;
  setTicketForm: Dispatch<SetStateAction<TicketFormState>>;
};

type DrawMutationResponse = {
  draw: {
    _id: string;
  };
};

type DeleteResponse = {
  success: boolean;
};

export function useDrawActions({
  drawForm,
  editingDrawId,
  refetch,
  setActionMessage,
  setDrawForm,
  setEditingDrawId,
  setTicketForm,
}: UseDrawActionsParams) {
  async function submitDraw(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const res = await fetch(editingDrawId ? `/api/admin/draws/${editingDrawId}` : '/api/admin/draws', {
      method: editingDrawId ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drawForm),
    });
    const json = await readJsonResponse<DrawMutationResponse>(res, 'Could not save the draw.');

    setDrawForm(emptyDrawForm);
    setEditingDrawId(null);
    setTicketForm((current) => ({ ...current, drawId: json.draw._id }));
    setActionMessage(editingDrawId ? 'Draw updated successfully.' : 'Draw created successfully.');
    await refetch();
  }

  async function deleteDrawItem(drawId: string) {
    setActionMessage('');

    const res = await fetch(`/api/admin/draws/${drawId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await readJsonResponse<DeleteResponse>(res, 'Could not delete the draw.');

    if (editingDrawId === drawId) {
      setEditingDrawId(null);
      setDrawForm(emptyDrawForm);
    }

    setActionMessage('Draw deleted successfully.');
    await refetch();
  }

  return {
    submitDraw,
    deleteDrawItem,
  };
}
