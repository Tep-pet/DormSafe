import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { WalkingTimeBadge } from './WalkingTimeBadge';
import { Button } from '../common/Button';

export function LeafletPropertyMap({ property, gateId = 'jacinto', walkingMinutes }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
  const propLat = Number(property?.latitude) || 7.0725891;
  const propLng = Number(property?.longitude) || 125.6160124;

  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${gate.lat},${gate.lng}&destination=${propLat},${propLng}&travelmode=walking`;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(gate.lat + propLat) / 2, (gate.lng + propLng) / 2],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Campus Gate Icon
      const gateIcon = L.divIcon({
        className: 'custom-gate-pin',
        html: `
          <div style="
            background: #003366;
            color: #fff;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #C5A900;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-weight: 800;
            font-size: 12px;
          ">
            G
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([gate.lat, gate.lng], { icon: gateIcon })
        .addTo(map)
        .bindPopup(`<b>${gate.label}</b><br/>Ateneo Campus Origin`);

      // Property Icon
      const propIcon = L.divIcon({
        className: 'custom-prop-pin',
        html: `
          <div style="
            background: #ffffff;
            color: #003366;
            padding: 4px 8px;
            border-radius: 9999px;
            border: 2px solid #003366;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>📍</span>
            <span>${property?.name || 'Property'}</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      L.marker([propLat, propLng], { icon: propIcon })
        .addTo(map)
        .bindPopup(`<b>${property?.name || 'Property'}</b><br/>${property?.address || ''}`);

      // Connecting Walking Line
      const routeLine = L.polyline(
        [
          [gate.lat, gate.lng],
          [propLat, propLng],
        ],
        {
          color: '#003366',
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8',
        }
      ).addTo(map);

      // Fit map bounds to show both pins comfortably
      const bounds = L.latLngBounds([[gate.lat, gate.lng], [propLat, propLng]]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gate, propLat, propLng, property]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>From {gate.label}</span>
          <WalkingTimeBadge minutes={walkingMinutes} />
        </div>
        <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary" size="sm" radius="full">
            Open in Google Maps ↗
          </Button>
        </a>
      </div>

      <p className="text-xs text-slate-500">{property?.address}</p>

      <div className="h-[280px] sm:h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-2xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-xs border border-slate-200">
            🚶 Direct Walking Route
          </span>
        </div>
      </div>
    </div>
  );
}
