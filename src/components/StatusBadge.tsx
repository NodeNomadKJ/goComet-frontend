const colors: Record<string, string> = {
  REQUESTED:         'bg-yellow-100 text-yellow-800',
  MATCHING:          'bg-blue-100 text-blue-800',
  DRIVER_ASSIGNED:   'bg-indigo-100 text-indigo-800',
  DRIVER_ARRIVING:   'bg-purple-100 text-purple-800',
  DRIVER_ARRIVED:    'bg-pink-100 text-pink-800',
  RIDE_STARTED:      'bg-orange-100 text-orange-800',
  COMPLETED:         'bg-green-100 text-green-800',
  PAYMENT_PENDING:   'bg-cyan-100 text-cyan-800',
  PAYMENT_COMPLETED: 'bg-teal-100 text-teal-800',
  CANCELLED:         'bg-red-100 text-red-800',
  FAILED:            'bg-red-200 text-red-900',
  AVAILABLE:         'bg-green-100 text-green-800',
  OFFLINE:           'bg-gray-100 text-gray-600',
  ON_TRIP:           'bg-orange-100 text-orange-800',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = colors[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
