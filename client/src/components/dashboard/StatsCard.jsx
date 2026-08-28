export function StatsCard({ label, value, subtext, variant = 'default' }) {
  const colors = {
    default: 'border-gray-200 bg-white',
    occupied: 'border-red-200 bg-red-50',
    vacant: 'border-emerald-200 bg-emerald-50',
    revenue: 'border-blue-200 bg-blue-50',
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colors[variant] || colors.default}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}
