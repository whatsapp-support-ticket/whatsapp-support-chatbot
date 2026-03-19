import AdminCard from '@/components/admin/AdminCard';
import type { Draw } from '@/components/admin/types';

type SavedDrawsCardProps = {
  draws: Draw[];
  onDelete: (drawId: string) => void;
  onEdit: (draw: Draw) => void;
};

export default function SavedDrawsCard({ draws, onDelete, onEdit }: SavedDrawsCardProps) {
  return (
    <AdminCard title="Saved Draws">
      <div className="space-y-3 text-sm text-gray-700">
        {draws.map((draw) => (
          <div key={draw._id} className="rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">{draw.drawName}</p>
            <p>Price: Rs. {draw.ticketPrice}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-1 text-gray-900"
                onClick={() => onEdit(draw)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-1 text-white"
                onClick={() => onDelete(draw._id)}
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
