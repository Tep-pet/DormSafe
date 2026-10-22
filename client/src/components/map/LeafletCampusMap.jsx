import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { formatPrice } from '../../utils/formatPrice';
import { Navigation, Footprints, Car, X, Crosshair, MapPin, AlertCircle } from 'lucide-react';

// Setup Leaflet default marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * 100% Free, Mobile-Friendly Map for DormSafe
 * Powered by Leaflet.js, OpenStreetMap, Browser Geolocation API, and OSRM Free Routing.
 */
export function LeafletCampusMap({
  gateId = 'jacinto',
  properties = [],
  selectedProperty = null,
  onMarkerClick,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const manualStartMarkerRef = useRef(null);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  // State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [manualStart, setManualStart] = useState(null); // { lat, lng }
  const [geoStatus, setGeoStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'error'
  const [activeDorm, setActiveDorm] = useState(selectedProperty || null);
  const [travelMode, setTravelMode] = useState('walking'); // 'walking' | 'driving'
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration, geometry }
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [manualModeActive, setManualModeActive] = useState(false);

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
        zoomControl: false, // Custom position for mobile friendliness
        attributionControl: false,
      });

      // Standard Free OpenStreetMap Tiles (100% free, zero credit card)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap' })
        .addTo(map);

      // Zoom control on top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Browser Geolocation (watchPosition) for Live Student Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setGeoStatus('granted');
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        if (err.code === 1) {
          setGeoStatus('denied');
        } else {
          setGeoStatus('error');
        }
      },
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

  // 3. Update User Location Pin (Pulsing blue dot + Accuracy Circle)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && geoStatus === 'granted') {
      const userPos = [userLocation.lat, userLocation.lng];

      // Pulsing Grab-like live user icon
      const userDotIcon = L.divIcon({
        className: 'custom-live-user-dot',
        html: `<div class="user-live-dot" title="You are here"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userPos, { icon: userDotIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup('<b>You are here</b><br/>Live GPS tracking active');
      } else {
        userMarkerRef.current.setLatLng(userPos);
      }

      // Accuracy radius circle
      if (userLocation.accuracy) {
        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle(userPos, {
            radius: Math.min(userLocation.accuracy, 200),
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          userAccuracyCircleRef.current.setLatLng(userPos);
          userAccuracyCircleRef.current.setRadius(Math.min(userLocation.accuracy, 200));
        }
      }
    }
  }, [userLocation, geoStatus]);

  // 4. Update Campus Gate Pin & 2km Perimeter Circle
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
      fillOpacity: 0.06,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);
    circleRef.current = circle;

    // Ateneo de Davao Gate Marker
    const gateIcon = L.divIcon({
      className: 'custom-gate-pin',
      html: `
        <div style="
          background: #003366;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #C5A900;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          font-weight: 800;
          font-size: 13px;
        ">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const gateMarker = L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 500 })
      .addTo(map)
      .bindPopup(`<b>${gate.label}</b><br/>Ateneo de Davao Campus Origin`);

    return () => {
      gateMarker.remove();
    };
  }, [gate]);

  // 5. Update Dorm Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((p) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!lat || !lng) return;

      const isCurrent = activeDorm?.id === p.id;

      const propIcon = L.divIcon({
        className: 'custom-dorm-pill',
        html: `
          <div style="
            background: ${isCurrent ? '#003366' : '#ffffff'};
            color: ${isCurrent ? '#ffffff' : '#003366'};
            padding: 4px 9px;
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
            transition: transform 0.15s ease;
          ">
            <span>🏠</span>
            <span>${p.min_price ? formatPrice(p.min_price) : p.name.slice(0, 10)}</span>
          </div>
        `,
        iconSize: [88, 28],
        iconAnchor: [44, 14],
      });

      const marker = L.marker([lat, lng], { icon: propIcon }).addTo(map);

      marker.on('click', () => {
        setActiveDorm(p);
        onMarkerClick?.(p);
      });

      markersRef.current.push(marker);
    });
  }, [properties, activeDorm, onMarkerClick]);

  // 6. Handle Manual Click to Set Start Point
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (manualModeActive || geoStatus === 'denied') {
        const { lat, lng } = e.latlng;
        setManualStart({ lat, lng });

        if (manualStartMarkerRef.current) {
          manualStartMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const manualIcon = L.divIcon({
            className: 'manual-start-pin',
            html: `
              <div style="
                background: #f59e0b;
                color: #fff;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #fff;
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                font-weight: bold;
                font-size: 11px;
              ">
                📍
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          manualStartMarkerRef.current = L.marker([lat, lng], { icon: manualIcon })
            .addTo(map)
            .bindPopup('<b>Manual Start Point</b>')
            .openPopup();
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [manualModeActive, geoStatus]);

  // 7. Calculate and Draw Route via OSRM Public Demo Server
  const calculateRoute = useCallback(async () => {
    if (!activeDorm) return;

    // Determine start coordinate:
    // 1. Manual start if chosen
    // 2. Live GPS if available
    // 3. Fallback to Ateneo Jacinto Gate
    let startLat = gate.lat;
    let startLng = gate.lng;

    if (manualStart) {
      startLat = manualStart.lat;
      startLng = manualStart.lng;
    } else if (userLocation && geoStatus === 'granted') {
      startLat = userLocation.lat;
      startLng = userLocation.lng;
    }

    const destLat = Number(activeDorm.latitude);
    const destLng = Number(activeDorm.longitude);

    if (!destLat || !destLng) return;

    setLoadingRoute(true);
    const map = mapInstanceRef.current;

    try {
      // OSRM service: 'walking' (foot) or 'driving' (car)
      const profile = travelMode === 'driving' ? 'driving' : 'foot';
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl);
      const data = await res.json();

      if (data?.routes?.[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        // Remove old route polyline
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        // Draw new styled route line
        const polyline = L.polyline(coordinates, {
          color: travelMode === 'driving' ? '#0284c7' : '#003366',
          weight: 5,
          opacity: 0.85,
          dashArray: travelMode === 'driving' ? null : '6, 8',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;

        // Auto zoom bounds to fit route nicely
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17 });

        setRouteInfo({
          distanceMeters: Math.round(route.distance),
          durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        });
      }
    } catch (err) {
      console.warn('OSRM Route calculation error:', err);
    } finally {
      setLoadingRoute(false);
    }
  }, [activeDorm, manualStart, userLocation, geoStatus, gate, travelMode]);

  // Recalculate route when dorm, location, or travel mode changes
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
  }, [activeDorm, travelMode, manualStart, calculateRoute]);

  // Recenter map on user location
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && geoStatus === 'granted') {
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
  };

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Floating Map Controls & GPS Status Bar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Free Map Badge */}
        <div className="pointer-events-auto rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md border border-slate-200 flex items-center gap-1.5 backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>OpenStreetMap Active</span>
        </div>

        {/* Live GPS Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="pointer-events-auto p-2.5 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-ateneo-blue hover:bg-slate-50 transition active:scale-95"
          title={geoStatus === 'granted' ? 'Recenter on live location' : 'Recenter on Ateneo Gate'}
        >
          <Crosshair className="h-5 w-5 text-ateneo-blue" />
        </button>
      </div>

      {/* Geolocation Denied / Fallback Alert Banner */}
      {geoStatus === 'denied' && (
        <div className="absolute top-3 left-12 right-16 z-20 pointer-events-auto">
          <div className="rounded-xl bg-amber-500/95 text-white p-2.5 px-3 text-xs shadow-lg flex items-center justify-between gap-2 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Location permission off. Starting from Ateneo Gate, or tap map to set your start point.</span>
            </div>
            <button
              onClick={() => setManualModeActive(!manualModeActive)}
              className="px-2 py-0.5 rounded bg-white/20 font-bold text-[11px] hover:bg-white/30 shrink-0"
            >
              {manualModeActive ? 'Cancel Pin' : 'Set Pin'}
            </button>
          </div>
        </div>
      )}

      {/* Active Route Floating Card / Travel Controls */}
      {activeDorm && routeInfo && (
        <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md space-y-2.5">
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
                    {activeDorm.address?.slice(0, 32)}...
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
