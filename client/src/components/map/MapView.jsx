import React from 'react';
import { LeafletCampusMap } from './LeafletCampusMap';

/**
 * 100% Free Campus Map View
 * Powered by Leaflet.js, OpenStreetMap, Browser Geolocation API, and OSRM Free Routing.
 * Zero API keys or billing required.
 */
export function MapView({ gateId = 'jacinto', properties = [], onMarkerClick }) {
  return (
    <LeafletCampusMap
      gateId={gateId}
      properties={properties}
      onMarkerClick={onMarkerClick}
    />
  );
}
