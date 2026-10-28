import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES } from '../../constants/campusGates';
import {
  getAccuratePinpoint,
  calculateStraightLineDistance,
  getKnownWalkingMinutes,
  getKnownDrivingMinutes,
  getKnownTravelDuration,
  getVerifiedRoadRoute,
} from '../../utils/propertyCoordinates';
import { GoogleDirectionsService } from '../../services/map/GoogleDirectionsService';
import { apiClient } from '../../services/apiClient';
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
export function LeafletPropertyRouteMap({ property, gateId = 'roxas', walkingMinutes, onDurationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const propMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastFittedKeyRef = useRef('');

  const onDurationChangeRef = useRef(onDurationChange);
  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.roxas || CAMPUS_GATES.jacinto;
  const pinpoint = useMemo(
    () => getAccuratePinpoint(property),
    [property?.id, property?.latitude, property?.longitude, property?.lat, property?.lng, property?.name]
  );
  const knownMinutes = getKnownWalkingMinutes(gateId, property);
  const knownDriveMinutes = getKnownDrivingMinutes(gateId, property);

  const [travelMode, setTravelMode] = useState('walking');
  const [routeStats, setRouteStats] = useState(null);

  const resolvedInitialWalk = knownMinutes || walkingMinutes || 6;
  const resolvedInitialDrive = knownDriveMinutes || 2;

  const [durations, setDurations] = useState({
    walking: resolvedInitialWalk,
    driving: resolvedInitialDrive,
  });

  useEffect(() => {
    const mins = knownMinutes || walkingMinutes;
    if (mins) {
      setDurations((prev) => (prev.walking === mins ? prev : { ...prev, walking: mins }));
    }
  }, [walkingMinutes, knownMinutes]);

  useEffect(() => {
    if (knownDriveMinutes) {
      setDurations((prev) => (prev.driving === knownDriveMinutes ? prev : { ...prev, driving: knownDriveMinutes }));
    }
  }, [knownDriveMinutes]);

  // 1. Initialize Leaflet Map (runs once on container mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(gate.lat + pinpoint.lat) / 2, (gate.lng + pinpoint.lng) / 2],
        zoom: 17,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle clean initial size calculation without tile flashing
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Handle container resizing smoothly without tile jitter
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Update Gate & Property Pinpoint Markers whenever gate or property pinpoint changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const gateName = gate.name || gate.label || 'Roxas Gate';

    // Ateneo Campus Starting Gate Marker
    const gateIcon = L.divIcon({
      className: 'addu-start-gate-pin',
      html: `
        <div style="
          background: #003366;
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 9999px;
          border: 2px solid #C5A900;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          font-weight: 800;
          font-size: 11px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <span style="
            background: #C5A900;
            color: #003366;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 900;
          ">A</span>
          <span>${gateName}</span>
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 15],
    });

    if (gateMarkerRef.current) {
      gateMarkerRef.current.setLatLng([gate.lat, gate.lng]);
      gateMarkerRef.current.setIcon(gateIcon);
      gateMarkerRef.current.setPopupContent(
        `<b>${gateName}</b><br/><span style="color:#003366;font-weight:600;">Campus Starting Point</span><br/><small>Ateneo de Davao University</small>`
      );
    } else {
      gateMarkerRef.current = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(
          `<b>${gateName}</b><br/><span style="color:#003366;font-weight:600;">Campus Starting Point</span><br/><small>Ateneo de Davao University</small>`
        );
    }

    // Property Destination Pinpoint Marker (uses SVG pin without raw emojis)
    const propDisplayName = property?.name || 'Residencia de Maria Goretti';
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C5A900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${propDisplayName}</span>
        </div>
      `,
      iconSize: [130, 30],
      iconAnchor: [65, 15],
    });

    if (propMarkerRef.current) {
      propMarkerRef.current.setLatLng([pinpoint.lat, pinpoint.lng]);
      propMarkerRef.current.setIcon(propIcon);
      propMarkerRef.current.setPopupContent(
        `<b>${propDisplayName}</b><br/><small>${property?.address || '32 Padre Faura St, Davao City'}</small><br/><b>Pinpoint Destination</b>`
      );
    } else {
      propMarkerRef.current = L.marker([pinpoint.lat, pinpoint.lng], { icon: propIcon, zIndexOffset: 600 })
        .addTo(map)
        .bindPopup(
          `<b>${propDisplayName}</b><br/><small>${property?.address || '32 Padre Faura St, Davao City'}</small><br/><b>Pinpoint Destination</b>`
        )
        .openPopup();
    }
  }, [gate.lat, gate.lng, gate.name, gate.label, pinpoint.lat, pinpoint.lng, property?.name, property?.address]);

  // 3. Draw Accurate Street Route from Ateneo Campus Gate to Property Pinpoint
  const drawRoute = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const mode = travelMode === 'driving' ? 'drive' : 'walk';
    const routeColor = travelMode === 'driving' ? '#0284c7' : '#1a73e8'; // Google Maps blue

    const fitRouteIfChanged = (polyline) => {
      const routeKey = `${gateId}_${travelMode}_${pinpoint.lat.toFixed(5)},${pinpoint.lng.toFixed(5)}`;
      if (lastFittedKeyRef.current !== routeKey) {
        lastFittedKeyRef.current = routeKey;
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17, animate: false });
      }
    };

    // 0. Instant Ground-Truth Verified Route from Ateneo Gates (zero latency, 100% road accuracy)
    const verified = getVerifiedRoadRoute(gateId, property, mode);
    if (verified) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      // Draw real road path (Google Maps blue solid line)
      const polyline = L.polyline(verified.coordinates, {
        color: routeColor,
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;
      fitRouteIfChanged(polyline);

      setRouteStats((prev) => {
        if (prev?.distance === verified.distanceMeters && prev?.duration === verified.durationMinutes) {
          return prev;
        }
        return { distance: verified.distanceMeters, duration: verified.durationMinutes };
      });
      setDurations((prev) => ({
        ...prev,
        [travelMode]: verified.durationMinutes,
      }));

      if (onDurationChangeRef.current && travelMode === 'walking' && walkingMinutes !== verified.durationMinutes) {
        onDurationChangeRef.current(verified.durationMinutes);
      }
      return;
    }

    try {
      // 1. Resolve road route via GoogleDirectionsService (Google Directions API / verified road routes)
      let routeData = null;
      const gRoute = await GoogleDirectionsService.getRoute(gate, pinpoint, mode, property);
      if (gRoute && gRoute.coordinates?.length >= 2) {
        routeData = gRoute;
      } else {
        // Fallback: Backend Road Routing Service
        const query = `originLat=${gate.lat}&originLng=${gate.lng}&destLat=${pinpoint.lat}&destLng=${pinpoint.lng}&mode=${mode}`;
        try {
          const res = await apiClient.get(`/api/proximity/route?${query}`);
          routeData = res?.data || res;
        } catch (backendErr) {
          const profile = mode === 'drive' ? 'routed-car' : 'routed-foot';
          const osmUrl = `https://routing.openstreetmap.de/${profile}/route/v1/driving/${gate.lng},${gate.lat};${pinpoint.lng},${pinpoint.lat}?overview=full&geometries=geojson`;
          const res = await fetch(osmUrl);
          const data = await res.json();
          if (data?.routes?.[0]) {
            const r = data.routes[0];
            routeData = {
              coordinates: r.geometry.coordinates,
              distanceMeters: Math.round(r.distance),
              durationMinutes: mode === 'drive'
                ? (Math.round(r.distance) <= 400 ? 2 : Math.max(2, Math.round(1.5 + (r.distance / 250))))
                : Math.max(1, Math.round(r.distance / 83.3)),
            };
          }
        }
      }

      if (routeData?.coordinates?.length > 1) {
        const coords = routeData.coordinates.map((c) => {
          if (Array.isArray(c)) {
            const [a, b] = c;
            return a > 50 ? [b, a] : [a, b];
          }
          return [c.lat, c.lng];
        });

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        const polyline = L.polyline(coords, {
          color: routeColor,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;
        fitRouteIfChanged(polyline);

        const dist = routeData.distanceMeters;
        const dur = getKnownTravelDuration(gateId, property, mode) || routeData.durationMinutes;

        setRouteStats((prev) => {
          if (prev?.distance === dist && prev?.duration === dur) return prev;
          return { distance: dist, duration: dur };
        });
        setDurations((prev) => ({
          ...prev,
          [travelMode]: dur,
        }));
        if (onDurationChangeRef.current && travelMode === 'walking' && walkingMinutes !== dur) {
          onDurationChangeRef.current(dur);
        }
        return;
      }
      throw new Error('No road route returned');
    } catch (err) {
      console.warn('Road routing notice (using street-grid alignment):', err.message);

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const gridCoords = [
        [gate.lat, gate.lng],
        [gate.lat, pinpoint.lng],
        [pinpoint.lat, pinpoint.lng],
      ];

      const fallbackLine = L.polyline(gridCoords, {
        color: routeColor,
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
      }).addTo(map);

      routePolylineRef.current = fallbackLine;
      fitRouteIfChanged(fallbackLine);

      const dLatM = Math.abs(pinpoint.lat - gate.lat) * 111139;
      const dLngM = Math.abs(pinpoint.lng - gate.lng) * 111139 * Math.cos((gate.lat * Math.PI) / 180);
      const gridDist = Math.round(dLatM + dLngM);
      const fallbackMins = getKnownTravelDuration(gateId, property, mode) || (mode === 'drive' ? 2 : Math.max(1, Math.round(gridDist / 83.3)));

      setRouteStats((prev) => {
        if (prev?.distance === gridDist && prev?.duration === fallbackMins) return prev;
        return { distance: gridDist, duration: fallbackMins };
      });
      if (onDurationChangeRef.current && travelMode === 'walking' && walkingMinutes !== fallbackMins) {
        onDurationChangeRef.current(fallbackMins);
      }
    }
  }, [gateId, gate.lat, gate.lng, pinpoint.lat, pinpoint.lng, travelMode, property?.id, property?.name, walkingMinutes]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute]);

  const initialVerified = getVerifiedRoadRoute(gateId, property, travelMode === 'driving' ? 'drive' : 'walk');
  const fallbackDistance = initialVerified?.distanceMeters
    ? (initialVerified.distanceMeters >= 1000
        ? `${(initialVerified.distanceMeters / 1000).toFixed(1)} km`
        : `${initialVerified.distanceMeters} m`)
    : null;

  const displayDistance = routeStats?.distance
    ? routeStats.distance >= 1000
      ? `${(routeStats.distance / 1000).toFixed(1)} km`
      : `${routeStats.distance} m`
    : fallbackDistance;

  const gateName = gate.name || gate.label || 'Roxas Gate';

  return (
    <div className="space-y-3">
      {/* Route Header Info Card: "Walking from Roxas Gate: 3 min (190 m)" */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          {travelMode === 'driving' ? (
            <div className="flex items-center gap-1.5 font-bold text-ateneo-blue text-xs sm:text-sm">
              <Car size={16} className="text-sky-600 shrink-0" />
              <span>Driving from {gateName}: {displayMinutes} min {displayDistance ? `(${displayDistance})` : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-ateneo-blue text-xs sm:text-sm">
              <Footprints size={16} className="text-emerald-600 shrink-0" />
              <span>Walking from {gateName}: {displayMinutes} min {displayDistance ? `(${displayDistance})` : ''}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle (Walk is default; Drive is optional toggle) */}
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
        <span>Starting origin: <strong className="text-slate-800">{gateName}</strong></span>
        <span>Pinpoint: {pinpoint.lat.toFixed(5)}, {pinpoint.lng.toFixed(5)}</span>
      </div>

      {/* Map Canvas */}
      <div className="h-[280px] sm:h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}


