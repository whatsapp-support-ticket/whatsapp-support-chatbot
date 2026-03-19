import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import type { Draw, TicketFormState, TicketMode } from '@/components/admin/types';

type TicketManagerCardProps = {
  draws: Draw[];
  editingTicketId: string | null;
  ticketForm: TicketFormState;
  ticketMode: TicketMode;
  onCancelEdit: () => void;
  onChange: Dispatch<SetStateAction<TicketFormState>>;
  onModeChange: (mode: TicketMode) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
};

export default function TicketManagerCard({
  draws,
  editingTicketId,
  ticketForm,
  ticketMode,
  onCancelEdit,
  onChange,
  onModeChange,
  onSubmit,
}: TicketManagerCardProps) {
  return (
    <AdminCard title="Ticket Manager">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${
              ticketMode === 'bulk' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-900'
            }`}
            onClick={() => onModeChange('bulk')}
          >
            Bulk create
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${
              ticketMode === 'single' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-900'
            }`}
            onClick={() => onModeChange('single')}
          >
            Single ticket
          </button>
        </div>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          value={ticketForm.drawId}
          onChange={(e) => onChange((current) => ({ ...current, drawId: e.target.value }))}
        >
          <option value="">Choose a draw</option>
          {draws.map((draw) => (
            <option key={draw._id} value={draw._id}>
              {draw.drawName}
            </option>
          ))}
        </select>
        {ticketMode === 'edit' ? (
          <>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="Ticket number, for example KL700206"
              value={ticketForm.ticketNumber}
              onChange={(e) => onChange((current) => ({ ...current, ticketNumber: e.target.value.toUpperCase() }))}
            />
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              value={ticketForm.count}
              onChange={(e) => onChange((current) => ({ ...current, count: e.target.value }))}
            >
              <option value="">Choose status</option>
              <option value="available">available</option>
              <option value="reserved">reserved</option>
              <option value="sold">sold</option>
            </select>
          </>
        ) : ticketMode === 'single' ? (
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
            placeholder="Ticket number, for example KL700206"
            value={ticketForm.ticketNumber}
            onChange={(e) => onChange((current) => ({ ...current, ticketNumber: e.target.value.toUpperCase() }))}
          />
        ) : (
          <>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="Ticket prefix, for example KL"
              value={ticketForm.prefix}
              onChange={(e) => onChange((current) => ({ ...current, prefix: e.target.value.toUpperCase() }))}
            />
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
              placeholder="How many tickets to generate"
              value={ticketForm.count}
              onChange={(e) => onChange((current) => ({ ...current, count: e.target.value }))}
            />
          </>
        )}
        <div className="flex gap-2">
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">
            {ticketMode === 'edit' ? 'Save ticket' : ticketMode === 'single' ? 'Create ticket' : 'Generate tickets'}
          </button>
          {editingTicketId ? (
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </AdminCard>
  );
}
