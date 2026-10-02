import { formatPrice } from './formatPrice';

export function printLeaseSummary(summary) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Lease Summary — ${summary.property?.name || 'DormSafe'}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 640px; margin: 2rem auto; color: #111; }
    h1 { font-size: 1.25rem; color: #003366; }
    .meta { font-size: 0.85rem; color: #555; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    td { padding: 0.5rem 0; border-bottom: 1px solid #eee; vertical-align: top; }
    td:first-child { font-weight: 600; width: 40%; color: #444; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
  </style>
</head>
<body>
  <h1>Lease Summary</h1>
  <p class="meta">Generated ${new Date(summary.generated_at).toLocaleString()}</p>
  <table>
    <tr><td>Tenant</td><td>${summary.tenant_name || '—'}</td></tr>
    <tr><td>Contact</td><td>${summary.contact || '—'}</td></tr>
    <tr><td>Property</td><td>${summary.property?.name || '—'}</td></tr>
    <tr><td>Address</td><td>${summary.property?.address || '—'}</td></tr>
    <tr><td>Room</td><td>${summary.room?.label || '—'}</td></tr>
    <tr><td>Monthly rent</td><td>${summary.monthly_rent != null ? formatPrice(summary.monthly_rent) : '—'}</td></tr>
    <tr><td>Move-in</td><td>${summary.move_in_date || '—'}</td></tr>
    <tr><td>Move-out</td><td>${summary.move_out_date || '—'}</td></tr>
    <tr><td>Owner contact</td><td>${summary.property?.contact_name || '—'} ${summary.property?.contact_phone ? `· ${summary.property.contact_phone}` : ''}</td></tr>
  </table>
  <footer>DormSafe — informational summary only; not a legal contract.</footer>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
