/** Format price in Philippine Peso */
export function formatPrice(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}
