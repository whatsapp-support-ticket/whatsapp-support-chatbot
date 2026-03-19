import Image from 'next/image';
import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import type { Payment, PaymentFilter, PaymentFormState } from '@/components/admin/types';

type PaymentRecordsCardProps = {
  editingPaymentId: string | null;
  filteredPayments: Payment[];
  paymentFilter: PaymentFilter;
  paymentForm: PaymentFormState;
  onApprove: (paymentId: string) => void;
  onCancelEdit: () => void;
  onChange: Dispatch<SetStateAction<PaymentFormState>>;
  onDelete: (paymentId: string) => void;
  onEdit: (payment: Payment) => void;
  onFilterChange: (filter: PaymentFilter) => void;
  onReject: (paymentId: string) => void;
  onSubmitEdit: (e: SyntheticEvent<HTMLFormElement>) => void;
};

export default function PaymentRecordsCard({
  editingPaymentId,
  filteredPayments,
  paymentFilter,
  paymentForm,
  onApprove,
  onCancelEdit,
  onChange,
  onDelete,
  onEdit,
  onFilterChange,
  onReject,
  onSubmitEdit,
}: PaymentRecordsCardProps) {
  return (
    <AdminCard title="Payment Records">
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
              onClick={() => onFilterChange(status)}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {editingPaymentId ? (
          <form className="space-y-3 rounded-lg border border-gray-200 p-3" onSubmit={onSubmitEdit}>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="Customer phone number"
              value={paymentForm.phoneNumber}
              onChange={(e) => onChange((current) => ({ ...current, phoneNumber: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="UTR / reference number"
              value={paymentForm.utrNumber}
              onChange={(e) => onChange((current) => ({ ...current, utrNumber: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="Screenshot URL"
              value={paymentForm.screenshotUrl}
              onChange={(e) => onChange((current) => ({ ...current, screenshotUrl: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-white">
                Save payment
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                onClick={onCancelEdit}
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
            <p className="text-gray-950">Customer: {payment.phoneNumber}</p>
            <p className="text-gray-950">Status: {payment.status}</p>
            {payment.utrNumber ? <p className="text-gray-950">UTR: {payment.utrNumber}</p> : null}
            {payment.screenshotUrl ? (
              <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg">
                <Image src={payment.screenshotUrl} alt="Payment screenshot" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            {payment.status === 'pending' ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(payment._id)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white"
                >
                  Approve payment
                </button>
                <button
                  type="button"
                  onClick={() => onReject(payment._id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white"
                >
                  Reject payment
                </button>
              </div>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                onClick={() => onEdit(payment)}
              >
                Edit
              </button>
              {payment.status !== 'approved' ? (
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-3 py-1 text-white"
                  onClick={() => onDelete(payment._id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
