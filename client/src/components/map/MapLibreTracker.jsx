import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapLibreTracker.css';
import { circlePolygon } from '../../services/map/GeoUtils.js';

// Configure Web Worker for Vite production bundle
maplibregl.setWorkerUrl(workerUrl);

const EMPTY_GEOJSON = {
  type: 'FeatureCollection',
  features: [],
};

export function MapLibreTracker({
  property,
  dest,
  origin,
  originKind = 'gate', // 'gps' | 'gate'
  gateName = 'Ateneo Gate',
  accuracy = null,
  routeCoords = null, // [[lat, lng], ...]
  routeKey = '',
  travelMode = 'walk', // 'walk' | 'drive'
  heading = null,
  headingUp = false,
  follow = true,
  recenterTrigger = 0,
  onUserInteract,
  onUserDragEnd,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const isMapLoadedRef = useRef(false);

  // Markers
  const userMarkerRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const gateTextSpanRef = useRef(null);
  const destMarkerRef = useRef(null);

  // Refs for tracking changes and stable callbacks
  const onUserInteractRef = useRef(onUserInteract);
  useEffect(() => {
    onUserInteractRef.current = onUserInteract;
  }, [onUserInteract]);

  const onUserDragEndRef = useRef(onUserDragEnd);
  useEffect(() => {
    onUserDragEndRef.current = onUserDragEnd;
  }, [onUserDragEnd]);

  const lastFitKeyRef = useRef('');
  const updateRouteRef = useRef(null);
  const lastBearingRef = useRef(0);
  const isFirstMountRef = useRef(true);

  // 1. Initialize MapLibre GL Map (Runs once on mount)
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

    const initialCenter = [dest.lng || 125.614, dest.lat || 7.07];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 16.5,
      pitch: 0, // Flat map for accurate panning and positioning
      bearing: 0,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // User interaction listeners to cancel auto-follow
    const handleInteract = (e) => {
      if (e.originalEvent) {
        onUserInteractRef.current?.();
      }
    };

    map.on('dragstart', handleInteract);
    map.on('zoomstart', handleInteract);
    map.on('rotatestart', handleInteract);
    map.on('pitchstart', handleInteract);

    // Destination Marker
    const destEl = document.createElement('div');
    destEl.className = 'dest-pin-container';
    destEl.innerHTML = `
      <div class="dest-pin-badge">${property?.name || 'Destination'}</div>
      <div class="dest-pin-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `;
    destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
      .setLngLat([dest.lng, dest.lat])
      .addTo(map);

    // Live User GPS Dot Marker (Draggable for precise fine-tuning on desktop/mobile)
    const userDotEl = document.createElement('div');
    userDotEl.className = 'user-dot';
    userDotEl.title = 'Your location (Drag to fine-tune)';
    userDotEl.style.display = 'none';

    const userMarker = new maplibregl.Marker({
      element: userDotEl,
      draggable: true,
    })
      .setLngLat([initialCenter[0], initialCenter[1]])
      .addTo(map);

    userMarker.on('dragend', () => {
      const lngLat = userMarker.getLngLat();
      onUserDragEndRef.current?.({ lat: lngLat.lat, lng: lngLat.lng });
    });

    userMarkerRef.current = userMarker;

    // Campus Gate Pin Marker
    const gatePinEl = document.createElement('div');
    gatePinEl.className = 'gate-pin';
    gatePinEl.innerHTML = `
      <span class="gate-pin-badge">A</span>
      <span class="gate-pin-text">${gateName}</span>
    `;
    gateTextSpanRef.current = gatePinEl.querySelector('.gate-pin-text');
    gatePinEl.style.display = 'none';
    gateMarkerRef.current = new maplibregl.Marker({ element: gatePinEl })
      .setLngLat([initialCenter[0], initialCenter[1]])
      .addTo(map);

    map.on('load', () => {
      isMapLoadedRef.current = true;

      // Accuracy circle source and layers
      if (!map.getSource('accuracy')) {
        map.addSource('accuracy', {
          type: 'geojson',
          data: EMPTY_GEOJSON,
        });

        map.addLayer({
          id: 'accuracy-fill',
          type: 'fill',
          source: 'accuracy',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15,
          },
        });

        map.addLayer({
          id: 'accuracy-line',
          type: 'line',
          source: 'accuracy',
          paint: {
            'line-color': '#2563eb',
            'line-width': 1.5,
            'line-opacity': 0.4,
          },
        });
      }

      // Walking/Driving route source and layers
      if (!map.getSource('walking-route')) {
        map.addSource('walking-route', {
          type: 'geojson',
          data: EMPTY_GEOJSON,
        });

        // Background white casing
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

        // Primary navigation route line
        map.addLayer({
          id: 'walking-route-line',
          type: 'line',
          source: 'walking-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': travelMode === 'drive' ? '#0284c7' : '#0052cc',
            'line-width': 6,
            'line-opacity': 0.95,
          },
        });
      }

      if (updateRouteRef.current) {
        updateRouteRef.current();
      }
    });

    return () => {
      map.remove();
      maplibregl.removeProtocol('pmtiles');
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, []);

  // 2. Update Destination Pin position and name
  useEffect(() => {
    if (!destMarkerRef.current || !dest) return;
    destMarkerRef.current.setLngLat([dest.lng, dest.lat]);
    const badge = destMarkerRef.current.getElement().querySelector('.dest-pin-badge');
    if (badge && property?.name) {
      badge.textContent = property.name;
    }
  }, [dest.lat, dest.lng, property?.name]);

  // 3. Update Origin Marker & Accuracy Circle based on originKind
  useEffect(() => {
    const map = mapRef.current;
    if (!origin || !userMarkerRef.current || !gateMarkerRef.current) return;

    if (originKind === 'gps') {
      // Show user dot, hide gate pin
      userMarkerRef.current.setLngLat([origin.lng, origin.lat]);
      userMarkerRef.current.getElement().style.display = 'block';
      gateMarkerRef.current.getElement().style.display = 'none';

      // Update accuracy circle
      if (map && map.getSource('accuracy')) {
        if (accuracy && accuracy > 0) {
          const poly = circlePolygon(origin.lat, origin.lng, accuracy);
          map.getSource('accuracy').setData(poly);
        } else {
          map.getSource('accuracy').setData(EMPTY_GEOJSON);
        }
      }
    } else {
      // Gate mode: show gate pin, hide user dot
      gateMarkerRef.current.setLngLat([origin.lng, origin.lat]);
      gateMarkerRef.current.getElement().style.display = 'flex';
      if (gateTextSpanRef.current) {
        gateTextSpanRef.current.textContent = gateName;
      }
      userMarkerRef.current.getElement().style.display = 'none';

      // Remove accuracy circle
      if (map && map.getSource('accuracy')) {
        map.getSource('accuracy').setData(EMPTY_GEOJSON);
      }
    }
  }, [originKind, origin.lat, origin.lng, accuracy, gateName]);

  // 4. Update Route Line GeoJSON & Color
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const toLngLat = (pt) => {
      if (!Array.isArray(pt) || pt.length < 2) return null;
      const [a, b] = pt;
      // MapLibre expects [lng, lat]. In Davao: lng ~125.6, lat ~7.07
      if (a > 50) return [a, b];
      return [b, a];
    };

    const updateRoute = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      const src = currentMap.getSource('walking-route');
      if (!src) return;

      if (routeCoords && routeCoords.length >= 2) {
        const coords = routeCoords.map(toLngLat).filter(Boolean);
        src.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords,
              },
            },
          ],
        });
      } else {
        src.setData(EMPTY_GEOJSON);
      }

      if (currentMap.getLayer('walking-route-line')) {
        currentMap.setPaintProperty(
          'walking-route-line',
          'line-color',
          travelMode === 'drive' ? '#0284c7' : '#0052cc'
        );
      }
    };

    updateRouteRef.current = updateRoute;

    if (map.getSource('walking-route')) {
      updateRoute();
    } else if (isMapLoadedRef.current || map.isStyleLoaded()) {
      requestAnimationFrame(updateRoute);
    } else {
      map.once('load', updateRoute);
    }
  }, [routeCoords, travelMode, routeKey]);

  // 5. Fit camera bounds ONLY when routeKey changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeKey) return;
    if (lastFitKeyRef.current === routeKey) return;
    lastFitKeyRef.current = routeKey;

    try {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([origin.lng, origin.lat]);
      bounds.extend([dest.lng, dest.lat]);

      if (routeCoords && routeCoords.length >= 2) {
        for (const [lat, lng] of routeCoords) {
          bounds.extend([lng, lat]);
        }
      }

      map.fitBounds(bounds, {
        padding: {
          top: 80,
          bottom: 60,
          left: typeof window !== 'undefined' && window.innerWidth >= 640 ? 410 : 40,
          right: 40,
        },
        maxZoom: 17,
        duration: 600,
      });
    } catch {
      // Safe fallback
    }
  }, [routeKey, origin.lat, origin.lng, dest.lat, dest.lng, routeCoords]);

  // 6. Camera Follow Mode (GPS only)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !follow || originKind !== 'gps' || !origin) return;

    map.easeTo({
      center: [origin.lng, origin.lat],
      duration: 500,
    });
  }, [follow, originKind, origin.lat, origin.lng]);

  // 7. Recenter Trigger Handler (Manual user action)
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([origin.lng, origin.lat]);
      bounds.extend([dest.lng, dest.lat]);

      if (routeCoords && routeCoords.length >= 2) {
        for (const [lat, lng] of routeCoords) {
          bounds.extend([lng, lat]);
        }
      }

      map.fitBounds(bounds, {
        padding: {
          top: 80,
          bottom: 60,
          left: typeof window !== 'undefined' && window.innerWidth >= 640 ? 410 : 40,
          right: 40,
        },
        maxZoom: 17,
        duration: 600,
      });
    } catch {
      // Safe fallback
    }
  }, [recenterTrigger]);

  // 8. Bearing & Heading-Up Rotation Handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (headingUp && follow && heading != null && !isNaN(heading) && originKind === 'gps') {
      const delta = Math.abs(heading - lastBearingRef.current);
      if (delta >= 5) {
        lastBearingRef.current = heading;
        map.easeTo({ bearing: heading, duration: 350 });
      }
    } else if (!headingUp && lastBearingRef.current !== 0) {
      lastBearingRef.current = 0;
      map.easeTo({ bearing: 0, duration: 350 });
    }
  }, [headingUp, follow, heading, originKind]);

  return <div ref={mapContainerRef} className="maplibre-container" />;
}
