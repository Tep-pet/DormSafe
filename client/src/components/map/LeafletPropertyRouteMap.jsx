import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { getAccuratePinpoint } from '../../utils/propertyCoordinates';
import { GeolocationEngine } from '../../services/map/GeolocationEngine';
import { fetchRoute } from '../../services/map/LiveRouteService';
import {
  Footprints,
  Car,
  MapPin,
  Crosshair,
  Loader2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

// Setup Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Accurate Road Route Map from Ateneo Gate or Live GPS to Property Pinpoint.
 * Powered by Leaflet.js and LiveRouteService (OSRM / Google Directions fallback).
 */
export function LeafletPropertyRouteMap({
  property,
  gateId = 'roxas',
  walkingMinutes,
  onDurationChange,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const propMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastFittedKeyRef = useRef('');

  const onDurationChangeRef = useRef(onDurationChange);
  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.roxas || CAMPUS_GATES.jacinto;
  const gateName = gate.name || gate.label || 'Campus Gate';

  const pinpoint = useMemo(
    () => getAccuratePinpoint(property),
    [property?.id, property?.latitude, property?.longitude, property?.lat, property?.lng, property?.name]
  );

  // Origin mode: 'gate' | 'gps'
  const [originMode, setOriginMode] = useState(() =>
    GeolocationEngine.lastKnownPosition ? 'gps' : 'gate'
  );
  const [userLoc, setUserLoc] = useState(() => GeolocationEngine.lastKnownPosition);
  const [recalibrating, setRecalibrating] = useState(false);
  const [travelMode, setTravelMode] = useState('walking'); // 'walking' | 'driving'

  const [routeStats, setRouteStats] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const [durations, setDurations] = useState({
    walking: walkingMinutes || null,
    driving: null,
  });

  // Keep durations synced if parent prop changes
  useEffect(() => {
    if (walkingMinutes) {
      setDurations((prev) => (prev.walking ? prev : { ...prev, walking: walkingMinutes }));
    }
  }, [walkingMinutes]);

  // Subscribe to GeolocationEngine updates
  useEffect(() => {
    GeolocationEngine.startTracking({
      onLocation: (pos) => {
        if (pos) setUserLoc(pos);
      },
      onError: (err) => {
        console.warn('Geolocation notice:', err?.message);
      },
    });

    return () => {
      GeolocationEngine.stopTracking();
    };
  }, []);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenterLat = (gate.lat + pinpoint.lat) / 2;
      const initialCenterLng = (gate.lng + pinpoint.lng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [initialCenterLat, initialCenterLng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

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

  // ResizeObserver to handle container layout changes
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

  // 2. Render Ateneo Campus Gate Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

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
        `<b>${gateName}</b><br/><span style="color:#003366;font-weight:600;">Campus Gate</span><br/><small>Ateneo de Davao University</small>`
      );
    } else {
      gateMarkerRef.current = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(
          `<b>${gateName}</b><br/><span style="color:#003366;font-weight:600;">Campus Gate</span><br/><small>Ateneo de Davao University</small>`
        );
    }
  }, [gate.lat, gate.lng, gateName]);

  // 3. Render Property Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const propDisplayName = property?.name || 'Property Destination';
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
      iconSize: [140, 30],
      iconAnchor: [70, 15],
    });

    if (propMarkerRef.current) {
      propMarkerRef.current.setLatLng([pinpoint.lat, pinpoint.lng]);
      propMarkerRef.current.setIcon(propIcon);
      propMarkerRef.current.setPopupContent(
        `<b>${propDisplayName}</b><br/><small>${property?.address || 'Davao City'}</small><br/><b>Pinpoint Destination</b>`
      );
    } else {
      propMarkerRef.current = L.marker([pinpoint.lat, pinpoint.lng], { icon: propIcon, zIndexOffset: 600 })
        .addTo(map)
        .bindPopup(
          `<b>${propDisplayName}</b><br/><small>${property?.address || 'Davao City'}</small><br/><b>Pinpoint Destination</b>`
        );
    }
  }, [pinpoint.lat, pinpoint.lng, property?.name, property?.address]);

  // 4. Render Draggable User Marker & Accuracy Circle (when GPS mode is active)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLoc) {
      const userPos = [userLoc.lat, userLoc.lng];

      const userDotIcon = L.divIcon({
        className: 'custom-live-user-dot',
        html: `<div class="user-live-dot" title="Your location (Drag to fine-tune)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (!userMarkerRef.current) {
        const marker = L.marker(userPos, {
          icon: userDotIcon,
          zIndexOffset: 800,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const latlng = marker.getLatLng();
          const updated = GeolocationEngine.setManualLocation({
            lat: latlng.lat,
            lng: latlng.lng,
          });
          setUserLoc(updated);
          setOriginMode('gps');
        });

        marker.bindTooltip(
          userLoc.isManual ? '<b>Pinned Location</b><br/>(Drag to adjust)' : '<b>Your Location</b><br/>(Drag to fine-tune)',
          { direction: 'top', offset: [0, -10] }
        );

        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng(userPos);
        userMarkerRef.current.setTooltipContent(
          userLoc.isManual ? '<b>Pinned Location</b><br/>(Drag to adjust)' : '<b>Your Location</b><br/>(Drag to fine-tune)'
        );
      }

      if (userLoc.accuracy && !userLoc.isManual) {
        const radius = Math.min(userLoc.accuracy, 300);
        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle(userPos, {
            radius,
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          userAccuracyCircleRef.current.setLatLng(userPos);
          userAccuracyCircleRef.current.setRadius(radius);
        }
      } else if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
    }
  }, [userLoc]);

  // Recalibrate GPS callback
  const handleRecalibrate = useCallback(async () => {
    setRecalibrating(true);
    setRouteError(null);
    try {
      const fresh = await GeolocationEngine.recalibrate();
      setUserLoc(fresh);
      setOriginMode('gps');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([fresh.lat, fresh.lng], 16, { animate: true, duration: 0.8 });
      }
    } catch (err) {
      console.warn('GPS Recalibration notice:', err?.message);
    } finally {
      setRecalibrating(false);
    }
  }, []);

  // 5. Draw Real Street Route using LiveRouteService
  const activeOrigin = useMemo(() => {
    if (originMode === 'gps' && userLoc) {
      return { lat: userLoc.lat, lng: userLoc.lng, name: 'My Location' };
    }
    return { lat: gate.lat, lng: gate.lng, name: gateName };
  }, [originMode, userLoc?.lat, userLoc?.lng, gate.lat, gate.lng, gateName]);

  const originKey = useMemo(() => {
    if (originMode === 'gps' && userLoc) {
      return `gps:${userLoc.lat.toFixed(4)},${userLoc.lng.toFixed(4)}`;
    }
    return `gate:${gateId}`;
  }, [originMode, userLoc?.lat, userLoc?.lng, gateId]);

  const routeIdentityKey = useMemo(() => {
    return `${originKey}|${travelMode}|${pinpoint.lat.toFixed(5)},${pinpoint.lng.toFixed(5)}`;
  }, [originKey, travelMode, pinpoint.lat, pinpoint.lng]);

  useEffect(() => {
    if (!pinpoint.lat || !pinpoint.lng) return;

    let isCancelled = false;
    const mode = travelMode === 'driving' ? 'drive' : 'walk';
    const routeColor = travelMode === 'driving' ? '#0284c7' : '#1a73e8';

    setRouteLoading(true);
    setRouteError(null);

    async function loadRoute() {
      try {
        const routeData = await fetchRoute(activeOrigin, pinpoint, mode);
        if (isCancelled) return;

        setRouteStats({
          distance: routeData.distanceMeters,
          duration: routeData.durationMinutes,
          provider: routeData.provider,
          trafficAware: routeData.trafficAware,
        });

        setDurations((prev) => ({
          ...prev,
          [travelMode]: routeData.durationMinutes,
        }));

        if (travelMode === 'walking' && onDurationChangeRef.current) {
          onDurationChangeRef.current(routeData.durationMinutes);
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        const polyline = L.polyline(routeData.coordinates, {
          color: routeColor,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;

        // Only snap/fit camera when routeIdentityKey changes, never on pure GPS drift ticks
        if (lastFittedKeyRef.current !== routeIdentityKey) {
          lastFittedKeyRef.current = routeIdentityKey;
          map.fitBounds(polyline.getBounds(), {
            padding: [45, 45],
            maxZoom: 17,
            animate: false,
          });
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to fetch route:', err);
        setRouteError('Could not calculate street route. Check network connection.');
      } finally {
        if (!isCancelled) {
          setRouteLoading(false);
        }
      }
    }

    loadRoute();

    return () => {
      isCancelled = true;
    };
  }, [activeOrigin.lat, activeOrigin.lng, pinpoint.lat, pinpoint.lng, travelMode, routeIdentityKey]);

  // Format display labels
  const originDisplayLabel = originMode === 'gps' && userLoc ? 'My Location' : gateName;
  const displayMinutes = routeStats?.duration || durations[travelMode] || (travelMode === 'walking' ? 5 : 2);
  const displayDistance = routeStats?.distance
    ? routeStats.distance >= 1000
      ? `${(routeStats.distance / 1000).toFixed(1)} km`
      : `${routeStats.distance} m`
    : null;

  return (
    <div className="space-y-3">
      {/* Route Header Info Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          {travelMode === 'driving' ? (
            <div className="flex items-center gap-1.5 font-bold text-ateneo-blue text-xs sm:text-sm">
              <Car size={16} className="text-sky-600 shrink-0" />
              <span>
                Driving from {originDisplayLabel}: {displayMinutes} min{' '}
                {displayDistance ? `(${displayDistance})` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-ateneo-blue text-xs sm:text-sm">
              <Footprints size={16} className="text-emerald-600 shrink-0" />
              <span>
                Walking from {originDisplayLabel}: {displayMinutes} min{' '}
                {displayDistance ? `(${displayDistance})` : ''}
              </span>
            </div>
          )}
          {routeLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Origin Mode Toggle */}
          <div className="flex items-center rounded-lg bg-white border border-slate-200 p-0.5 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setOriginMode('gate')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                originMode === 'gate'
                  ? 'bg-ateneo-blue text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{gateName}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!userLoc) {
                  handleRecalibrate();
                } else {
                  setOriginMode('gps');
                }
              }}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
                originMode === 'gps'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crosshair size={12} className={recalibrating ? 'animate-spin' : ''} />
              <span>My Location</span>
            </button>
          </div>

          {/* Mode Toggle */}
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
              <span>Walk</span>
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
              <span>Drive</span>
            </button>
          </div>

          {/* Quick Recalibrate Button */}
          <button
            type="button"
            onClick={handleRecalibrate}
            disabled={recalibrating}
            title="Recalibrate GPS position"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            {recalibrating ? (
              <Loader2 size={14} className="animate-spin text-blue-600" />
            ) : (
              <RotateCw size={14} />
            )}
          </button>
        </div>
      </div>

      {routeError && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span>{routeError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-1">
        <span>
          Origin: <strong className="text-slate-800">{originDisplayLabel}</strong>
          {userLoc?.isManual && originMode === 'gps' && ' (Custom Pinned)'}
        </span>
        <span className="text-[11px] text-slate-400">
          {routeStats?.provider ? `Routed via ${routeStats.provider}` : 'Street Network Routing'}
        </span>
      </div>

      {/* Map Canvas */}
      <div className="h-[280px] sm:h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}
