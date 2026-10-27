import React from 'react';
import { LeafletPropertyRouteMap } from './LeafletPropertyRouteMap';

/**
 * 100% Free Property Detail Location & Route Map
 * Connects Ateneo campus gate to the selected property with OSRM routing.
 * Zero API keys or billing required.
 */
export function PropertyLocationMap({ property, gateId, walkingMinutes, onDurationChange }) {
  return (
    <LeafletPropertyRouteMap
      property={property}
      gateId={gateId}
      walkingMinutes={walkingMinutes}
      onDurationChange={onDurationChange}
    />
  );
}
