'use client';

import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { emptyPaymentForm } from '@/components/admin/state';
import { readJsonResponse } from '@/components/admin/api';
import type { PaymentFormState } from '@/components/admin/types';

type UsePaymentActionsParams = {
  editingPaymentId: string | null;
  paymentForm: PaymentFormState;
  refetch: () => Promise<unknown>;
  setActionMessage: Dispatch<SetStateAction<string>>;
  setEditingPaymentId: Dispatch<SetStateAction<string | null>>;
  setPaymentForm: Dispatch<SetStateAction<PaymentFormState>>;
};

type MutationResponse = {
  success: boolean;
};

type PaymentMutationResponse = MutationResponse & {
  error?: string;
};

export function usePaymentActions({
  editingPaymentId,
  paymentForm,
  refetch,
  setActionMessage,
  setEditingPaymentId,
  setPaymentForm,
}: UsePaymentActionsParams) {
  async function handleApprove(paymentId: string) {
    setActionMessage('');

    const res = await fetch('/api/admin/payments/approve', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    await readJsonResponse<PaymentMutationResponse>(res, 'Could not approve this payment.');

    setActionMessage('Payment approved and ticket marked as booked.');
    await refetch();
  }

  async function handleReject(paymentId: string) {
    setActionMessage('');

    const res = await fetch('/api/admin/payments/reject', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    await readJsonResponse<PaymentMutationResponse>(res, 'Could not reject this payment.');

    setActionMessage('Payment rejected and ticket released.');
    await refetch();
  }

  async function submitPaymentUpdate(e: SyntheticEvent<HTMLFormElement>) {
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
    await readJsonResponse<PaymentMutationResponse>(res, 'Could not update the payment record.');

    setEditingPaymentId(null);
    setPaymentForm(emptyPaymentForm);
    setActionMessage('Payment updated successfully.');
    await refetch();
  }

  async function deletePaymentItem(paymentId: string) {
    setActionMessage('');

    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await readJsonResponse<PaymentMutationResponse>(res, 'Could not delete the payment record.');

    if (editingPaymentId === paymentId) {
      setEditingPaymentId(null);
      setPaymentForm(emptyPaymentForm);
    }

    setActionMessage('Payment deleted successfully.');
    await refetch();
  }

  return {
    handleApprove,
    handleReject,
    submitPaymentUpdate,
    deletePaymentItem,
  };
}
