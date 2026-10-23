import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapLibreTracker.css';
import { RouteService } from '../../services/map/RouteService.js';
import { MapConfig } from '../../services/map/MapConfig.js';

export function MapLibreTracker({
  property,
  userLocation,
  userBearing,
  isCompassMode,
  recenterTrigger,
  onRouteStats,
  onArrival,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);

  const destLat = Number(property?.latitude || MapConfig.CAMPUS_BOUNDS.defaultCenter[0]);
  const destLng = Number(property?.longitude || MapConfig.CAMPUS_BOUNDS.defaultCenter[1]);

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Register offline PMTiles protocol handler
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // High performance hybrid vector / raster style
    // Seamlessly falls back to OpenStreetMap raster tiles if local pmtiles is not yet compiled
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
      pitch: 35, // 35-degree tilt for pedestrian navigation perspective
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

    // Initial load polyline source
    map.on('load', () => {
      if (!map.getSource('walking-route')) {
        map.addSource('walking-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Background polyline outline
        map.addLayer({
          id: 'walking-route-casing',
          type: 'line',
          source: 'walking-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 8,
          },
        });

        // AdDU Blue dashed walking line
        map.addLayer({
          id: 'walking-route-line',
          type: 'line',
          source: 'walking-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#003366',
            'line-width': 5,
            'line-dasharray': [2, 2],
          },
        });
      }
    });

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

    // Fit bounds on first coordinate lock
    if (!hasFittedBoundsRef.current) {
      hasFittedBoundsRef.current = true;
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([lng, lat]);
      bounds.extend([destLng, destLat]);
      map.fitBounds(bounds, { padding: { top: 90, bottom: 220, left: 40, right: 40 }, maxZoom: 17 });
    }

    // Update position in RouteService
    RouteService.updateStudentPosition(
      { lat, lng },
      { lat: destLat, lng: destLng },
      (routeResult) => {
        if (onRouteStats) {
          onRouteStats({
            distanceMeters: routeResult.distanceMeters,
            durationMinutes: routeResult.durationMinutes,
            isFallback: routeResult.isFallback,
          });
        }
        renderPolyline(routeResult.coordinates);
      },
      () => {
        if (onArrival) onArrival();
      }
    );
  }, [userLocation, destLat, destLng, onRouteStats, onArrival]);

  // 4. Handle Manual Recenter Trigger
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userLocation.lng, userLocation.lat]);
    bounds.extend([destLng, destLat]);
    map.fitBounds(bounds, { padding: { top: 90, bottom: 220, left: 40, right: 40 }, maxZoom: 17.5 });
  }, [recenterTrigger, userLocation, destLat, destLng]);

  const renderPolyline = (coordinates) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const geojsonData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map(([lat, lng]) => [lng, lat]),
      },
    };

    const source = map.getSource('walking-route');
    if (source) {
      source.setData(geojsonData);
    }
  };

  return <div ref={mapContainerRef} className="maplibre-container" />;
}
