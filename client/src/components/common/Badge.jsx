/** Verified, Occupied, Vacant, Pending badges per proposal UI */
const VARIANTS = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  occupied: 'bg-red-100 text-red-800',
  vacant: 'bg-emerald-100 text-emerald-800',
  default: 'bg-gray-100 text-gray-800',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant] || VARIANTS.default} ${className}`}
    >
      {children}
    </span>
  );
}
