import React, { createContext, useContext } from 'react';

/**
 * Deprecated: DormSafe operates 100% on MapLibre GL JS, OpenStreetMap, and OpenRouteService.
 * Zero Google Maps dependencies or scripts are loaded.
 */
const GoogleMapsContext = createContext({ isLoaded: true, loadError: null, authFailed: false });

export function GoogleMapsProvider({ children }) {
  return <GoogleMapsContext.Provider value={{ isLoaded: true, loadError: null, authFailed: false }}>{children}</GoogleMapsContext.Provider>;
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export function GoogleMapsErrorHelp() {
  return null;
}
