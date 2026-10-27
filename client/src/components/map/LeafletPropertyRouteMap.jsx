import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { getAccuratePinpoint, calculateStraightLineDistance, getKnownWalkingMinutes, getKnownDrivingMinutes } from '../../utils/propertyCoordinates';
import { WalkingTimeBadge } from './WalkingTimeBadge';
import { Footprints, Car, MapPin, Navigation } from 'lucide-react';

// Setup Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * 100% Free, Accurate Route Map from Ateneo de Davao University to Property Pinpoint
 * Powered by Leaflet.js and OpenStreetMap.
 */
export function LeafletPropertyRouteMap({ property, gateId = 'jacinto', walkingMinutes, onDurationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const propMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const onDurationChangeRef = useRef(onDurationChange);
  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
  const pinpoint = getAccuratePinpoint(property);
  const knownMinutes = getKnownWalkingMinutes(gateId, property);
  const knownDriveMinutes = getKnownDrivingMinutes(gateId, property);

  const [travelMode, setTravelMode] = useState('walking');
  const [routeStats, setRouteStats] = useState(null);
  const [isRouting, setIsRouting] = useState(false);

  // Initial distance estimate
  const initialEstimate = calculateStraightLineDistance(gate.lat, gate.lng, pinpoint.lat, pinpoint.lng);
  const resolvedInitialMins = knownMinutes || walkingMinutes || initialEstimate.durationMinutes;

  const [durations, setDurations] = useState({
    walking: resolvedInitialMins,
    driving: knownDriveMinutes || initialEstimate.drivingMinutes || 2,
  });

  useEffect(() => {
    const mins = knownMinutes || walkingMinutes;
    if (mins) {
      setDurations((prev) => ({
        ...prev,
        walking: mins,
        driving: knownDriveMinutes || prev.driving,
      }));
    }
  }, [walkingMinutes, knownMinutes, knownDriveMinutes]);

  // 1. Initialize Leaflet Map (runs once on container mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(gate.lat + pinpoint.lat) / 2, (gate.lng + pinpoint.lng) / 2],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Ensure tile sizes calculate correctly on load
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Gate & Property Pinpoint Markers whenever gate or property changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Ateneo de Davao University Starting Point Marker
    const gateIcon = L.divIcon({
      className: 'addu-start-gate-pin',
      html: `
        <div style="
          background: #003366;
          color: #ffffff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #C5A900;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          font-weight: 800;
          font-size: 13px;
        ">
          ADDU
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    if (gateMarkerRef.current) {
      gateMarkerRef.current.setLatLng([gate.lat, gate.lng]);
      gateMarkerRef.current.setIcon(gateIcon);
      gateMarkerRef.current.setPopupContent(
        `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:600;">${gate.label}</span><br/><small>Starting Point</small>`
      );
    } else {
      gateMarkerRef.current = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(
          `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:600;">${gate.label}</span><br/><small>Starting Point</small>`
        );
    }

    // Property Destination Pinpoint Marker
    const propIcon = L.divIcon({
      className: 'property-destination-pin',
      html: `
        <div style="
          background: #003366;
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 9999px;
          border: 2px solid #C5A900;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        ">
          <span>📍</span>
          <span>${property?.name || 'Property'}</span>
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 15],
    });

    if (propMarkerRef.current) {
      propMarkerRef.current.setLatLng([pinpoint.lat, pinpoint.lng]);
      propMarkerRef.current.setIcon(propIcon);
      propMarkerRef.current.setPopupContent(
        `<b>${property?.name || 'Property'}</b><br/><small>${property?.address || ''}</small><br/><b>Pinpoint Destination</b>`
      );
    } else {
      propMarkerRef.current = L.marker([pinpoint.lat, pinpoint.lng], { icon: propIcon, zIndexOffset: 600 })
        .addTo(map)
        .bindPopup(
          `<b>${property?.name || 'Property'}</b><br/><small>${property?.address || ''}</small><br/><b>Pinpoint Destination</b>`
        )
        .openPopup();
    }
  }, [gate, pinpoint, property]);

  // 3. Draw Accurate Street Route from Ateneo de Davao to Property Pinpoint
  const drawRoute = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsRouting(true);
    const profile = travelMode === 'driving' ? 'driving' : 'foot';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${gate.lng},${gate.lat};${pinpoint.lng},${pinpoint.lat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    try {
      const res = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();

      if (data?.routes?.[0]) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        const polyline = L.polyline(coords, {
          color: travelMode === 'driving' ? '#0284c7' : '#003366',
          weight: 5,
          opacity: 0.88,
          dashArray: travelMode === 'driving' ? null : '6, 8',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;

        // Auto zoom and center to show the entire route from Ateneo to property
        map.fitBounds(polyline.getBounds(), { padding: [48, 48], maxZoom: 17 });

        const dist = Math.round(route.distance);
        const rawMins = Math.max(1, Math.round(route.duration / 60));
        const walkMins = knownMinutes || rawMins;
        const driveMins = knownDriveMinutes || Math.max(1, Math.round(dist / 220));

        setRouteStats({ distance: dist, duration: travelMode === 'walking' ? walkMins : driveMins });
        setDurations({
          walking: walkMins,
          driving: driveMins,
        });
        if (onDurationChangeRef.current && travelMode === 'walking') {
          onDurationChangeRef.current(walkMins);
        }
        return;
      }
      throw new Error('No OSRM route returned');
    } catch (err) {
      console.warn('OSRM route notice (using geodesic path):', err.message);

      // Robust fallback: direct path from Ateneo de Davao to Property Pinpoint
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const straightCoords = [
        [gate.lat, gate.lng],
        [pinpoint.lat, pinpoint.lng],
      ];

      const fallbackLine = L.polyline(straightCoords, {
        color: '#003366',
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 6',
      }).addTo(map);

      routePolylineRef.current = fallbackLine;
      map.fitBounds(fallbackLine.getBounds(), { padding: [48, 48], maxZoom: 17 });

      const estimate = calculateStraightLineDistance(
        gate.lat,
        gate.lng,
        pinpoint.lat,
        pinpoint.lng
      );
      const fallbackMins = knownMinutes || estimate.durationMinutes;

      setRouteStats({
        distance: estimate.distanceMeters,
        duration: fallbackMins,
      });
      if (onDurationChangeRef.current && travelMode === 'walking') {
        onDurationChangeRef.current(fallbackMins);
      }
    } finally {
      setIsRouting(false);
      map.invalidateSize();
    }
  }, [gate.lat, gate.lng, pinpoint.lat, pinpoint.lng, travelMode, knownMinutes]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute]);

  const displayMinutes = travelMode === 'walking' ? (knownMinutes || routeStats?.duration || walkingMinutes) : (routeStats?.duration || durations.driving);
  const displayDistance = routeStats?.distance
    ? routeStats.distance >= 1000
      ? `${(routeStats.distance / 1000).toFixed(1)} km`
      : `${routeStats.distance} m`
    : null;

  return (
    <div className="space-y-3">
      {/* Route Header Info Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-ateneo-blue">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ateneo-blue text-white text-[10px] font-bold">
              A
            </span>
            <span>From {gate.label}</span>
          </div>

          <span className="text-slate-400">→</span>

          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <MapPin size={14} className="text-amber-500" />
            <span>{property?.name || 'Property Pinpoint'}</span>
          </div>

          {displayMinutes && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs ${
                travelMode === 'driving'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {travelMode === 'driving' ? (
                <>
                  <Car size={13} className="text-sky-600" />
                  <span>{displayMinutes} min drive</span>
                </>
              ) : (
                <>
                  <Footprints size={13} className="text-emerald-600" />
                  <span>{displayMinutes} min walk</span>
                </>
              )}
            </span>
          )}

          {displayDistance && (
            <span className="text-xs text-slate-500 font-medium">
              ({displayDistance})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle (Walk / Drive with Minutes) */}
          <div className="flex items-center rounded-lg bg-white border border-slate-200 p-0.5 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setTravelMode('walking')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                travelMode === 'walking'
                  ? 'bg-ateneo-blue text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View walking route"
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>Walk {durations.walking ? `(${durations.walking} min)` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('driving')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                travelMode === 'driving'
                  ? 'bg-ateneo-blue text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View driving route"
            >
              <Car className="h-3.5 w-3.5" />
              <span>Drive {durations.driving ? `(${durations.driving} min)` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Starting origin: <strong>Ateneo de Davao University</strong></span>
        <span>Pinpoint: {pinpoint.lat.toFixed(5)}, {pinpoint.lng.toFixed(5)}</span>
      </div>

      {/* Map Canvas */}
      <div className="h-[280px] sm:h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}
