import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { getAccuratePinpoint } from '../../utils/propertyCoordinates';
import { GeolocationEngine } from '../../services/map/GeolocationEngine';
import { fetchRoute } from '../../services/map/LiveRouteService';
import { formatPrice } from '../../utils/formatPrice';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Footprints,
  Car,
  X,
  Crosshair,
  MapPin,
  Compass,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

// Setup Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function LeafletCampusMap({
  gateId = 'jacinto',
  properties = [],
  selectedProperty = null,
  onMarkerClick,
}) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastFittedRouteKeyRef = useRef('');

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  // State
  const [userLocation, setUserLocation] = useState(() => GeolocationEngine.lastKnownPosition);
  const [locating, setLocating] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const [activeDorm, setActiveDorm] = useState(selectedProperty || null);
  const [travelMode, setTravelMode] = useState('walk'); // 'walk' | 'drive'
  const [routeOriginMode, setRouteOriginMode] = useState(() =>
    GeolocationEngine.lastKnownPosition ? 'gps' : 'ateneo'
  ); // 'ateneo' | 'gps'
  const [routeState, setRouteState] = useState({
    status: 'idle',
    data: null,
    error: null,
  });

  // Sync selectedProperty prop
  useEffect(() => {
    if (selectedProperty) {
      setActiveDorm(selectedProperty);
    }
  }, [selectedProperty]);

  // Subscribe to GeolocationEngine on mount
  useEffect(() => {
    GeolocationEngine.startTracking({
      onLocation: (pos) => {
        setUserLocation(pos);
      },
      onError: (err) => {
        if (!GeolocationEngine.lastKnownPosition) {
          setGpsError(err?.message || 'Could not detect location');
        }
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
      const map = L.map(mapContainerRef.current, {
        center: [gate.lat, gate.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap' })
        .addTo(map);

      L.control.zoom({ position: 'topleft' }).addTo(map);

      mapInstanceRef.current = map;

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

  // Handle map click when pinMode ("Pin My Location") is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e) => {
      if (!pinMode) return;
      const newPos = GeolocationEngine.setManualLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
      setUserLocation(newPos);
      setRouteOriginMode('gps');
      setPinMode(false);
      setGpsError(null);
      map.flyTo([e.latlng.lat, e.latlng.lng], 16, { duration: 0.8 });
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [pinMode]);

  // 2. Render Live User Dot (Draggable!) & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const userPos = [userLocation.lat, userLocation.lng];

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
          setUserLocation(updated);
          setRouteOriginMode('gps');
          setGpsError(null);
        });

        marker.bindTooltip(
          userLocation.isManual
            ? '<b>Pinned Location</b><br/>(Drag to adjust)'
            : '<b>Your Location</b><br/>(Drag to fine-tune)',
          { direction: 'top', offset: [0, -10] }
        );

        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng(userPos);
        userMarkerRef.current.setTooltipContent(
          userLocation.isManual
            ? '<b>Pinned Location</b><br/>(Drag to adjust)'
            : '<b>Your Location</b><br/>(Drag to fine-tune)'
        );
      }

      if (userLocation.accuracy && !userLocation.isManual) {
        const radius = Math.min(userLocation.accuracy, 300);
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
  }, [userLocation]);

  // 3. Update Campus Gate Marker & 2km Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (circleRef.current) {
      circleRef.current.remove();
    }

    const circle = L.circle([gate.lat, gate.lng], {
      radius: SEARCH_RADIUS_KM * 1000,
      color: '#003366',
      fillColor: '#003366',
      fillOpacity: 0.05,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);
    circleRef.current = circle;

    const gateIcon = L.divIcon({
      className: 'custom-gate-pin',
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
        `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:700;">${gate.label}</span><br/><small>Campus Origin</small>`
      );
    } else {
      gateMarkerRef.current = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(
          `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:700;">${gate.label}</span><br/><small>Campus Origin</small>`
        );
    }
  }, [gate]);

  // 4. Update Dorm Property Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((p) => {
      const pinpoint = getAccuratePinpoint(p);
      if (!pinpoint.lat || !pinpoint.lng) return;

      const isCurrent = activeDorm?.id === p.id;

      const propIcon = L.divIcon({
        className: 'custom-dorm-pill',
        html: `
          <div style="
            background: ${isCurrent ? '#003366' : '#ffffff'};
            color: ${isCurrent ? '#ffffff' : '#003366'};
            padding: 4px 10px;
            border-radius: 9999px;
            border: 2px solid ${isCurrent ? '#C5A900' : '#003366'};
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transform: ${isCurrent ? 'scale(1.08)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span>🏠</span>
            <span>${p.min_price ? formatPrice(p.min_price) : p.name.slice(0, 14)}</span>
          </div>
        `,
        iconSize: [96, 28],
        iconAnchor: [48, 14],
      });

      const marker = L.marker([pinpoint.lat, pinpoint.lng], {
        icon: propIcon,
        zIndexOffset: isCurrent ? 600 : 300,
      }).addTo(map);

      marker.on('click', () => {
        setActiveDorm(p);
        onMarkerClick?.(p);
      });

      markersRef.current.push(marker);
    });
  }, [properties, activeDorm?.id, onMarkerClick]);

  // 5. Stable Route Calculation & Camera Fit
  const activePinpoint = useMemo(() => {
    return activeDorm ? getAccuratePinpoint(activeDorm) : null;
  }, [activeDorm]);

  const originCoords = useMemo(() => {
    if (routeOriginMode === 'gps' && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return { lat: gate.lat, lng: gate.lng };
  }, [routeOriginMode, userLocation?.lat, userLocation?.lng, gate.lat, gate.lng]);

  const originKey = useMemo(() => {
    if (routeOriginMode === 'gps' && userLocation) {
      return `gps:${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
    }
    return `ateneo:${gateId}`;
  }, [routeOriginMode, userLocation?.lat, userLocation?.lng, gateId]);

  const routeIdentityKey = useMemo(() => {
    if (!activeDorm || !activePinpoint) return '';
    return `${activeDorm.id}|${originKey}|${travelMode}`;
  }, [activeDorm?.id, originKey, travelMode, activePinpoint]);

  useEffect(() => {
    if (!activeDorm || !activePinpoint) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      setRouteState({ status: 'idle', data: null, error: null });
      return;
    }

    let isCancelled = false;
    setRouteState((s) => ({ ...s, status: 'loading', error: null }));

    async function loadRoute() {
      try {
        const data = await fetchRoute(originCoords, activePinpoint, travelMode);
        if (isCancelled) return;

        setRouteState({ status: 'ok', data, error: null });

        const map = mapInstanceRef.current;
        if (!map) return;

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        const isDrive = travelMode === 'drive';
        const polyline = L.polyline(data.coordinates, {
          color: isDrive ? '#0284c7' : '#0052cc',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;

        // Auto zoom bounds ONLY when route identity changes (never on GPS drift!)
        if (lastFittedRouteKeyRef.current !== routeIdentityKey) {
          lastFittedRouteKeyRef.current = routeIdentityKey;
          map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 17 });
        }
      } catch (err) {
        if (isCancelled) return;
        setRouteState({
          status: 'error',
          data: null,
          error: err.message || 'Route calculation unavailable',
        });
      }
    }

    loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [routeIdentityKey, originCoords, activePinpoint, travelMode, activeDorm]);

  // Recenter / Locate Handlers
  const handleRecenterAteneo = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([gate.lat, gate.lng], 16, { duration: 0.8 });
  };

  const handleLocateMe = useCallback(() => {
    setGpsError(null);
    setLocating(true);
    GeolocationEngine.recalibrate({
      onLocation: (pos) => {
        setLocating(false);
        setUserLocation(pos);
        setRouteOriginMode('gps');
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([pos.lat, pos.lng], 16, { duration: 0.8 });
        }
      },
      onError: (err) => {
        setLocating(false);
        setGpsError(
          err?.code === 1
            ? 'Location permission denied. Click the Pin icon to set your position manually on the map.'
            : 'Could not detect GPS signal. Click the Pin icon to tap your position on the map.'
        );
      },
    });
  }, []);

  const handleClearRoute = () => {
    setActiveDorm(null);
    setRouteState({ status: 'idle', data: null, error: null });
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Recenter on Ateneo Gate */}
        <button
          type="button"
          onClick={handleRecenterAteneo}
          className="pointer-events-auto p-2.5 rounded-full bg-white shadow-md border border-slate-200 text-ateneo-blue hover:bg-slate-50 transition active:scale-95"
          title={`Center on Ateneo (${gate.label})`}
        >
          <span className="font-extrabold text-xs">🏛️</span>
        </button>

        {/* Locate / Recalibrate GPS Button (ALWAYS VISIBLE!) */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className={`pointer-events-auto p-2.5 rounded-full bg-white shadow-md border transition active:scale-95 ${
            locating
              ? 'border-blue-400 text-blue-600'
              : routeOriginMode === 'gps' && userLocation
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title="Recalibrate and locate my position"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
        </button>

        {/* Pin My Location on Map Button (Desktop/Manual fallback) */}
        <button
          type="button"
          onClick={() => setPinMode((curr) => !curr)}
          className={`pointer-events-auto p-2.5 rounded-full shadow-md border transition active:scale-95 ${
            pinMode
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={pinMode ? 'Cancel pinning' : 'Click on map to drop your exact position manually'}
        >
          <MapPin className="h-4 w-4" />
        </button>
      </div>

      {/* Pin Mode Banner Notification */}
      {pinMode && (
        <div className="absolute top-3 left-12 right-16 z-30 pointer-events-auto">
          <div className="rounded-xl bg-blue-600 text-white px-3 py-2 text-xs font-bold shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top duration-200">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={14} className="shrink-0 animate-bounce" />
              <span className="truncate">Tap anywhere on the map to set your location</span>
            </div>
            <button
              type="button"
              onClick={() => setPinMode(false)}
              className="text-[11px] underline font-medium hover:text-blue-100 shrink-0"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* GPS Error Toast */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 z-30 pointer-events-auto max-w-sm mx-auto">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span className="text-[11px] leading-tight truncate">{gpsError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGpsError(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Origin Selector Pill (Top Left) */}
      <div className="absolute top-3 left-12 z-20 pointer-events-auto">
        <div className="flex items-center p-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md text-xs font-bold">
          <button
            type="button"
            onClick={() => setRouteOriginMode('ateneo')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition ${
              routeOriginMode === 'ateneo'
                ? 'bg-ateneo-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Ateneo ({gate.label})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (userLocation) {
                setRouteOriginMode('gps');
                const map = mapInstanceRef.current;
                if (map) {
                  map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 });
                }
              } else {
                handleLocateMe();
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition ${
              routeOriginMode === 'gps'
                ? 'bg-ateneo-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crosshair size={12} className={locating ? 'animate-spin' : ''} />
            <span>My Location</span>
          </button>
        </div>
      </div>

      {/* Active Route Bottom Card */}
      {activeDorm && (
        <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white/98 p-3.5 shadow-xl backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 rounded-lg bg-blue-100 text-ateneo-blue shrink-0">
                  <Navigation className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {activeDorm.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeDorm.address || 'Davao City, Philippines'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearRoute}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
                title="Clear route"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Starting Point & Origin Switch */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400">From: </span>
                <span className="font-semibold text-slate-900">
                  {routeOriginMode === 'gps' && userLocation
                    ? userLocation.isManual
                      ? 'Pinned Location'
                      : 'My Current Location'
                    : `Ateneo (${gate.label})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (routeOriginMode === 'ateneo') {
                    if (userLocation) {
                      setRouteOriginMode('gps');
                    } else {
                      handleLocateMe();
                    }
                  } else {
                    setRouteOriginMode('ateneo');
                  }
                }}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                {routeOriginMode === 'ateneo' ? 'Switch to My Location' : 'Reset to Ateneo'}
              </button>
            </div>

            {/* Travel Stats & Walking/Driving Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {routeState.status === 'loading' ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Loader2 size={13} className="animate-spin text-blue-600" />
                    <span>Calculating route…</span>
                  </div>
                ) : routeState.status === 'error' ? (
                  <div className="text-xs text-rose-600 font-semibold">
                    Route calculation unavailable
                  </div>
                ) : routeState.data ? (
                  <>
                    <div className="text-xs">
                      <span className="text-slate-400">Distance: </span>
                      <span className="font-bold text-slate-800">
                        {routeState.data.formattedDistance}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400">ETA: </span>
                      <span className="font-bold text-emerald-600">
                        ~{routeState.data.durationMinutes} min {travelMode}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Mode Toggle & Live Navigation */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTravelMode('walk')}
                    className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                      travelMode === 'walk'
                        ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Footprints className="h-3.5 w-3.5" />
                    <span>Walk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('drive')}
                    className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                      travelMode === 'drive'
                        ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    <span>Drive</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/navigate/${activeDorm.id || activeDorm._id}`, {
                      state: {
                        property: {
                          ...activeDorm,
                          walking_minutes:
                            routeState.data?.durationMinutes || activeDorm.walking_minutes,
                        },
                        initialGate: gateId,
                        travelMode: travelMode === 'drive' ? 'drive' : 'walk',
                        originMode: routeOriginMode === 'gps' ? 'gps' : 'gate',
                      },
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-ateneo-blue text-white hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs"
                  title="Start Live In-App Navigation"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Navigate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
