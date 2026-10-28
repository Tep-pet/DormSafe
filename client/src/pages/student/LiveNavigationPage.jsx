import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, AlertTriangle, ShieldCheck, MapPin, Footprints, Car } from 'lucide-react';
import { MapLibreTracker } from '../../components/map/MapLibreTracker.jsx';
import { TrackingBottomSheet } from '../../components/map/TrackingBottomSheet.jsx';
import { PermissionPromptModal } from '../../components/map/PermissionPromptModal.jsx';
import { LandmarkSelectorModal } from '../../components/map/LandmarkSelectorModal.jsx';
import { ADDU_GATES, CAMPUS_GATES } from '../../constants/campusGates.js';
import { proximityService } from '../../services/proximityService.js';
import { GeolocationEngine } from '../../services/map/GeolocationEngine.js';
import { RouteService } from '../../services/map/RouteService.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getKnownWalkingMinutes,
  getKnownDrivingMinutes,
  getKnownTravelDuration,
  getVerifiedRoadRoute,
  getPreferredCampusGate,
  getKnownBenchmarkProperty,
} from '../../utils/propertyCoordinates.js';
import { calculateHaversineMeters } from '../../services/map/GeoUtils.js';

export function LiveNavigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // If passed directly via router state, use it immediately (zero loading screen)
  const passedProperty = location.state?.property;

  // Determine default starting gate (Roxas Gate is the primary reference gate)
  const queryGate = new URLSearchParams(location.search).get('gate');
  const resolvedGateId = queryGate || location.state?.initialGate || 'roxas';
  const defaultGate = ADDU_GATES.find((g) => g.id === resolvedGateId) || ADDU_GATES.find((g) => g.id === 'roxas') || ADDU_GATES[0];

  const [property, setProperty] = useState(passedProperty || null);
  const [loading, setLoading] = useState(!passedProperty);
  const [error, setError] = useState(null);

  // Permission & Modals
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLandmarkModal, setShowLandmarkModal] = useState(!queryGate);

  // GPS Detection State: 'detecting' | 'detected' | 'unavailable'
  const [gpsStatus, setGpsStatus] = useState('detecting');
  const [gpsErrorMessage, setGpsErrorMessage] = useState(null);
  const [detectedGpsPos, setDetectedGpsPos] = useState(null);

  // Travel Mode: 'walk' is selected by default; 'drive' is optional toggle
  const [travelMode, setTravelMode] = useState(location.state?.travelMode || 'walk');

  // Live Location & Navigation State
  const [userLocation, setUserLocation] = useState({ lat: defaultGate.lat, lng: defaultGate.lng });
  const [userBearing, setUserBearing] = useState(0);
  const [originName, setOriginName] = useState(defaultGate.name);

  const verifiedInitial = getVerifiedRoadRoute(defaultGate.id, passedProperty, location.state?.travelMode || 'walk');
  const initialDuration = getKnownTravelDuration(defaultGate.id, passedProperty, location.state?.travelMode || 'walk') || verifiedInitial?.durationMinutes || 6;

  const [routeStats, setRouteStats] = useState({
    distanceMeters: verifiedInitial?.distanceMeters || passedProperty?.distance_meters || 450,
    durationMinutes: initialDuration,
    formattedDistance: verifiedInitial?.formattedDistance || `${verifiedInitial?.distanceMeters || 450} m`,
    formattedDuration: `${initialDuration} min`,
    durationText: `${initialDuration} min`,
    distanceText: verifiedInitial?.formattedDistance || `${verifiedInitial?.distanceMeters || 450} m`,
    summary: verifiedInitial?.summary || 'via pedestrian road network',
    mode: location.state?.travelMode || 'walk',
  });
  const [isArrived, setIsArrived] = useState(false);
  const [isCompassMode, setIsCompassMode] = useState(true);
  const [recenterCount, setRecenterCount] = useState(0);

  const wakeLockRef = useRef(null);

  // Recalculates route and duration using Google Directions & verified road network (never straight lines)
  const recalculateRouteForLocation = useCallback(async (originCoords, mode, currentName) => {
    if (!originCoords || !property) return;
    const destLat = Number(property.latitude || 7.072);
    const destLng = Number(property.longitude || 125.614);

    try {
      const route = await RouteService.fetchRoute(originCoords, { lat: destLat, lng: destLng }, mode, property);
      if (route) {
        setRouteStats({
          distanceMeters: route.distanceMeters,
          durationMinutes: route.durationMinutes,
          formattedDistance: route.formattedDistance || `${route.distanceMeters} m`,
          formattedDuration: route.formattedDuration || `${route.durationMinutes} min`,
          durationText: route.durationText || route.formattedDuration || `${route.durationMinutes} min`,
          distanceText: route.distanceText || route.formattedDistance || `${route.distanceMeters} m`,
          summary: route.summary || 'via road network',
          mode,
          coordinates: route.coordinates,
          isFallback: route.isFallback,
        });
      }
    } catch (err) {
      console.warn('[LiveNavigationPage] Route calculation notice:', err.message);
    }
  }, [property]);

  // Request browser geolocation with enableHighAccuracy: true
  const requestGeolocation = useCallback(() => {
    setGpsStatus('detecting');
    setGpsErrorMessage(null);

    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      setGpsErrorMessage('Geolocation is not supported by your browser. Please select an Ateneo campus gate below.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDetectedGpsPos(coords);
        setGpsStatus('detected');
        setGpsErrorMessage(null);
      },
      (err) => {
        console.info('[LiveNavigationPage] GPS error:', err.message);
        setGpsStatus('unavailable');
        if (err.code === 1) {
          setGpsErrorMessage('Location permission was denied. Please allow location access in your browser settings to track from your position, or choose an Ateneo campus gate below.');
        } else if (err.code === 3) {
          setGpsErrorMessage('Location request timed out. Please check your GPS signal or select an Ateneo campus gate below.');
        } else {
          setGpsErrorMessage('Unable to determine location. Please select an Ateneo campus gate below.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // 1. Proactively detect student's live GPS location as soon as page mounts
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  // 2. Fetch Accommodation Data if not already in state
  useEffect(() => {
    let isMounted = true;
    if (passedProperty) {
      setProperty(passedProperty);
      setLoading(false);
      return;
    }

    // Instant zero-delay resolution for benchmark dorms (Corella, BRC, Residencia, Juan Luna, Ivory)
    const benchmarkProp = getKnownBenchmarkProperty(id);
    if (benchmarkProp) {
      setProperty(benchmarkProp);
      setLoading(false);
      recalculateRouteForLocation({ lat: defaultGate.lat, lng: defaultGate.lng }, travelMode, defaultGate.name);
      return;
    }

    // Safety fallback timer so page never hangs if backend API is offline
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.info('[LiveNavigationPage] Using local fallback catalog accommodation');
        const fallbackProp = {
          id: id || 'corella',
          name: 'Corella Dormitory',
          address: '108 Roxas Avenue, Davao City, Philippines, 8000',
          latitude: 7.06945,
          longitude: 125.61468,
          is_verified: true,
        };
        setProperty(fallbackProp);
        setLoading(false);
        recalculateRouteForLocation({ lat: defaultGate.lat, lng: defaultGate.lng }, travelMode, defaultGate.name);
      }
    }, 1500);

    async function fetchProperty() {
      try {
        setLoading(true);
        const data = await proximityService.getPropertyById(id, defaultGate.id, accessToken);
        clearTimeout(safetyTimer);
        if (isMounted) {
          setProperty(data);
          recalculateRouteForLocation({ lat: defaultGate.lat, lng: defaultGate.lng }, travelMode, defaultGate.name);
        }
      } catch (err) {
        clearTimeout(safetyTimer);
        console.warn('API fetch failed, falling back to local listing catalog:', err);
        const fallbackProp = {
          id: id || 'corella',
          name: 'Corella Dormitory',
          address: '108 Roxas Avenue, Davao City, Philippines, 8000',
          latitude: 7.06945,
          longitude: 125.61468,
          is_verified: true,
        };
        if (isMounted) {
          setProperty(fallbackProp);
          setError(null);
          recalculateRouteForLocation({ lat: defaultGate.lat, lng: defaultGate.lng }, travelMode, defaultGate.name);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProperty();
    return () => {
      isMounted = false;
      RouteService.reset();
    };
  }, [id, passedProperty, accessToken, defaultGate.id, defaultGate.lat, defaultGate.lng, defaultGate.name, recalculateRouteForLocation, travelMode]);

  // 3. Request Mobile Screen WakeLock (prevents phone screen turning black while walking)
  useEffect(() => {
    async function acquireWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // Silent ignore if unsupported
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

  const startLiveGPS = useCallback(() => {
    setShowPermissionModal(false);
    setShowLandmarkModal(false);
    RouteService.reset();

    // If GPS was already detected during modal, immediately set position and calculate road route
    if (detectedGpsPos) {
      setUserLocation(detectedGpsPos);
      setOriginName('My Current Location (Live GPS)');
      setRecenterCount((c) => c + 1);
      recalculateRouteForLocation(detectedGpsPos, travelMode, 'My Current Location (Live GPS)');
    }

    // Fallback timer for devices without GPS fixes (3.5 seconds)
    const fallbackTimer = setTimeout(() => {
      setUserLocation((curr) => {
        if (!curr) {
          console.info('GPS fix delayed. Using default Ateneo Roxas gate.');
          setOriginName(defaultGate.name);
          return { lat: defaultGate.lat, lng: defaultGate.lng };
        }
        return curr;
      });
    }, 3500);

    GeolocationEngine.startTracking({
      onLocation: (pos) => {
        clearTimeout(fallbackTimer);
        setUserLocation(pos);
        setDetectedGpsPos(pos);
        setGpsStatus('detected');
        setOriginName('My Current Location (Live GPS)');
      },
      onBearing: (bearing) => {
        setUserBearing(bearing);
      },
      onError: (err) => {
        clearTimeout(fallbackTimer);
        console.warn('Geolocation tracking notice:', err.message);
        if (!detectedGpsPos) {
          setUserLocation({ lat: defaultGate.lat, lng: defaultGate.lng });
          setOriginName(defaultGate.name);
          recalculateRouteForLocation({ lat: defaultGate.lat, lng: defaultGate.lng }, travelMode, defaultGate.name);
        }
      },
    });
  }, [detectedGpsPos, defaultGate, travelMode, recalculateRouteForLocation]);

  const handleLandmarkSelect = (landmark) => {
    GeolocationEngine.stopTracking();
    setUserLocation({ lat: landmark.lat, lng: landmark.lng });
    setOriginName(landmark.name);
    setShowLandmarkModal(false);
    setRecenterCount((c) => c + 1);
    RouteService.reset();

    // Recalculate route and duration from chosen gate using Google Directions & verified paths
    recalculateRouteForLocation({ lat: landmark.lat, lng: landmark.lng }, travelMode, landmark.name);
  };

  const handleToggleMode = (newMode) => {
    if (newMode === travelMode) return;
    setTravelMode(newMode);
    RouteService.reset();

    if (userLocation) {
      recalculateRouteForLocation(userLocation, newMode, originName);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-10 h-10 border-4 border-ateneo-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading live road navigation...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center gap-4">
        <AlertTriangle size={36} className="text-amber-400" />
        <h2 className="text-lg font-bold">Accommodation Not Found</h2>
        <p className="text-xs text-slate-400 max-w-xs">{error || 'Could not find listing coordinates.'}</p>
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

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Walk / Drive Mode Quick Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg">
            <button
              onClick={() => handleToggleMode('walk')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition ${
                travelMode === 'walk'
                  ? 'bg-ateneo-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Walk on pedestrian roads"
            >
              <Footprints size={13} />
              <span className="hidden sm:inline">Walk</span>
            </button>
            <button
              onClick={() => handleToggleMode('drive')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition ${
                travelMode === 'drive'
                  ? 'bg-ateneo-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Drive on vehicular roads"
            >
              <Car size={13} />
              <span className="hidden sm:inline">Drive</span>
            </button>
          </div>

          {/* Starting Origin Quick Selector (Current GPS or Campus Gates) */}
          <button
            onClick={() => setShowLandmarkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/95 text-ateneo-blue text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-blue-50"
            title="Click to choose starting point (Current GPS or Ateneo Gates)"
          >
            <MapPin size={13} className="text-ateneo-blue shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-normal">Origin:</span>
            <span className="max-w-[100px] sm:max-w-[140px] md:max-w-[170px] truncate">
              {originName.replace('Ateneo ', '')}
            </span>
          </button>

          {/* Heading / Compass Mode Toggle */}
          <button
            onClick={() => setIsCompassMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md border shadow-lg transition active:scale-95 text-xs font-bold ${
              isCompassMode
                ? 'bg-ateneo-blue text-white border-blue-400'
                : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
            title={isCompassMode ? 'Map rotates with your direction' : 'Map locked North-up'}
          >
            <Compass size={15} />
            <span className="hidden md:inline">{isCompassMode ? 'Heading-Up' : 'North-Up'}</span>
          </button>
        </div>
      </div>

      {/* MapLibre GL 3D Turn-By-Turn Road Tracking Canvas */}
      <MapLibreTracker
        property={property}
        userLocation={userLocation}
        userBearing={userBearing}
        isCompassMode={isCompassMode}
        travelMode={travelMode}
        recenterTrigger={recenterCount}
        onRouteStats={(stats) => setRouteStats(stats)}
        onArrival={() => setIsArrived(true)}
      />

      {/* Responsive Turn-By-Turn Bottom Sheet with Mode & ETA */}
      <TrackingBottomSheet
        property={property}
        routeStats={routeStats}
        travelMode={travelMode}
        onToggleMode={handleToggleMode}
        isArrived={isArrived}
        originName={originName}
        onRecenter={() => setRecenterCount((c) => c + 1)}
        onSelectManualOrigin={() => setShowLandmarkModal(true)}
        onStopTracking={() => navigate(-1)}
      />

      {/* Pre-Permission Modal */}
      <PermissionPromptModal
        isOpen={showPermissionModal}
        onAllow={startLiveGPS}
        onDeny={() => {
          setShowPermissionModal(false);
          setOriginName(defaultGate.name);
          setUserLocation({ lat: defaultGate.lat, lng: defaultGate.lng });
        }}
      />

      {/* Starting Point Choice Modal: Live GPS or Ateneo Gates */}
      <LandmarkSelectorModal
        isOpen={showLandmarkModal}
        currentOriginName={originName}
        property={property}
        gpsStatus={gpsStatus}
        gpsErrorMessage={gpsErrorMessage}
        onSelect={handleLandmarkSelect}
        onSelectCurrentLocation={startLiveGPS}
        onRetryGps={requestGeolocation}
        onClose={() => setShowLandmarkModal(false)}
      />
    </div>
  );
}
