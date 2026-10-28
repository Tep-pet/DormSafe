import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapLibreTracker.css';

// Configure Web Worker for Vite production bundle
maplibregl.setWorkerUrl(workerUrl);
import { RouteService } from '../../services/map/RouteService.js';
import { MapConfig } from '../../services/map/MapConfig.js';
import { getAccuratePinpoint } from '../../utils/propertyCoordinates.js';

/**
 * Normalizes coordinate pairs to [longitude, latitude] for GeoJSON.
 * Davao City: Longitude ~125.x, Latitude ~7.x.
 * This prevents inverted coordinates regardless of data source.
 */
function toLngLatPair(coord) {
  if (Array.isArray(coord)) {
    const [a, b] = coord;
    if (a > 50 && b < 50) return [a, b]; // already [lng, lat]
    return [b, a]; // was [lat, lng]
  }
  if (coord && typeof coord === 'object') {
    const lat = Number(coord.lat ?? coord.latitude);
    const lng = Number(coord.lng ?? coord.longitude);
    return [lng, lat];
  }
  return coord;
}

/**
 * Ensures walking route source and solid route line layers exist and are updated.
 */
function ensureRouteOnMap(map, rawCoordinates) {
  if (!map || !map.isStyleLoaded()) return false;
  if (!rawCoordinates || rawCoordinates.length < 2) return false;

  const validCoords = rawCoordinates
    .map(toLngLatPair)
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  if (validCoords.length < 2) return false;

  const geojsonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: validCoords,
        },
      },
    ],
  };

  const existingSource = map.getSource('walking-route');
  if (existingSource) {
    existingSource.setData(geojsonData);
    return true;
  }

  // Add GeoJSON source
  map.addSource('walking-route', {
    type: 'geojson',
    data: geojsonData,
  });

  // Background white casing for contrast against street map
  if (!map.getLayer('walking-route-casing')) {
    map.addLayer({
      id: 'walking-route-casing',
      type: 'line',
      source: 'walking-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': 10,
        'line-opacity': 0.95,
      },
    });
  }

  // Primary bold blue navigation line
  if (!map.getLayer('walking-route-line')) {
    map.addLayer({
      id: 'walking-route-line',
      type: 'line',
      source: 'walking-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0052cc',
        'line-width': 6,
        'line-opacity': 0.95,
      },
    });
  }

  return true;
}

export function MapLibreTracker({
  property,
  userLocation,
  userBearing,
  isCompassMode,
  travelMode = 'walk',
  recenterTrigger,
  onRouteStats,
  onArrival,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);
  const cachedCoordinatesRef = useRef(null);

  const accuratePinpoint = getAccuratePinpoint(property);
  const destLat = Number(accuratePinpoint?.lat || property?.latitude || MapConfig.CAMPUS_BOUNDS.defaultCenter[0]);
  const destLng = Number(accuratePinpoint?.lng || property?.longitude || MapConfig.CAMPUS_BOUNDS.defaultCenter[1]);

  const renderPolyline = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return;
    cachedCoordinatesRef.current = coordinates;

    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      ensureRouteOnMap(map, coordinates);
    } else {
      map.once('styledata', () => {
        ensureRouteOnMap(map, coordinates);
      });
    }

    // Fit map bounds to the road route
    try {
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((c) => {
        const pair = toLngLatPair(c);
        if (pair && Number.isFinite(pair[0]) && Number.isFinite(pair[1])) {
          bounds.extend(pair);
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 90, bottom: 230, left: 40, right: 40 }, maxZoom: 17 });
      }
    } catch {
      // safe ignore
    }
  };

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Register offline PMTiles protocol handler
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const mapStyle = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [destLng, destLat],
      zoom: 16.5,
      pitch: 35,
      bearing: 0,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // Add Accommodation Destination Marker
    const destEl = document.createElement('div');
    destEl.className = 'dest-pin-container';
    destEl.innerHTML = `
      <div class="dest-pin-badge">${property?.name || 'Destination'}</div>
      <div class="dest-pin-icon">🏠</div>
    `;

    destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
      .setLngLat([destLng, destLat])
      .addTo(map);

    const onMapReady = () => {
      if (cachedCoordinatesRef.current) {
        ensureRouteOnMap(map, cachedCoordinatesRef.current);
      }
    };

    map.on('load', onMapReady);
    map.on('styledata', onMapReady);

    return () => {
      map.remove();
      maplibregl.removeProtocol('pmtiles');
      mapRef.current = null;
    };
  }, [destLat, destLng, property?.name]);

  // 2. Handle Heading Rotation (Grab-style navigation)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isCompassMode && userBearing != null && !isNaN(userBearing)) {
      map.easeTo({ bearing: userBearing, duration: 350 });
    } else if (!isCompassMode) {
      map.easeTo({ bearing: 0, duration: 350 });
    }
  }, [userBearing, isCompassMode]);

  // 3. Update User Marker and Fetch/Update Walking Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const { lat, lng } = userLocation;

    // Render / update pulsing radar student dot
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-live-radar';
      el.innerHTML = `
        <div class="user-live-radar-pulse"></div>
        <div class="user-live-radar-dot"></div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }

    // Fit bounds smoothly on coordinate updates
    if (!hasFittedBoundsRef.current) {
      hasFittedBoundsRef.current = true;
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([lng, lat]);
      bounds.extend([destLng, destLat]);
      map.fitBounds(bounds, { padding: { top: 90, bottom: 230, left: 40, right: 40 }, maxZoom: 17 });
    }

    // Update position in RouteService to get exact street-level road paths
    RouteService.updateStudentPosition(
      { lat, lng },
      { lat: destLat, lng: destLng },
      travelMode,
      (routeResult) => {
        if (onRouteStats) {
          onRouteStats({
            distanceMeters: routeResult.distanceMeters,
            durationMinutes: routeResult.durationMinutes,
            formattedDistance: routeResult.formattedDistance,
            formattedDuration: routeResult.formattedDuration,
            summary: routeResult.summary,
            mode: routeResult.mode,
            isFallback: routeResult.isFallback,
          });
        }
        renderPolyline(routeResult.coordinates);
      },
      () => {
        if (onArrival) onArrival();
      },
      property
    );
  }, [userLocation, destLat, destLng, travelMode, onRouteStats, onArrival, property]);

  // 4. Handle Manual Recenter Trigger
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userLocation.lng, userLocation.lat]);
    bounds.extend([destLng, destLat]);
    map.fitBounds(bounds, { padding: { top: 90, bottom: 230, left: 40, right: 40 }, maxZoom: 17.5 });
  }, [recenterTrigger, userLocation, destLat, destLng]);

  return <div ref={mapContainerRef} className="maplibre-container" />;
}
