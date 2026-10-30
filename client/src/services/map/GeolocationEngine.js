/**
 * Geolocation Engine for DormSafe
 * Coordinates browser GPS tracking, high-accuracy recalibration,
 * desktop Wi-Fi location fallback, and manual pin placement.
 */

const STORAGE_KEY = 'dormsafe_user_location';

function loadStoredPosition() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveStoredPosition(pos) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (pos) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

class GeolocationEngineManager {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastKnownPosition = loadStoredPosition();
    this.lastHeading = 0;

    this.onLocationCb = null;
    this.onBearingCb = null;
    this.onErrorCb = null;

    this.orientationHandler = null;
    this.visibilityHandler = null;
  }

  /**
   * Check browser geolocation permission status
   */
  async checkPermission() {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'prompt';
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state; // 'granted' | 'prompt' | 'denied'
    } catch {
      return 'prompt';
    }
  }

  /**
   * Start GPS tracking and device compass listening
   */
  startTracking({ onLocation, onBearing, onError }) {
    this.onLocationCb = onLocation;
    this.onBearingCb = onBearing;
    this.onErrorCb = onError;
    this.isTracking = true;

    // Immediately emit stored or last known fix if available
    if (this.lastKnownPosition && this.onLocationCb) {
      this.onLocationCb(this.lastKnownPosition);
    }

    if (!navigator.geolocation) {
      if (onError) onError({ code: 0, message: 'Geolocation not supported by this browser.' });
      return;
    }

    // If a manual pin was explicitly set, keep it active and don't overwrite with noisy background fixes
    if (this.lastKnownPosition?.isManual) {
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      options
    );

    if (this.onBearingCb) {
      this.bindCompassOrientation();
    }
    this.bindTabVisibility();
  }

  /**
   * Active recalibration: clears cached/manual position, restarts watch,
   * and requests fresh fix with two-stage fallback (high accuracy -> standard accuracy).
   */
  recalibrate({ onLocation, onError } = {}) {
    saveStoredPosition(null);
    this.lastKnownPosition = null;

    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (!navigator.geolocation) {
      const err = { code: 0, message: 'Geolocation not supported by this browser.' };
      this.handlePositionError(err);
      onError?.(err);
      return;
    }

    const applyFix = (position) => {
      this.handlePositionUpdate(position);
      onLocation?.(this.lastKnownPosition);

      // Re-arm continuous watch if active
      if (this.isTracking) {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => this.handlePositionUpdate(pos),
          (err) => this.handlePositionError(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    };

    // Stage 1: Try high-accuracy (GPS hardware)
    navigator.geolocation.getCurrentPosition(
      applyFix,
      (_err1) => {
        // Stage 2: Fallback to standard accuracy (essential for desktop/laptops with Wi-Fi IP location)
        navigator.geolocation.getCurrentPosition(
          applyFix,
          (err2) => {
            this.handlePositionError(err2);
            onError?.(err2);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  /**
   * Set a manual location pin (e.g. user drags blue dot or clicks map to pin location)
   */
  setManualLocation({ lat, lng }) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;

    this.lastKnownPosition = {
      lat: parsedLat,
      lng: parsedLng,
      accuracy: 10,
      isManual: true,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };

    saveStoredPosition(this.lastKnownPosition);

    if (this.onLocationCb) {
      this.onLocationCb(this.lastKnownPosition);
    }

    return this.lastKnownPosition;
  }

  clearManualLocation() {
    saveStoredPosition(null);
    this.lastKnownPosition = null;
    this.recalibrate();
  }

  handlePositionUpdate(position) {
    // If user has a manual pin active, ignore automated background fixes unless recalibrated
    if (this.lastKnownPosition?.isManual) return;

    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    const parsedHeading = heading != null && !isNaN(heading) ? heading : null;
    const parsedSpeed = speed != null && !isNaN(speed) ? speed : null;

    this.lastKnownPosition = {
      lat: latitude,
      lng: longitude,
      accuracy: accuracy != null && !isNaN(accuracy) ? Math.round(accuracy) : null,
      isManual: false,
      heading: parsedHeading,
      speed: parsedSpeed,
      timestamp: position.timestamp || Date.now(),
    };

    saveStoredPosition(this.lastKnownPosition);

    if (parsedHeading != null && parsedSpeed && parsedSpeed > 0.5) {
      this.lastHeading = parsedHeading;
      if (this.onBearingCb) this.onBearingCb(parsedHeading);
    }

    if (this.onLocationCb) {
      this.onLocationCb(this.lastKnownPosition);
    }
  }

  handlePositionError(error) {
    console.warn('Geolocation engine error:', error.message);
    if (this.onErrorCb) {
      this.onErrorCb(error);
    }
  }

  bindCompassOrientation() {
    const handleOrientation = (e) => {
      let compassHeading = null;
      if (e.webkitCompassHeading != null) {
        compassHeading = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        compassHeading = (360 - e.alpha) % 360;
      }

      if (compassHeading != null && !isNaN(compassHeading)) {
        this.lastHeading = compassHeading;
        if (this.onBearingCb) this.onBearingCb(compassHeading);
      }
    };

    this.orientationHandler = handleOrientation;
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  }

  bindTabVisibility() {
    this.visibilityHandler = () => {
      if (document.hidden) {
        if (this.watchId != null) {
          navigator.geolocation.clearWatch(this.watchId);
          this.watchId = null;
        }
      } else if (this.isTracking && this.watchId == null && !this.lastKnownPosition?.isManual) {
        this.startTracking({
          onLocation: this.onLocationCb,
          onBearing: this.onBearingCb,
          onError: this.onErrorCb,
        });
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stopTracking() {
    this.isTracking = false;
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.orientationHandler) {
      window.removeEventListener('deviceorientationabsolute', this.orientationHandler, true);
      window.removeEventListener('deviceorientation', this.orientationHandler, true);
      this.orientationHandler = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

export const GeolocationEngine = new GeolocationEngineManager();
