import { MapConfig } from './MapConfig.js';

class GeolocationEngineManager {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastKnownPosition = null;
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
   * Start high-accuracy GPS tracking and device compass listening
   */
  startTracking({ onLocation, onBearing, onError }) {
    if (!navigator.geolocation) {
      if (onError) onError({ code: 0, message: 'Geolocation not supported by this browser.' });
      return;
    }

    this.onLocationCb = onLocation;
    this.onBearingCb = onBearing;
    this.onErrorCb = onError;
    this.isTracking = true;

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 2000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      options
    );

    this.bindCompassOrientation();
    this.bindTabVisibility();
  }

  handlePositionUpdate(position) {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    // Discard erratic indoor multipath fixes with uncertainty > threshold
    if (accuracy && accuracy > MapConfig.THRESHOLDS.ACCURACY_REJECT_METERS) {
      console.warn(`GPS accuracy too low (${Math.round(accuracy)}m), skipping noisy coordinate.`);
      return;
    }

    this.lastKnownPosition = { lat: latitude, lng: longitude, accuracy };

    // If device provides GPS heading while walking at > 0.5 m/s, prioritize it
    if (heading != null && !isNaN(heading) && speed && speed > 0.5) {
      this.lastHeading = heading;
      if (this.onBearingCb) this.onBearingCb(heading);
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
    // Listen for compass heading from hardware magnetometer
    const handleOrientation = (e) => {
      let compassHeading = null;
      if (e.webkitCompassHeading != null) {
        // iOS Safari provides webkitCompassHeading directly (0 = North)
        compassHeading = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        // Android / standard compass
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
        // Minimize battery consumption when tab is backgrounded
        if (this.watchId != null) {
          navigator.geolocation.clearWatch(this.watchId);
          this.watchId = null;
        }
      } else if (this.isTracking && this.watchId == null) {
        // Resume tracking immediately when returning to foreground
        this.startTracking({
          onLocation: this.onLocationCb,
          onBearing: this.onBearingCb,
          onError: this.onErrorCb,
        });
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Stop tracking and clean up all listeners
   */
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
