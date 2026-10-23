import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { MapLibreTracker } from '../../components/map/MapLibreTracker.jsx';
import { TrackingBottomSheet } from '../../components/map/TrackingBottomSheet.jsx';
import { PermissionPromptModal } from '../../components/map/PermissionPromptModal.jsx';
import { LandmarkSelectorModal, ADDU_LANDMARKS } from '../../components/map/LandmarkSelectorModal.jsx';
import { proximityService } from '../../services/proximityService.js';
import { GeolocationEngine } from '../../services/map/GeolocationEngine.js';
import { RouteService } from '../../services/map/RouteService.js';
import { useAuth } from '../../hooks/useAuth.js';

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

  // Permission & Modals
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLandmarkModal, setShowLandmarkModal] = useState(false);

  // Live Location & Navigation State
  const [userLocation, setUserLocation] = useState(null);
  const [userBearing, setUserBearing] = useState(0);
  const [originName, setOriginName] = useState('Ateneo Main Gate (Jacinto)');
  const [routeStats, setRouteStats] = useState({ distanceMeters: null, durationMinutes: null });
  const [isArrived, setIsArrived] = useState(false);
  const [isCompassMode, setIsCompassMode] = useState(true);
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
        const data = await proximityService.getPropertyById(id, 'jacinto', accessToken);
        if (isMounted) setProperty(data);
      } catch (err) {
        console.error('Error fetching property for navigation:', err);
        if (isMounted) setError('Unable to load accommodation details.');
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

  // 3. Check Initial Geolocation Permission State
  useEffect(() => {
    GeolocationEngine.checkPermission().then((status) => {
      if (status === 'granted') {
        startLiveGPS();
      } else if (status === 'denied') {
        // Fall back directly to campus landmark picker (e.g. for desktop or denied users)
        setOriginName('Ateneo Main Gate (Jacinto)');
        setUserLocation({ lat: ADDU_LANDMARKS[0].lat, lng: ADDU_LANDMARKS[0].lng });
      } else {
        // 'prompt' -> Show educational pre-permission modal first
        setShowPermissionModal(true);
      }
    });

    return () => {
      GeolocationEngine.stopTracking();
    };
  }, []);

  const startLiveGPS = () => {
    setShowPermissionModal(false);

    // Fallback timer for laptops / desktops without hardware GPS chips (3.5 seconds)
    const fallbackTimer = setTimeout(() => {
      setUserLocation((curr) => {
        if (!curr) {
          console.info('GPS hardware fix delayed (common on laptops/desktops). Using default Ateneo Jacinto Gate.');
          setOriginName('Ateneo Main Gate (Jacinto)');
          return { lat: ADDU_LANDMARKS[0].lat, lng: ADDU_LANDMARKS[0].lng };
        }
        return curr;
      });
    }, 3500);

    GeolocationEngine.startTracking({
      onLocation: (pos) => {
        clearTimeout(fallbackTimer);
        setUserLocation(pos);
        setOriginName('My Live Location (GPS)');
      },
      onBearing: (bearing) => {
        setUserBearing(bearing);
      },
      onError: (err) => {
        clearTimeout(fallbackTimer);
        console.warn('Geolocation error / device GPS unavailable:', err.message);
        // Fall back gracefully to Ateneo Jacinto Gate so desktop and laptop users immediately see the route
        setUserLocation({ lat: ADDU_LANDMARKS[0].lat, lng: ADDU_LANDMARKS[0].lng });
        setOriginName('Ateneo Main Gate (Jacinto)');
      },
    });
  };

  const handleLandmarkSelect = (landmark) => {
    GeolocationEngine.stopTracking();
    setUserLocation({ lat: landmark.lat, lng: landmark.lng });
    setOriginName(landmark.name);
    setShowLandmarkModal(false);
    setRecenterCount((c) => c + 1);
    RouteService.reset();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-10 h-10 border-4 border-ateneo-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading live walking route...</p>
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
      {/* Top Floating Controls Overlay — fully responsive on mobile, tablet, and laptop */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-slate-800 text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          <span>Exit Map</span>
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Starting Origin Quick Selector (essential for laptops/desktops without GPS) */}
          <button
            onClick={() => setShowLandmarkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/95 text-ateneo-blue text-xs font-bold backdrop-blur-md border border-slate-200/90 shadow-lg active:scale-95 transition hover:bg-blue-50"
            title="Click to change starting campus gate or landmark"
          >
            <MapPin size={13} className="text-ateneo-blue shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-normal">Origin:</span>
            <span className="max-w-[110px] sm:max-w-[150px] md:max-w-[180px] truncate">
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
            title={isCompassMode ? 'Map rotates with your walking direction' : 'Map locked North-up'}
          >
            <Compass size={15} />
            <span className="hidden md:inline">{isCompassMode ? 'Heading-Up' : 'North-Up'}</span>
          </button>
        </div>
      </div>

      {/* MapLibre GL 3D Walking Canvas */}
      <MapLibreTracker
        property={property}
        userLocation={userLocation}
        userBearing={userBearing}
        isCompassMode={isCompassMode}
        recenterTrigger={recenterCount}
        onRouteStats={(stats) => setRouteStats(stats)}
        onArrival={() => setIsArrived(true)}
      />

      {/* Responsive Grab-Style Bottom Sheet (Mobile, Tablet & Laptop Friendly) */}
      <TrackingBottomSheet
        property={property}
        routeStats={routeStats}
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
          setOriginName('Ateneo Main Gate (Jacinto)');
          setUserLocation({ lat: ADDU_LANDMARKS[0].lat, lng: ADDU_LANDMARKS[0].lng });
        }}
      />

      {/* Campus Landmark Selector Modal */}
      <LandmarkSelectorModal
        isOpen={showLandmarkModal}
        onSelect={handleLandmarkSelect}
        onClose={() => setShowLandmarkModal(false)}
      />
    </div>
  );
}
