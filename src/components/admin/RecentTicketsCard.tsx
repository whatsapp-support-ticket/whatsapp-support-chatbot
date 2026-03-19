import AdminCard from '@/components/admin/AdminCard';
import type { Ticket } from '@/components/admin/types';

type RecentTicketsCardProps = {
  tickets: Ticket[];
  onDelete: (ticketId: string) => void;
  onEdit: (ticket: Ticket) => void;
};

export default function RecentTicketsCard({ tickets, onDelete, onEdit }: RecentTicketsCardProps) {
  return (
    <AdminCard title="Recent Tickets">
      <div className="space-y-3 text-sm">
        {tickets.map((ticket) => (
          <div key={ticket._id} className="rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">{ticket.ticketNumber}</p>
            <p className="text-gray-950">Status: {ticket.status}</p>
            {ticket.reservedBy ? <p className="text-gray-950">Reserved by: {ticket.reservedBy}</p> : null}
            {ticket.soldTo ? <p className="text-gray-950">Booked by: {ticket.soldTo}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                onClick={() => onEdit(ticket)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-1 text-white"
                onClick={() => onDelete(ticket._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
