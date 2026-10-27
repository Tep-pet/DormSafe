import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, AlertTriangle, ShieldCheck, MapPin, Footprints, Car, Crosshair } from 'lucide-react';
import { MapLibreTracker } from '../../components/map/MapLibreTracker.jsx';
import { TrackingBottomSheet } from '../../components/map/TrackingBottomSheet.jsx';
import { LandmarkSelectorModal, ADDU_LANDMARKS } from '../../components/map/LandmarkSelectorModal.jsx';
import { proximityService } from '../../services/proximityService.js';
import { GeolocationEngine } from '../../services/map/GeolocationEngine.js';
import { RouteService } from '../../services/map/RouteService.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getAccuratePinpoint,
  getKnownWalkingMinutes,
  getKnownDrivingMinutes,
  getDynamicGoogleMapsTimes,
  calculateStraightLineDistance,
} from '../../utils/propertyCoordinates.js';

export function LiveNavigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // If passed directly via router state, use it immediately (zero loading screen)
  const passedProperty = location.state?.property;

  const [property, setProperty] = useState(passedProperty || null);
  const [loading, setLoading] = useState(!passedProperty);
  const [error, setError] = useState(null);

  // Travel Mode (Walking vs Car)
  const [travelMode, setTravelMode] = useState('walking');

  // Origin & Starting Location Selection States
  const [showOriginModal, setShowOriginModal] = useState(true);
  const [originType, setOriginType] = useState('gate'); // 'gps' | 'gate'
  const [originName, setOriginName] = useState('Ateneo Roxas Gate');

  // GPS Detection States
  const [detectedGps, setDetectedGps] = useState(null);
  const [isDetectingGps, setIsDetectingGps] = useState(true);
  const [gpsError, setGpsError] = useState(null);

  // Live Location & Map State
  const defaultGate = ADDU_LANDMARKS[0]; // Roxas Gate
  const [userLocation, setUserLocation] = useState({ lat: defaultGate.lat, lng: defaultGate.lng });
  const [userBearing, setUserBearing] = useState(0);

  const initialWalk = getKnownWalkingMinutes('roxas', passedProperty) || 6;
  const initialDrive = getKnownDrivingMinutes('roxas', passedProperty) || 3;

  const [routeStats, setRouteStats] = useState({
    distanceMeters: passedProperty?.distance_meters || 520,
    durationMinutes: initialWalk,
    walkingMinutes: initialWalk,
    drivingMinutes: initialDrive,
  });

  const [isArrived, setIsArrived] = useState(false);
  const [isCompassMode, setIsCompassMode] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  const wakeLockRef = useRef(null);

  // 1. Fetch Accommodation Data if not already in state
  useEffect(() => {
    let isMounted = true;
    if (passedProperty) {
      setProperty(passedProperty);
      setLoading(false);
      return;
    }

    async function fetchProperty() {
      try {
        setLoading(true);
        const data = await proximityService.getPropertyById(id, 'roxas', accessToken);
        if (isMounted) setProperty(data);
      } catch (err) {
        console.warn('API fetch failed, falling back to local listing catalog:', err);
        const fallbackProp = {
          id,
          name: 'BRC Dormitory',
          address: 'Padre Gomez St & A Bonifacio St, Barangay 34-D, Davao City',
          latitude: 7.0680548,
          longitude: 125.6125343,
          is_verified: true,
        };
        if (isMounted) {
          setProperty(fallbackProp);
          setError(null);
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
  }, [id, passedProperty, accessToken]);

  // 2. Request Mobile Screen WakeLock (prevents phone screen turning black while walking)
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

  // 3. Immediately Detect Student Location on Page Load
  const detectGpsLocation = useCallback(() => {
    setIsDetectingGps(true);
    setGpsError(null);

    GeolocationEngine.getCurrentPosition({ timeout: 9000 })
      .then((coords) => {
        setDetectedGps(coords);
        setIsDetectingGps(false);
      })
      .catch((err) => {
        console.warn('One-shot GPS detection noticed:', err?.message);
        setGpsError(err?.message || 'Device GPS fix unavailable');
        setIsDetectingGps(false);
      });
  }, []);

  useEffect(() => {
    detectGpsLocation();
    return () => {
      GeolocationEngine.stopTracking();
    };
  }, [detectGpsLocation]);

  // 4. Handle Starting Location Choice
  const handleOriginSelect = (selection) => {
    RouteService.reset();
    setRecenterCount((c) => c + 1);

    if (selection.type === 'gps') {
      setOriginType('gps');
      setOriginName('My Live Location (GPS)');
      setUserLocation({ lat: selection.lat, lng: selection.lng });

      // Calculate dynamic times to destination
      const dest = getAccuratePinpoint(property);
      const distInfo = calculateStraightLineDistance(selection.lat, selection.lng, dest.lat, dest.lng);
      const dynamicTimes = getDynamicGoogleMapsTimes(distInfo.distanceMeters);

      setRouteStats({
        distanceMeters: distInfo.distanceMeters,
        durationMinutes: travelMode === 'driving' ? dynamicTimes.drivingMinutes : dynamicTimes.walkingMinutes,
        walkingMinutes: dynamicTimes.walkingMinutes,
        drivingMinutes: dynamicTimes.drivingMinutes,
      });

      // Start continuous watch tracking so movement updates live
      GeolocationEngine.startTracking({
        onLocation: (pos) => {
          setUserLocation(pos);
          setDetectedGps(pos);
        },
        onBearing: (bearing) => {
          setUserBearing(bearing);
        },
        onError: (err) => {
          console.warn('Continuous GPS tracking warning:', err.message);
        },
      });
    } else {
      // Campus Gate Selected
      GeolocationEngine.stopTracking();
      setOriginType('gate');
      setOriginName(selection.name);
      setUserLocation({ lat: selection.lat, lng: selection.lng });

      const walkMins = selection.walkingMinutes ?? getKnownWalkingMinutes(selection.gateId, property) ?? 4;
      const driveMins = selection.drivingMinutes ?? getKnownDrivingMinutes(selection.gateId, property) ?? 2;

      setRouteStats((prev) => ({
        ...prev,
        durationMinutes: travelMode === 'driving' ? driveMins : walkMins,
        walkingMinutes: walkMins,
        drivingMinutes: driveMins,
      }));
    }

    setShowOriginModal(false);
  };

  // 5. Handle Travel Mode Switch
  const handleTravelModeChange = (newMode) => {
    setTravelMode(newMode);
    RouteService.reset();
    setRecenterCount((c) => c + 1);

    setRouteStats((prev) => ({
      ...prev,
      durationMinutes: newMode === 'driving' ? prev.drivingMinutes : prev.walkingMinutes,
    }));
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-10 h-10 border-4 border-ateneo-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading live navigation map...</p>
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
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-slate-800 text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          <span>Exit Map</span>
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Starting Origin Quick Selector Button */}
          <button
            type="button"
            onClick={() => setShowOriginModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-ateneo-blue text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-blue-50"
            title="Click to choose or change starting location"
          >
            {originType === 'gps' ? (
              <Crosshair size={14} className="text-blue-600 animate-pulse" />
            ) : (
              <MapPin size={14} className="text-ateneo-blue" />
            )}
            <span className="hidden sm:inline text-slate-500 font-normal">Origin:</span>
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {originName.replace('Ateneo ', '')}
            </span>
          </button>

          {/* Heading / Compass Mode Toggle */}
          <button
            type="button"
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

      {/* MapLibre GL 3D Map Canvas */}
      <MapLibreTracker
        property={property}
        userLocation={userLocation}
        userBearing={userBearing}
        isCompassMode={isCompassMode}
        travelMode={travelMode}
        recenterTrigger={recenterCount}
        onRouteStats={(stats) => {
          setRouteStats((prev) => ({
            ...prev,
            distanceMeters: stats.distanceMeters,
            durationMinutes: stats.durationMinutes,
            walkingMinutes: stats.walkingMinutes || prev.walkingMinutes,
            drivingMinutes: stats.drivingMinutes || prev.drivingMinutes,
          }));
        }}
        onArrival={() => setIsArrived(true)}
      />

      {/* Responsive Grab-Style Bottom Sheet */}
      <TrackingBottomSheet
        property={property}
        routeStats={routeStats}
        isArrived={isArrived}
        originName={originName}
        originType={originType}
        travelMode={travelMode}
        onTravelModeChange={handleTravelModeChange}
        onRecenter={() => setRecenterCount((c) => c + 1)}
        onSelectManualOrigin={() => setShowOriginModal(true)}
        onStopTracking={() => navigate(-1)}
      />

      {/* Starting Location Deciding Modal (Opens first to let student choose) */}
      <LandmarkSelectorModal
        isOpen={showOriginModal}
        onSelect={handleOriginSelect}
        onClose={() => setShowOriginModal(false)}
        detectedGps={detectedGps}
        isDetectingGps={isDetectingGps}
        gpsError={gpsError}
        onRetryGps={detectGpsLocation}
        property={property}
        currentOriginName={originName}
      />
    </div>
  );
}
