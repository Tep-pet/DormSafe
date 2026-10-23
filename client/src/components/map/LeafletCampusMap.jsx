import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { getAccuratePinpoint, calculateStraightLineDistance } from '../../utils/propertyCoordinates';
import { formatPrice } from '../../utils/formatPrice';
import { useNavigate } from 'react-router-dom';
import { Navigation, Footprints, Car, X, Crosshair, MapPin, Compass } from 'lucide-react';

// Setup Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * 100% Free, Mobile-Friendly Campus Map for DormSafe
 * Starting Point: Ateneo de Davao University (Jacinto / Roxas Gates)
 * To: Exact Pinpoint Location of Each Property
 */
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

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  // State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [activeDorm, setActiveDorm] = useState(selectedProperty || null);
  const [travelMode, setTravelMode] = useState('walking'); // 'walking' | 'driving'
  const [routeInfo, setRouteInfo] = useState(null); // { distanceMeters, durationMinutes }
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeOriginMode, setRouteOriginMode] = useState('ateneo'); // 'ateneo' | 'gps'

  // Sync selectedProperty prop
  useEffect(() => {
    if (selectedProperty) {
      setActiveDorm(selectedProperty);
    }
  }, [selectedProperty]);

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

      // Attribution bottom-right
      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap' })
        .addTo(map);

      // Zoom control on top-left
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

  // 2. Watch live user GPS (for user reference dot only; does not override default starting point)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Render Live User Dot (if permitted)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const userPos = [userLocation.lat, userLocation.lng];

      const userDotIcon = L.divIcon({
        className: 'custom-live-user-dot',
        html: `<div class="user-live-dot" title="You are here"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userPos, { icon: userDotIcon, zIndexOffset: 800 })
          .addTo(map)
          .bindPopup('<b>Your Current Location</b><br/>GPS signal active');
      } else {
        userMarkerRef.current.setLatLng(userPos);
      }

      if (userLocation.accuracy) {
        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle(userPos, {
            radius: Math.min(userLocation.accuracy, 150),
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          userAccuracyCircleRef.current.setLatLng(userPos);
          userAccuracyCircleRef.current.setRadius(Math.min(userLocation.accuracy, 150));
        }
      }
    }
  }, [userLocation]);

  // 4. Update Ateneo de Davao Campus Gate Pin & 2km Perimeter Circle
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

    // Ateneo de Davao Gate Marker (Distinctive Blue & Gold Crest)
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
        `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:700;">${gate.label}</span><br/><small>Campus Origin / Starting Point</small>`
      );
    } else {
      gateMarkerRef.current = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(
          `<b>Ateneo de Davao University</b><br/><span style="color:#003366;font-weight:700;">${gate.label}</span><br/><small>Campus Origin / Starting Point</small>`
        );
    }

    // Recenter if no dorm route is currently active
    if (!activeDorm) {
      map.setView([gate.lat, gate.lng], 15, { animate: true });
    }
  }, [gate, activeDorm]);

  // 5. Update Dorm Markers with accurate pinpoints
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

      const marker = L.marker([pinpoint.lat, pinpoint.lng], { icon: propIcon, zIndexOffset: isCurrent ? 600 : 300 }).addTo(map);

      marker.on('click', () => {
        setActiveDorm(p);
        onMarkerClick?.(p);
      });

      markersRef.current.push(marker);
    });
  }, [properties, activeDorm, onMarkerClick]);

  // 6. Calculate Route: Always Starting from Ateneo de Davao University
  const calculateRoute = useCallback(async () => {
    if (!activeDorm) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    // Starting Point:
    // Default and primary: Ateneo de Davao University (Campus Gate)
    // Optional toggle: student's live GPS if explicitly toggled to 'gps'
    let startLat = gate.lat;
    let startLng = gate.lng;

    if (routeOriginMode === 'gps' && userLocation) {
      startLat = userLocation.lat;
      startLng = userLocation.lng;
    }

    const destPinpoint = getAccuratePinpoint(activeDorm);

    setLoadingRoute(true);

    try {
      const profile = travelMode === 'driving' ? 'driving' : 'foot';
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${destPinpoint.lng},${destPinpoint.lat}?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl);
      const data = await res.json();

      if (data?.routes?.[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        const polyline = L.polyline(coordinates, {
          color: travelMode === 'driving' ? '#0284c7' : '#003366',
          weight: 5,
          opacity: 0.88,
          dashArray: travelMode === 'driving' ? null : '6, 8',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;

        // Auto zoom bounds to fit route nicely
        map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 17 });

        setRouteInfo({
          distanceMeters: Math.round(route.distance),
          durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        });
        return;
      }
      throw new Error('No OSRM route');
    } catch (err) {
      console.warn('OSRM Route notice (using direct path):', err.message);

      // Direct line fallback connecting Ateneo Gate directly to Property Pinpoint
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const straightCoords = [
        [startLat, startLng],
        [destPinpoint.lat, destPinpoint.lng],
      ];

      const fallbackLine = L.polyline(straightCoords, {
        color: '#003366',
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 6',
      }).addTo(map);

      routePolylineRef.current = fallbackLine;
      map.fitBounds(fallbackLine.getBounds(), { padding: [45, 45], maxZoom: 17 });

      const estimate = calculateStraightLineDistance(
        startLat,
        startLng,
        destPinpoint.lat,
        destPinpoint.lng
      );

      setRouteInfo({
        distanceMeters: estimate.distanceMeters,
        durationMinutes: estimate.durationMinutes,
      });
    } finally {
      setLoadingRoute(false);
      map.invalidateSize();
    }
  }, [activeDorm, gate, travelMode, routeOriginMode, userLocation]);

  // Recalculate route when active dorm, gate, or travel mode changes
  useEffect(() => {
    if (activeDorm) {
      calculateRoute();
    } else {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      setRouteInfo(null);
    }
  }, [activeDorm, gate, travelMode, routeOriginMode, calculateRoute]);

  // Recenter map on Ateneo de Davao campus gate
  const handleRecenterAteneo = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([gate.lat, gate.lng], 16, { animate: true });
  };

  // Recenter map on live user GPS
  const handleRecenterUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    } else {
      map.setView([gate.lat, gate.lng], 15, { animate: true });
    }
  };

  // Clear current route
  const handleClearRoute = () => {
    setActiveDorm(null);
    setRouteInfo(null);
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([gate.lat, gate.lng], 15, { animate: true });
    }
  };

  const activePinpoint = activeDorm ? getAccuratePinpoint(activeDorm) : null;

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Recenter on Ateneo Gate */}
        <button
          type="button"
          onClick={handleRecenterAteneo}
          className="pointer-events-auto p-2.5 rounded-full bg-white shadow-md border border-slate-200 text-ateneo-blue hover:bg-slate-50 transition active:scale-95"
          title={`Recenter on Ateneo de Davao (${gate.label})`}
        >
          <span className="font-extrabold text-xs">🏛️</span>
        </button>

        {/* Live GPS Recenter Button */}
        {userLocation && (
          <button
            type="button"
            onClick={handleRecenterUser}
            className="pointer-events-auto p-2.5 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-ateneo-blue hover:bg-slate-50 transition active:scale-95"
            title="Locate my position on map"
          >
            <Crosshair className="h-4 w-4 text-blue-600" />
          </button>
        )}
      </div>

      {/* Origin Campus Indicator Pill (Top Left) */}
      <div className="absolute top-3 left-12 z-20 pointer-events-auto">
        <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-md border border-slate-200 flex items-center gap-1.5 backdrop-blur-xs">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ateneo-blue text-white text-[9px] font-bold">
            A
          </span>
          <span>Starting Point: <strong>Ateneo ({gate.label})</strong></span>
        </div>
      </div>

      {/* Active Route Floating Card */}
      {activeDorm && routeInfo && (
        <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white/98 p-3.5 shadow-xl backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-ateneo-blue">
                  <Navigation className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {activeDorm.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {activeDorm.address?.slice(0, 40)}...
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearRoute}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Clear route"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Starting Point & Destination Label */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400">From: </span>
                <span className="font-semibold text-ateneo-blue">
                  {routeOriginMode === 'gps' && userLocation ? 'My Current GPS' : `Ateneo (${gate.label})`}
                </span>
              </div>
              {userLocation && (
                <button
                  type="button"
                  onClick={() => setRouteOriginMode(routeOriginMode === 'ateneo' ? 'gps' : 'ateneo')}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  {routeOriginMode === 'ateneo' ? 'Switch to My GPS' : 'Reset to Ateneo'}
                </button>
              )}
            </div>

            {/* Travel Stats & Walking/Driving Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="text-xs">
                  <span className="text-slate-400">Distance: </span>
                  <span className="font-bold text-slate-800">
                    {routeInfo.distanceMeters >= 1000
                      ? `${(routeInfo.distanceMeters / 1000).toFixed(1)} km`
                      : `${routeInfo.distanceMeters} m`}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">ETA: </span>
                  <span className="font-bold text-emerald-600">
                    ~{routeInfo.durationMinutes} min {travelMode}
                  </span>
                </div>
              </div>

              {/* Mode Toggle & Live Navigation */}
              <div className="flex items-center gap-1.5">
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

                {activeDorm && (
                  <button
                    type="button"
                    onClick={() => navigate(`/navigate/${activeDorm.id || activeDorm._id}`)}
                    className="px-2.5 py-1 rounded-lg bg-ateneo-blue text-white hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs"
                    title="Start Live In-App Navigation"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold">Navigate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
