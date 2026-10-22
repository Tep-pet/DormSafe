import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { formatPrice } from '../../utils/formatPrice';

// Fix Leaflet's default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function LeafletMapView({ gateId = 'jacinto', properties = [], onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markersRef = useRef([]);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [gate.lat, gate.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap © CARTO' })
        .addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Campus Gate Marker & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([gate.lat, gate.lng], 15);

    // Remove existing circle
    if (circleRef.current) {
      circleRef.current.remove();
    }

    // Add 2 km radius circle
    const circle = L.circle([gate.lat, gate.lng], {
      radius: SEARCH_RADIUS_KM * 1000,
      color: '#003366',
      fillColor: '#003366',
      fillOpacity: 0.07,
      weight: 2,
      dashArray: '4, 4',
    }).addTo(map);
    circleRef.current = circle;

    // Create Ateneo Gate Custom Icon
    const gateIcon = L.divIcon({
      className: 'custom-gate-pin',
      html: `
        <div style="
          background: #003366;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #C5A900;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          font-weight: 800;
          font-size: 13px;
        ">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const gateMarker = L.marker([gate.lat, gate.lng], { icon: gateIcon })
      .addTo(map)
      .bindPopup(`<b>${gate.label}</b><br/>Campus Perimeter Origin`);

    return () => {
      gateMarker.remove();
    };
  }, [gate]);

  // Update Property Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const propIcon = L.divIcon({
        className: 'custom-prop-pin',
        html: `
          <div style="
            background: #ffffff;
            color: #003366;
            padding: 3px 8px;
            border-radius: 9999px;
            border: 2px solid #003366;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
          ">
            <span>🏠</span>
            <span>${p.min_price ? formatPrice(p.min_price) : p.name.slice(0, 12)}</span>
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: propIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="font-size: 13px; color: #003366;">${p.name}</strong><br/>
            <span>${p.address}</span><br/>
            <span style="font-weight: 700; color: #059669;">${p.min_price ? formatPrice(p.min_price) + '/mo' : ''}</span>
            ${p.walking_minutes ? `<br/><span style="color: #64748b;">🚶 ~${p.walking_minutes} min walk</span>` : ''}
          </div>
        `);

      marker.on('click', () => {
        onMarkerClick?.(p);
      });

      markersRef.current.push(marker);
    });
  }, [properties, onMarkerClick]);

  return (
    <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] lg:min-h-[540px]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-2 right-2 z-20 pointer-events-none">
        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-xs border border-slate-200">
          🗺️ Interactive Campus Map
        </span>
      </div>
    </div>
  );
}
