/**
 * DormFinder Real-Time Location Tracker
 * 
 * Free & Open-Source Tech Stack:
 * - Map: Leaflet.js
 * - Tiles: OpenStreetMap
 * - Routing: OSRM Free Public API (Walking Profile)
 * - Geolocation: Browser navigator.geolocation API
 * 
 * Privacy:
 * Conforms to Philippines Data Privacy Act (RA 10173).
 * Location data is processed exclusively on the student's browser and is never stored or sent to any server.
 */

import { mockAccommodations } from './mockAccommodations.js';

// =============================================================================
// STATE & CONFIGURATION
// =============================================================================
export const TrackerConfig = {
  RE_ROUTE_THRESHOLD_METERS: 30, // Only re-fetch route if moved > 30m to avoid spamming OSRM
  ARRIVAL_DISTANCE_METERS: 20,   // "You've arrived!" when within 20m of accommodation
  AVERAGE_WALKING_SPEED_MPS: 1.33 // ~4.8 km/h = 1.33 meters per second
};

let map = null;
let currentAccommodation = null;
let watchId = null;
let isTracking = false;

// Markers & Layers
let userMarker = null;
let accuracyCircle = null;
let destMarker = null;
let routeLayer = null;

// Routing State
let currentUserPos = null; // { lat, lng, accuracy }
let lastRoutePos = null;   // { lat, lng } position when OSRM was last called

// UI Callbacks
let uiCallbacks = {
  onStatusChange: null,
  onRouteUpdate: null,
  onArrival: null,
  onError: null
};

// =============================================================================
// HELPER: HAVERSINE DISTANCE IN METERS
// =============================================================================
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function formatDuration(minutes) {
  if (minutes < 1) return '< 1 min';
  return `~${Math.round(minutes)} min`;
}

// =============================================================================
// MAP INITIALIZATION
// =============================================================================
export function initMap(containerId = 'map', accommodation = null) {
  currentAccommodation = accommodation || mockAccommodations[0];

  // Default center at the selected accommodation or Ateneo de Davao Jacinto
  const initialCenter = [
    currentAccommodation.latitude,
    currentAccommodation.longitude
  ];

  if (!map) {
    map = L.map(containerId, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: true
    });

    // 100% Free OpenStreetMap Cartography Tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Zoom controls at top-left for easy mobile tapping
    L.control.zoom({ position: 'topleft' }).addTo(map);
  } else {
    map.setView(initialCenter, 16);
  }

  // Render accommodation destination marker
  renderDestinationMarker(currentAccommodation);

  return map;
}

// =============================================================================
// DESTINATION MARKER
// =============================================================================
function renderDestinationMarker(accommodation) {
  if (destMarker) {
    map.removeLayer(destMarker);
  }

  const destIcon = L.divIcon({
    className: 'dorm-dest-pin-wrapper',
    html: `
      <div class="dorm-dest-pin">
        <span class="icon">🏠</span>
        <span class="name">${accommodation.name}</span>
      </div>
    `,
    iconSize: [120, 32],
    iconAnchor: [60, 16]
  });

  destMarker = L.marker([accommodation.latitude, accommodation.longitude], {
    icon: destIcon,
    zIndexOffset: 500
  }).addTo(map);

  destMarker.bindPopup(`
    <div style="font-size: 13px; line-height: 1.4;">
      <b style="color: #003366;">${accommodation.name}</b><br/>
      <small style="color: #64748b;">${accommodation.address}</small><br/>
      <b style="color: #059669;">₱${accommodation.price.toLocaleString()} / month</b>
    </div>
  `);
}

// =============================================================================
// 1. REQUEST LOCATION WITH CUSTOM PERMISSION MODAL
// =============================================================================
export function requestLocation(callbacks = {}) {
  uiCallbacks = { ...uiCallbacks, ...callbacks };

  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    // If no custom modal found, proceed directly to startTracking
    confirmAndStartTracking();
  }
}

export function confirmAndStartTracking() {
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  updateUI({ status: 'finding-location', message: 'Finding your location...' });

  if (!navigator.geolocation) {
    handleGeolocationError({
      code: 0,
      message: 'Geolocation is not supported by your browser.'
    });
    return;
  }

  // Call browser geolocation
  startTracking();
}

export function cancelPermission() {
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  updateUI({
    status: 'cancelled',
    message: 'Location access was not enabled. You can still view the accommodation pin on the map.'
  });
}

// =============================================================================
// 2. START REAL-TIME TRACKING
// =============================================================================
export function startTracking() {
  if (isTracking) return;

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 3000
  };

  isTracking = true;

  // Clear any existing watch
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  watchId = navigator.geolocation.watchPosition(
    onLocationSuccess,
    onLocationError,
    geoOptions
  );

  updateUI({ status: 'active', message: 'GPS tracking active' });
}

// =============================================================================
// LOCATION SUCCESS HANDLER
// =============================================================================
async function onLocationSuccess(position) {
  const { latitude, longitude, accuracy } = position.coords;
  currentUserPos = { lat: latitude, lng: longitude, accuracy };

  // 1. Update or create the Student's Blue Pulsing Dot
  updateUserMarker(latitude, longitude, accuracy);

  // 2. Calculate current distance to destination
  const distanceToDest = calculateDistanceMeters(
    latitude,
    longitude,
    currentAccommodation.latitude,
    currentAccommodation.longitude
  );

  // 3. Arrival check: within ~20 meters
  if (distanceToDest <= TrackerConfig.ARRIVAL_DISTANCE_METERS) {
    onArrival();
    return;
  }

  // 4. Smart OSRM route re-fetching:
  // Only re-fetch route if user moved > 30 meters from last calculation point
  const shouldFetchNewRoute =
    !lastRoutePos ||
    calculateDistanceMeters(latitude, longitude, lastRoutePos.lat, lastRoutePos.lng) >
      TrackerConfig.RE_ROUTE_THRESHOLD_METERS;

  if (shouldFetchNewRoute) {
    updateUI({ status: 'getting-route', message: 'Calculating live street route...' });
    await getRoute(latitude, longitude, currentAccommodation.latitude, currentAccommodation.longitude);
    lastRoutePos = { lat: latitude, lng: longitude };
  } else {
    // Live update distance & duration display smoothly without calling API
    const estimatedMinutes = Math.max(1, distanceToDest / (TrackerConfig.AVERAGE_WALKING_SPEED_MPS * 60));
    updateUI({
      status: 'tracking',
      distanceMeters: distanceToDest,
      durationMinutes: estimatedMinutes,
      message: `En route to ${currentAccommodation.name}`
    });
  }
}

// =============================================================================
// UPDATE USER MARKER & ACCURACY CIRCLE
// =============================================================================
function updateUserMarker(lat, lng, accuracy) {
  const latLng = [lat, lng];

  if (!userMarker) {
    const userDotIcon = L.divIcon({
      className: 'user-live-dot-container',
      html: `
        <div class="user-live-pulse"></div>
        <div class="user-live-dot"></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarker = L.marker(latLng, { icon: userDotIcon, zIndexOffset: 1000 }).addTo(map);
    userMarker.bindPopup('<b>You are here</b><br/>Real-time GPS active');

    // Draw accuracy circle
    accuracyCircle = L.circle(latLng, {
      radius: Math.min(accuracy || 10, 150),
      color: '#3b82f6',
      fillColor: '#93c5fd',
      fillOpacity: 0.15,
      weight: 1
    }).addTo(map);
  } else {
    userMarker.setLatLng(latLng);
    if (accuracyCircle) {
      accuracyCircle.setLatLng(latLng);
      accuracyCircle.setRadius(Math.min(accuracy || 10, 150));
    }
  }
}

// =============================================================================
// 3. FETCH WALKING ROUTE VIA OSRM PUBLIC API
// =============================================================================
export async function getRoute(startLat, startLng, destLat, destLng) {
  // Free public OSRM pedestrian routing server (zero billing, no Google API key)
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(osrmUrl);
    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data?.routes?.[0]) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      // Remove existing route line
      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      // Draw custom walking polyline (AdDU Blue dashed style)
      routeLayer = L.polyline(coordinates, {
        color: '#003366',
        weight: 5,
        opacity: 0.9,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Fit map bounds to show student, destination, and the entire route
      map.fitBounds(routeLayer.getBounds(), {
        padding: [50, 50],
        maxZoom: 17
      });

      const distMeters = Math.round(route.distance);
      const durationMins = Math.max(1, Math.round(route.duration / 60));

      updateUI({
        status: 'tracking',
        distanceMeters: distMeters,
        durationMinutes: durationMins,
        isFallback: false,
        message: 'Live walking route active'
      });

      return { distMeters, durationMins, coordinates };
    }
    throw new Error('No route returned by OSRM');
  } catch (err) {
    console.warn('OSRM routing failed, drawing fallback straight line:', err.message);

    // Fallback: draw straight dashed line
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    const straightCoords = [
      [startLat, startLng],
      [destLat, destLng]
    ];

    routeLayer = L.polyline(straightCoords, {
      color: '#dc2626',
      weight: 4,
      opacity: 0.8,
      dashArray: '5, 5'
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50], maxZoom: 17 });

    const straightDist = calculateDistanceMeters(startLat, startLng, destLat, destLng);
    const straightDuration = Math.max(1, Math.round(straightDist / (TrackerConfig.AVERAGE_WALKING_SPEED_MPS * 60)));

    updateUI({
      status: 'tracking',
      distanceMeters: straightDist,
      durationMinutes: straightDuration,
      isFallback: true,
      message: 'Direct distance shown (street route unavailable)'
    });

    return { distMeters: straightDist, durationMins: straightDuration, isFallback: true };
  }
}

// =============================================================================
// 4. ARRIVAL HANDLER (WITHIN 20 METERS)
// =============================================================================
function onArrival() {
  // Stop watchPosition
  stopTracking();

  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  updateUI({
    status: 'arrived',
    distanceMeters: 0,
    durationMinutes: 0,
    message: `You've arrived at ${currentAccommodation.name}!`
  });

  if (uiCallbacks.onArrival) {
    uiCallbacks.onArrival(currentAccommodation);
  }
}

// =============================================================================
// 5. STOP TRACKING & CLEANUP
// =============================================================================
export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  isTracking = false;
  lastRoutePos = null;

  updateUI({ status: 'stopped', message: 'Tracking stopped' });
}

export function resetTracker() {
  stopTracking();

  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
  if (userMarker) {
    map.removeLayer(userMarker);
    userMarker = null;
  }
  if (accuracyCircle) {
    map.removeLayer(accuracyCircle);
    accuracyCircle = null;
  }

  currentUserPos = null;
  lastRoutePos = null;

  if (currentAccommodation && map) {
    map.setView([currentAccommodation.latitude, currentAccommodation.longitude], 16);
  }

  updateUI({ status: 'idle', message: 'Ready to track' });
}

// =============================================================================
// RECENTER HELPERS
// =============================================================================
export function recenterOnUser() {
  if (map && currentUserPos) {
    map.setView([currentUserPos.lat, currentUserPos.lng], 17, { animate: true });
  } else {
    updateUI({ status: 'notice', message: 'User location not yet available' });
  }
}

export function recenterOnAccommodation() {
  if (map && currentAccommodation) {
    map.setView([currentAccommodation.latitude, currentAccommodation.longitude], 17, { animate: true });
  }
}

// =============================================================================
// ERROR HANDLING (PERMISSION DENIED, UNAVAILABLE, TIMEOUT)
// =============================================================================
function onLocationError(error) {
  isTracking = false;
  handleGeolocationError(error);
}

function handleGeolocationError(error) {
  let friendlyTitle = 'Location Error';
  let friendlyMsg = 'Unable to retrieve your location.';
  let isDenied = false;

  switch (error.code) {
    case 1: // PERMISSION_DENIED
      isDenied = true;
      friendlyTitle = 'Location Permission Denied';
      friendlyMsg =
        'DormFinder needs location permission to guide you. To enable it, tap the lock/tune icon beside your address bar, allow Location, and tap "Try Again".';
      break;
    case 2: // POSITION_UNAVAILABLE
      friendlyTitle = 'GPS Unavailable';
      friendlyMsg = 'Your device cannot get a reliable GPS signal. Please ensure Location/GPS is turned on.';
      break;
    case 3: // TIMEOUT
      friendlyTitle = 'Location Request Timed Out';
      friendlyMsg = 'Getting your location took too long. Check your signal and tap "Try Again".';
      break;
    default:
      friendlyMsg = error.message || friendlyMsg;
      break;
  }

  updateUI({
    status: 'error',
    errorTitle: friendlyTitle,
    errorMessage: friendlyMsg,
    isPermissionDenied: isDenied
  });

  if (uiCallbacks.onError) {
    uiCallbacks.onError({ title: friendlyTitle, message: friendlyMsg, code: error.code });
  }
}

// =============================================================================
// 6. UPDATE UI STATE
// =============================================================================
export function updateUI(state = {}) {
  // 1. Status Text / Badge
  const statusEl = document.getElementById('trackerStatus');
  if (statusEl && state.message) {
    statusEl.textContent = state.message;
  }

  // 2. Info Card Metrics
  const cardEl = document.getElementById('routeInfoCard');
  const distEl = document.getElementById('routeDistance');
  const etaEl = document.getElementById('routeEta');
  const badgeFallbackEl = document.getElementById('fallbackBadge');

  if (state.distanceMeters !== undefined && distEl) {
    distEl.textContent = formatDistance(state.distanceMeters);
  }
  if (state.durationMinutes !== undefined && etaEl) {
    etaEl.textContent = formatDuration(state.durationMinutes);
  }
  if (badgeFallbackEl) {
    badgeFallbackEl.style.display = state.isFallback ? 'inline-block' : 'none';
  }

  // Show/Hide info card during active tracking
  if (cardEl) {
    if (state.status === 'tracking') {
      cardEl.classList.remove('hidden');
    } else if (state.status === 'idle' || state.status === 'stopped') {
      cardEl.classList.add('hidden');
    }
  }

  // 3. Arrival Celebration Modal/Banner
  const arrivalBanner = document.getElementById('arrivalBanner');
  if (arrivalBanner) {
    if (state.status === 'arrived') {
      arrivalBanner.classList.remove('hidden');
    } else {
      arrivalBanner.classList.add('hidden');
    }
  }

  // 4. Error Banner
  const errorBanner = document.getElementById('errorBanner');
  const errorTitleEl = document.getElementById('errorTitle');
  const errorDescEl = document.getElementById('errorDesc');

  if (errorBanner) {
    if (state.status === 'error') {
      if (errorTitleEl) errorTitleEl.textContent = state.errorTitle || 'Location Error';
      if (errorDescEl) errorDescEl.textContent = state.errorMessage || '';
      errorBanner.classList.remove('hidden');
    } else {
      errorBanner.classList.add('hidden');
    }
  }

  // 5. Button toggles
  const btnTrack = document.getElementById('btnStartTrack');
  const btnStop = document.getElementById('btnStopTrack');
  if (btnTrack && btnStop) {
    if (isTracking) {
      btnTrack.classList.add('hidden');
      btnStop.classList.remove('hidden');
    } else {
      btnTrack.classList.remove('hidden');
      btnStop.classList.add('hidden');
    }
  }

  if (uiCallbacks.onStatusChange) {
    uiCallbacks.onStatusChange(state);
  }
}

// Cleanup on window unload or page navigation
window.addEventListener('beforeunload', () => {
  stopTracking();
});
