import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { WalkingTimeBadge } from './WalkingTimeBadge';
import { Button } from '../common/Button';
import { Footprints, Car, Navigation, Crosshair } from 'lucide-react';

export function LeafletPropertyRouteMap({ property, gateId = 'jacinto', walkingMinutes }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const userMarkerRef = useRef(null);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
  const propLat = Number(property?.latitude) || 7.0725891;
  const propLng = Number(property?.longitude) || 125.6160124;

  const [travelMode, setTravelMode] = useState('walking');
  const [routeStats, setRouteStats] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Link for external native Google Maps app opening
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${gate.lat},${gate.lng}&destination=${propLat},${propLng}&travelmode=walking`;

  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Initialize Map
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
            padding: 4px 9px;
            border-radius: 9999px;
            border: 2px solid #003366;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
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
        .bindPopup(`<b>${property?.name || 'Property'}</b><br/>${property?.address || ''}`)
        .openPopup();

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gate, propLat, propLng, property]);

  // Fetch real OSRM street route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isMounted = true;
    const profile = travelMode === 'driving' ? 'driving' : 'foot';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${gate.lng},${gate.lat};${propLng},${propLat}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.routes?.[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

          if (routePolylineRef.current) {
            routePolylineRef.current.remove();
          }

          const polyline = L.polyline(coords, {
            color: travelMode === 'driving' ? '#0284c7' : '#003366',
            weight: 5,
            opacity: 0.85,
            dashArray: travelMode === 'driving' ? null : '6, 8',
          }).addTo(map);

          routePolylineRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 17 });

          setRouteStats({
            distance: Math.round(route.distance),
            duration: Math.max(1, Math.round(route.duration / 60)),
          });
        }
      })
      .catch(() => {
        // Fallback straight line if network/OSRM is slow
        if (routePolylineRef.current) routePolylineRef.current.remove();
        const fallbackLine = L.polyline(
          [
            [gate.lat, gate.lng],
            [propLat, propLng],
          ],
          { color: '#003366', weight: 4, dashArray: '6, 6' }
        ).addTo(map);
        routePolylineRef.current = fallbackLine;
      });

    return () => {
      isMounted = false;
    };
  }, [gate, propLat, propLng, travelMode]);

  return (
    <div className="space-y-3">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span className="font-semibold">From {gate.label}:</span>
          <WalkingTimeBadge minutes={routeStats?.duration || walkingMinutes} />
          {routeStats?.distance && (
            <span className="text-xs text-slate-500 font-medium">
              ({routeStats.distance >= 1000 ? `${(routeStats.distance / 1000).toFixed(1)} km` : `${routeStats.distance} m`})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTravelMode('walking')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                travelMode === 'walking'
                  ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>Walk</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('driving')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                travelMode === 'driving'
                  ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>Drive</span>
            </button>
          </div>

          <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" size="sm" radius="full">
              Open in Maps ↗
            </Button>
          </a>
        </div>
      </div>

      <p className="text-xs text-slate-500">{property?.address}</p>

      {/* Map Container */}
      <div className="h-[280px] sm:h-[350px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}
