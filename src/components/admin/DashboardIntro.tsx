type DashboardIntroProps = {
  actionMessage: string;
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
};

export default function DashboardIntro({
  actionMessage,
  error,
  isError,
  isLoading,
}: DashboardIntroProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">Lottery Booking Admin</h2>
      <p className="mt-2 text-sm text-gray-600">
        Manage draws, tickets, payment QR settings, and customer payment verification from one place.
      </p>
      {actionMessage ? <p className="mt-3 text-sm text-green-700">{actionMessage}</p> : null}
      {isError ? (
        <p className="mt-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Dashboard load failed'}
        </p>
      ) : null}
      {isLoading ? <p className="mt-3 text-sm text-gray-500">Loading dashboard data...</p> : null}
    </section>
  );
}
