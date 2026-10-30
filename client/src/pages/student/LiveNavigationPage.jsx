import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, AlertTriangle } from 'lucide-react';
import { MapLibreTracker } from '../../components/map/MapLibreTracker.jsx';
import { TrackingBottomSheet } from '../../components/map/TrackingBottomSheet.jsx';
import { LandmarkSelectorModal } from '../../components/map/LandmarkSelectorModal.jsx';
import { ADDU_GATES } from '../../constants/campusGates.js';
import { proximityService } from '../../services/proximityService.js';
import { GeolocationEngine } from '../../services/map/GeolocationEngine.js';
import { fetchRoute } from '../../services/map/LiveRouteService.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getKnownBenchmarkProperty,
  getAccuratePinpoint,
  getPreferredCampusGate,
  getVerifiedRoadRoute,
} from '../../utils/propertyCoordinates.js';
import {
  calculateHaversineMeters,
  remainingAlongRoute,
  remainingMinutes,
} from '../../services/map/GeoUtils.js';

export function LiveNavigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // Instant benchmark resolution if navigating to a known dorm
  const knownBenchmark = getKnownBenchmarkProperty(id);
  const passedProperty = location.state?.property || knownBenchmark;

  // Initial gate resolution
  const preferredGate = getPreferredCampusGate(passedProperty);
  const queryGate = new URLSearchParams(location.search).get('gate');
  const initialGateId = queryGate || location.state?.initialGate || preferredGate || 'roxas';

  // State
  const [property, setProperty] = useState(passedProperty || null);
  const [loading, setLoading] = useState(!passedProperty);
  const [error, setError] = useState(null);

  const [originMode, setOriginMode] = useState(() => {
    return location.state?.originMode || (GeolocationEngine.lastKnownPosition ? 'gps' : 'gate');
  });
  const [travelMode, setTravelMode] = useState(
    location.state?.travelMode === 'drive' ? 'drive' : 'walk'
  );
  const [gateId, setGateId] = useState(initialGateId);

  const [gps, setGps] = useState(() => {
    const last = GeolocationEngine.lastKnownPosition;
    if (last) {
      return { status: 'ok', position: last };
    }
    return { status: 'locating', position: null };
  });
  const [recalibrating, setRecalibrating] = useState(false);
  const [route, setRoute] = useState({ status: 'idle', data: null, error: null });
  const [progress, setProgress] = useState(null); // { remainingMeters, minutes }
  const [routeFetchCount, setRouteFetchCount] = useState(0);

  const [follow, setFollow] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const [heading, setHeading] = useState(null);
  const [recenterCount, setRecenterCount] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);

  // Refs
  const userChoseOriginRef = useRef(Boolean(location.state?.originMode));
  const autoSwitchedRef = useRef(Boolean(location.state?.originMode || GeolocationEngine.lastKnownPosition));
  const lastRouteFetchRef = useRef({ time: 0 });
  const offRouteCountRef = useRef(0);
  const requestIdRef = useRef(0);
  const wakeLockRef = useRef(null);

  // Derived Gate & Destination Coordinates
  const gate = useMemo(() => {
    return ADDU_GATES.find((g) => g.id === gateId) || ADDU_GATES[0];
  }, [gateId]);

  const dest = useMemo(() => {
    const pinpoint = getAccuratePinpoint(property);
    return {
      lat: Number(pinpoint?.lat || property?.latitude || 7.07),
      lng: Number(pinpoint?.lng || property?.longitude || 125.614),
    };
  }, [property?.latitude, property?.longitude, property?.lat, property?.lng, property?.id, property?.name]);

  const origin = useMemo(() => {
    if (originMode === 'gps' && gps.position) {
      return { lat: gps.position.lat, lng: gps.position.lng };
    }
    return { lat: gate.lat, lng: gate.lng };
  }, [originMode, gps.position, gate.lat, gate.lng]);

  // Mode thresholds
  const T = useMemo(() => {
    return {
      walk: { offRoute: 40, arrive: 25, farKm: 5 },
      drive: { offRoute: 60, arrive: 40, farKm: 20 },
    }[travelMode];
  }, [travelMode]);

  // Check far distance
  const farKm = useMemo(() => {
    if (originMode !== 'gps' || !gps.position) return null;
    const directMeters = calculateHaversineMeters(
      gps.position.lat,
      gps.position.lng,
      dest.lat,
      dest.lng
    );
    if (directMeters > T.farKm * 1000) {
      return (directMeters / 1000).toFixed(1);
    }
    return null;
  }, [originMode, gps.position, dest.lat, dest.lng, T.farKm]);

  // Stable route identity key to trigger camera fitBounds only when a route was freshly fetched
  const routeKey = useMemo(() => {
    return `${originMode}:${gateId}:${travelMode}:${routeFetchCount}`;
  }, [originMode, gateId, travelMode, routeFetchCount]);

  // 1. Fetch Accommodation Data if needed
  useEffect(() => {
    let isMounted = true;
    if (passedProperty) {
      setProperty(passedProperty);
      setLoading(false);
      return;
    }

    const benchmark = getKnownBenchmarkProperty(id);
    if (benchmark) {
      setProperty(benchmark);
      setLoading(false);
      return;
    }

    async function fetchProp() {
      try {
        setLoading(true);
        const data = await proximityService.getPropertyById(id, gateId, accessToken);
        if (isMounted) {
          setProperty(data);
          setError(null);
        }
      } catch (err) {
        console.warn('[LiveNavigationPage] Property fetch error:', err.message);
        if (isMounted) {
          setProperty(getKnownBenchmarkProperty(id) || null);
          setError('Could not load listing details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProp();
    return () => {
      isMounted = false;
    };
  }, [id, passedProperty, gateId, accessToken]);

  // 2. Mobile Screen WakeLock
  useEffect(() => {
    async function acquireWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // Ignore
        }
      }
    }
    acquireWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 3. Start Geolocation Tracking on Mount
  useEffect(() => {
    GeolocationEngine.startTracking({
      onLocation: (pos) => {
        // Always accept valid position coordinates without locking out accuracy > 500
        setGps({ status: 'ok', position: pos });
      },
      onBearing: (b) => {
        setHeading(b);
      },
      onError: (err) => {
        if (err.code === 1) {
          setGps((prev) => ({ ...prev, status: 'denied' }));
        } else if (err.code === 2 || err.code === 0) {
          setGps((prev) => ({ ...prev, status: 'unavailable' }));
        }
      },
    });

    return () => {
      GeolocationEngine.stopTracking();
    };
  }, []);

  // 4. One-time auto-switch to GPS when first good fix arrives
  useEffect(() => {
    if (
      gps.status === 'ok' &&
      gps.position &&
      !autoSwitchedRef.current &&
      !userChoseOriginRef.current
    ) {
      const dist = calculateHaversineMeters(
        gps.position.lat,
        gps.position.lng,
        dest.lat,
        dest.lng
      );
      if (dist <= T.farKm * 1000) {
        setOriginMode('gps');
        autoSwitchedRef.current = true;
      }
    }
  }, [gps.status, gps.position, dest.lat, dest.lng, T.farKm]);

  // 5. Route Fetching Effect
  const destLatRounded = Number(dest.lat.toFixed(5));
  const destLngRounded = Number(dest.lng.toFixed(5));
  const gpsEntryKey = originMode === 'gps' && gps.position ? 'has_gps' : 'no_gps';

  const triggerFetchRoute = useCallback(async () => {
    if (!destLatRounded || !destLngRounded) return;
    const reqId = ++requestIdRef.current;

    // Clear stale line immediately so wrong travelMode line never shows
    setRoute((r) => ({ status: 'loading', data: null, error: null }));
    setProgress(null);
    setArrived(false);

    try {
      const activeOrigin =
        originMode === 'gps' && gps.position
          ? { lat: gps.position.lat, lng: gps.position.lng }
          : { lat: gate.lat, lng: gate.lng };

      // Instant verified road route when originating from an ADDU campus gate
      if (originMode === 'gate' && property) {
        const verified = getVerifiedRoadRoute(gateId, property, travelMode);
        if (verified) {
          if (reqId === requestIdRef.current) {
            setRoute({
              status: 'ok',
              data: {
                ...verified,
                provider: 'verified',
              },
              error: null,
            });
            setRouteFetchCount((c) => c + 1);
            lastRouteFetchRef.current = { time: Date.now() };
            offRouteCountRef.current = 0;
            return;
          }
        }
      }

      const data = await fetchRoute(activeOrigin, dest, travelMode);
      if (reqId === requestIdRef.current) {
        setRoute({ status: 'ok', data, error: null });
        setRouteFetchCount((c) => c + 1);
        lastRouteFetchRef.current = { time: Date.now() };
        offRouteCountRef.current = 0;
      }
    } catch (err) {
      if (reqId === requestIdRef.current) {
        setRoute({ status: 'error', data: null, error: err.message || 'Route calculation failed' });
      }
    }
  }, [destLatRounded, destLngRounded, originMode, gps.position, gate.lat, gate.lng, dest, travelMode, gateId, property, id]);

  useEffect(() => {
    triggerFetchRoute();
  }, [originMode, gateId, travelMode, destLatRounded, destLngRounded, gpsEntryKey]);

  // 6. Progress and Arrival Tracking on each GPS fix
  useEffect(() => {
    if (originMode !== 'gps' || route.status !== 'ok' || !route.data || !gps.position) {
      return;
    }

    const { remainingMeters, offRouteMeters } = remainingAlongRoute(
      gps.position.lat,
      gps.position.lng,
      route.data.coordinates
    );

    const mins = remainingMinutes(
      route.data.durationSeconds,
      route.data.distanceMeters,
      remainingMeters
    );

    setProgress({ remainingMeters, minutes: mins });

    // Off-route reroute check: 2 consecutive fixes > threshold throttled to 10s
    if (offRouteMeters > T.offRoute) {
      offRouteCountRef.current += 1;
      const timeSinceFetch = Date.now() - lastRouteFetchRef.current.time;
      if (offRouteCountRef.current >= 2 && timeSinceFetch > 10000) {
        triggerFetchRoute();
      }
    } else {
      offRouteCountRef.current = 0;
    }

    // Arrival detection
    const distToDest = calculateHaversineMeters(
      gps.position.lat,
      gps.position.lng,
      dest.lat,
      dest.lng
    );
    if (distToDest <= T.arrive) {
      setArrived(true);
    }
  }, [gps.position, route.data, originMode, T.offRoute, T.arrive, dest.lat, dest.lng, triggerFetchRoute]);

  // Recalibrate GPS position handler
  const handleRecalibrateGps = useCallback(async () => {
    setRecalibrating(true);
    try {
      const fresh = await GeolocationEngine.recalibrate();
      setGps({ status: 'ok', position: fresh });
      setOriginMode('gps');
      setFollow(true);
    } catch (err) {
      console.warn('GPS Recalibrate error:', err);
    } finally {
      setRecalibrating(false);
    }
  }, []);

  // Handle manual drag fine-tuning of the user marker
  const handleUserDragEnd = useCallback((newCoords) => {
    const updated = GeolocationEngine.setManualLocation(newCoords);
    setGps({ status: 'ok', position: updated });
    setOriginMode('gps');
  }, []);

  // Stable callbacks for MapLibreTracker and TrackingBottomSheet
  const handleUserInteract = useCallback(() => {
    setFollow(false);
  }, []);

  const handleRecenter = useCallback(() => {
    setFollow(true);
    setRecenterCount((c) => c + 1);
  }, []);

  const handleChangeOriginMode = useCallback((newMode) => {
    userChoseOriginRef.current = true;
    setOriginMode(newMode);
    if (newMode === 'gps') {
      setFollow(true);
      if (!gps.position) {
        handleRecalibrateGps();
      }
    }
  }, [gps.position, handleRecalibrateGps]);

  const handleToggleMode = useCallback((newMode) => {
    setTravelMode((curr) => (curr !== newMode ? newMode : curr));
  }, []);

  const handleRetryRoute = useCallback(() => {
    triggerFetchRoute();
  }, [triggerFetchRoute]);

  const handlePickGate = useCallback(() => {
    setShowGateModal(true);
  }, []);

  const handleSelectGate = useCallback((selectedGate) => {
    userChoseOriginRef.current = true;
    setGateId(selectedGate.id);
    setOriginMode('gate');
    setShowGateModal(false);
  }, []);

  const handleSwitchToGate = useCallback(() => {
    userChoseOriginRef.current = true;
    setOriginMode('gate');
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-10 h-10 border-4 border-ateneo-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading live navigation...</p>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center gap-4">
        <AlertTriangle size={36} className="text-amber-400" />
        <h2 className="text-lg font-bold">Accommodation Not Found</h2>
        <p className="text-xs text-slate-400 max-w-xs">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-2xl bg-ateneo-blue text-white font-bold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Top Floating Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-slate-800 text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Exit Map</span>
        </button>

        {/* Heading-Up Toggle: Rendered ONLY if the device actually reported a heading */}
        {heading != null && !isNaN(heading) && (
          <button
            onClick={() => setHeadingUp((prev) => !prev)}
            className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md border shadow-lg transition active:scale-95 text-xs font-bold ${
              headingUp
                ? 'bg-ateneo-blue text-white border-blue-400'
                : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
            title={headingUp ? 'Heading-Up mode active' : 'North-Up mode active'}
          >
            <Compass size={15} />
            <span>{headingUp ? 'Heading-Up' : 'North-Up'}</span>
          </button>
        )}
      </div>

      {/* MapLibre GL 3D Road Tracking Canvas */}
      <MapLibreTracker
        property={property}
        dest={dest}
        origin={origin}
        originKind={originMode === 'gps' && gps.position ? 'gps' : 'gate'}
        gateName={gate.name}
        accuracy={originMode === 'gps' ? gps.position?.accuracy ?? null : null}
        routeCoords={route.data?.coordinates || null}
        routeKey={routeKey}
        travelMode={travelMode}
        heading={heading}
        headingUp={headingUp}
        follow={follow}
        recenterTrigger={recenterCount}
        onUserInteract={handleUserInteract}
        onUserDragEnd={handleUserDragEnd}
      />

      {/* Responsive Turn-By-Turn Bottom Sheet with Origin, Mode & ETA */}
      <TrackingBottomSheet
        property={property}
        originMode={originMode}
        onChangeOriginMode={handleChangeOriginMode}
        gateName={gate.name}
        onPickGate={handlePickGate}
        travelMode={travelMode}
        onToggleMode={handleToggleMode}
        gpsStatus={gps.status}
        gpsAccuracy={gps.position?.accuracy ?? null}
        recalibrating={recalibrating}
        onRecalibrateGps={handleRecalibrateGps}
        route={route}
        progress={progress}
        arrived={arrived}
        farKm={farKm}
        onSwitchToGate={handleSwitchToGate}
        onRetryRoute={handleRetryRoute}
        onRecenter={handleRecenter}
        onStopTracking={() => navigate(-1)}
        follow={follow}
      />

      {/* Gate Selector Modal (Campus Gates List Only) */}
      <LandmarkSelectorModal
        isOpen={showGateModal}
        currentOriginName={gate.name}
        property={property}
        onSelect={handleSelectGate}
        onClose={() => setShowGateModal(false)}
      />
    </div>
  );
}
