import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import type { DrawFormState } from '@/components/admin/types';

type DrawEditorCardProps = {
  drawForm: DrawFormState;
  editingDrawId: string | null;
  onCancel: () => void;
  onChange: Dispatch<SetStateAction<DrawFormState>>;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
};

export default function DrawEditorCard({
  drawForm,
  editingDrawId,
  onCancel,
  onChange,
  onSubmit,
}: DrawEditorCardProps) {
  return (
    <AdminCard title="Draw Details">
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          placeholder="Draw name"
          value={drawForm.drawName}
          onChange={(e) => onChange((current) => ({ ...current, drawName: e.target.value }))}
        />
        <input
          type="number"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          placeholder="Ticket price in rupees"
          value={drawForm.ticketPrice}
          onChange={(e) => onChange((current) => ({ ...current, ticketPrice: e.target.value }))}
        />
        <div className="flex gap-2">
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">
            {editingDrawId ? 'Save changes' : 'Create draw'}
          </button>
          {editingDrawId ? (
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </AdminCard>
  );
}
