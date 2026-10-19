import { supabaseAdmin } from '../config/supabase.js';
import { getGate } from '../config/campusGates.js';
import { isWithinRadiusKm } from '../utils/haversine.js';

const RADIUS = 2;

export async function getCampusStats() {
  const { data: properties, error } = await supabaseAdmin
    .from('properties')
    .select('id, latitude, longitude, status, rooms(id, price, is_available)')
    .eq('status', 'approved')
    .eq('is_verified', true);

  if (error) throw error;

  const gates = ['jacinto', 'roxas'];
  const stats = {};

  for (const gateId of gates) {
    const gate = getGate(gateId);
    const near = (properties || []).filter((p) =>
      isWithinRadiusKm(p.latitude, p.longitude, gate.lat, gate.lng, RADIUS)
    );

    let beds = 0;
    let available = 0;
    const prices = [];

    for (const p of near) {
      for (const r of p.rooms || []) {
        beds++;
        if (r.is_available) available++;
        if (r.price != null) prices.push(Number(r.price));
      }
    }

    stats[gateId] = {
      gate: gate.label,
      listings: near.length,
      total_beds: beds,
      available_beds: available,
      avg_price: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    };
  }

  return stats;
}
