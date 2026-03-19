import Image from 'next/image';
import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import AdminCard from '@/components/admin/AdminCard';
import type { Draw, Settings, SettingsFormState } from '@/components/admin/types';

type PaymentSettingsCardProps = {
  draws: Draw[];
  qrPreviewSrc: string;
  settings: Settings | null | undefined;
  settingsForm: SettingsFormState;
  onChange: Dispatch<SetStateAction<SettingsFormState>>;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
};

export default function PaymentSettingsCard({
  draws,
  qrPreviewSrc,
  settings,
  settingsForm,
  onChange,
  onSubmit,
}: PaymentSettingsCardProps) {
  return (
    <AdminCard title="Payment QR Setup">
      <form className="space-y-3" onSubmit={onSubmit}>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          value={settingsForm.activeDrawId || settings?.activeDrawId || ''}
          onChange={(e) => onChange((current) => ({ ...current, activeDrawId: e.target.value }))}
        >
          <option value="">Choose the active draw</option>
          {draws.map((draw) => (
            <option key={draw._id} value={draw._id}>
              {draw.drawName}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          placeholder="Payment instructions shown to customers"
          rows={3}
          defaultValue={settings?.paymentInstructions || ''}
          onChange={(e) => onChange((current) => ({ ...current, paymentInstructions: e.target.value }))}
        />
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          placeholder="Public QR image URL"
          defaultValue={settings?.qrCodeUrl || ''}
          onChange={(e) => onChange((current) => ({ ...current, qrCodeUrl: e.target.value }))}
        />
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-950"
          placeholder="Paste QR base64 here. Supports a full data URI or raw base64."
          rows={5}
          value={settingsForm.qrCodeBase64}
          onChange={(e) => onChange((current) => ({ ...current, qrCodeBase64: e.target.value }))}
        />
        <input
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          onChange={(e) => onChange((current) => ({ ...current, qrCodeFile: e.target.files?.[0] ?? null }))}
        />
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" type="submit">
          Save QR settings
        </button>
        {qrPreviewSrc ? (
          <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-200">
            <Image src={qrPreviewSrc} alt="QR code preview" fill className="object-cover" unoptimized />
          </div>
        ) : null}
      </form>
    </AdminCard>
  );
}
