import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Polyline,
} from '@react-google-maps/api';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { useGoogleMaps, GoogleMapsErrorHelp } from '../../context/GoogleMapsContext';
import { Loader } from '../common/Loader';
import { Button } from '../common/Button';
import { WalkingTimeBadge } from './WalkingTimeBadge';

const mapContainerStyle = { width: '100%', height: '100%', minHeight: '320px' };

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

/**
 * Property detail map — shows listing location, campus origin, and walking route.
 */
export function PropertyLocationMap({ property, gateId, walkingMinutes }) {
  const { isLoaded, loadError, authFailed, apiKey } = useGoogleMaps();
  const [directions, setDirections] = useState(null);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [map, setMap] = useState(null);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  const originAddress =
    'Ateneo de Davao University, 6/F Community Center of the First Companions, Ateneo de Davao University, M. Roxas Ave, Poblacion District, Davao City, 8000 Davao del Sur';

  const isIvory =
    property?.name?.toLowerCase().includes('ivory') ||
    property?.address?.toLowerCase().includes('3jp5+wvm') ||
    property?.address?.toLowerCase().includes('laurel');

  const isBrc =
    property?.name?.toLowerCase().includes('brc') ||
    property?.address?.toLowerCase().includes('padre gomez');

  const isCorrela =
    property?.name?.toLowerCase().includes('correla') ||
    property?.address?.toLowerCase().includes('108') ||
    property?.address?.toLowerCase().includes('roxas');

  const isJuanLuna =
    property?.name?.toLowerCase().includes('juan') ||
    property?.address?.toLowerCase().includes('juan luna');

  const destinationAddress = isIvory
    ? 'Ivory Residences, 3JP5+WVM, J.P. Laurel Ave, Poblacion District, Davao City, Davao del Sur'
    : isJuanLuna
    ? '7.0725891,125.6160124'
    : isBrc
    ? 'BRC Dormitory, Brgy, Padre Gomez St, Barangay 34-D, Poblacion District, Davao City, 8000 Davao del Sur'
    : isCorrela
    ? '108 M. Roxas Ave, Poblacion District, Davao City, Davao del Sur'
    : (property?.address || `${property?.latitude},${property?.longitude}`);

  // Precise fallback coordinates (Ateneo CCFC, Ivory, Juan Luna, BRC, & 108 M. Roxas Ave)
  const defaultOriginPos = useMemo(
    () => ({ lat: 7.0712406, lng: 125.6134491 }),
    []
  );

  const defaultDestPos = useMemo(() => {
    if (isIvory) {
      return { lat: 7.0871921, lng: 125.6091495 };
    }
    if (isJuanLuna) {
      return { lat: 7.0725891, lng: 125.6160124 };
    }
    if (isBrc) {
      return { lat: 7.0680548, lng: 125.6125343 };
    }
    if (isCorrela) {
      return { lat: 7.06945, lng: 125.61468 };
    }
    return {
      lat: Number(property?.latitude) || 7.0871921,
      lng: Number(property?.longitude) || 125.6091495,
    };
  }, [isIvory, isJuanLuna, isBrc, isCorrela, property?.latitude, property?.longitude]);

  const [originMarkerPos, setOriginMarkerPos] = useState(defaultOriginPos);
  const [propertyMarkerPos, setPropertyMarkerPos] = useState(defaultDestPos);

  useEffect(() => {
    setOriginMarkerPos(defaultOriginPos);
    setPropertyMarkerPos(defaultDestPos);
  }, [defaultOriginPos, defaultDestPos]);

  // Center between origin and destination
  const center = useMemo(
    () => ({
      lat: (originMarkerPos.lat + propertyMarkerPos.lat) / 2,
      lng: (originMarkerPos.lng + propertyMarkerPos.lng) / 2,
    }),
    [originMarkerPos, propertyMarkerPos]
  );

  // Auto-center and zoom so both origin and destination markers are visible
  const fitMapToRoute = useCallback(
    (mapInstance) => {
      if (!mapInstance || !window.google?.maps) return;
      if (directions?.routes?.[0]?.bounds) {
        mapInstance.fitBounds(directions.routes[0].bounds, {
          top: 48,
          right: 48,
          bottom: 48,
          left: 48,
        });
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(originMarkerPos);
        bounds.extend(propertyMarkerPos);
        mapInstance.fitBounds(bounds, {
          top: 48,
          right: 48,
          bottom: 48,
          left: 48,
        });
      }
    },
    [directions, originMarkerPos, propertyMarkerPos]
  );

  const onMapLoad = useCallback(
    (loadedMap) => {
      setMap(loadedMap);
      fitMapToRoute(loadedMap);
    },
    [fitMapToRoute]
  );

  useEffect(() => {
    if (map) {
      fitMapToRoute(map);
    }
  }, [map, fitMapToRoute]);

  // Fetch walking route from origin to destination
  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;

    let isMounted = true;
    const directionsService = new window.google.maps.DirectionsService();

    // Primary attempt: Request route with exact addresses / coordinates
    directionsService.route(
      {
        origin: originAddress,
        destination: isJuanLuna ? defaultDestPos : destinationAddress,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (!isMounted) return;
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setDirectionsFailed(false);
          const startLoc = result.routes[0]?.legs[0]?.start_location;
          const endLoc = result.routes[0]?.legs[0]?.end_location;
          if (startLoc) setOriginMarkerPos({ lat: startLoc.lat(), lng: startLoc.lng() });
          if (endLoc) setPropertyMarkerPos({ lat: endLoc.lat(), lng: endLoc.lng() });
        } else {
          // Fallback: Request route with exact coordinates
          directionsService.route(
            {
              origin: defaultOriginPos,
              destination: defaultDestPos,
              travelMode: window.google.maps.TravelMode.WALKING,
            },
            (fallbackResult, fallbackStatus) => {
              if (!isMounted) return;
              if (fallbackStatus === window.google.maps.DirectionsStatus.OK && fallbackResult) {
                setDirections(fallbackResult);
                setDirectionsFailed(false);
                const startLoc = fallbackResult.routes[0]?.legs[0]?.start_location;
                const endLoc = fallbackResult.routes[0]?.legs[0]?.end_location;
                if (startLoc) setOriginMarkerPos({ lat: startLoc.lat(), lng: startLoc.lng() });
                if (endLoc) setPropertyMarkerPos({ lat: endLoc.lat(), lng: endLoc.lng() });
              } else {
                setDirectionsFailed(true);
              }
            }
          );
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [isLoaded, originAddress, destinationAddress, defaultOriginPos, defaultDestPos, isJuanLuna]);

  const mapsDirectionsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(originAddress)}` +
    `&destination=${isJuanLuna ? '7.0725891,125.6160124' : encodeURIComponent(destinationAddress)}` +
    `&travelmode=walking`;

  if (!apiKey) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
        Map unavailable — add <code className="rounded bg-slate-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to
        client/.env
      </div>
    );
  }

  if (loadError || authFailed) {
    return <GoogleMapsErrorHelp />;
  }

  if (!isLoaded) return <Loader message="Loading map…" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>From Ateneo de Davao</span>
          <WalkingTimeBadge minutes={walkingMinutes} />
        </div>
        <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary">
            Open directions in Google Maps
          </Button>
        </a>
      </div>

      <p className="text-sm text-slate-600">{property?.address || destinationAddress}</p>

      <div className="h-[320px] overflow-hidden rounded-xl border border-slate-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: { strokeColor: '#003366', strokeWeight: 5, strokeOpacity: 0.85 },
              }}
            />
          )}

          {directionsFailed && !directions && (
            <Polyline
              path={[originMarkerPos, propertyMarkerPos]}
              options={{
                strokeColor: '#003366',
                strokeOpacity: 0.55,
                strokeWeight: 4,
                geodesic: true,
              }}
            />
          )}

          <Marker
            position={originMarkerPos}
            title="Ateneo de Davao University"
            label={{ text: 'G', color: 'white', fontWeight: 'bold' }}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
              scale: 9,
              fillColor: '#003366',
              fillOpacity: 1,
              strokeColor: '#C5A900',
              strokeWeight: 2,
            }}
          />

          <Marker
            position={propertyMarkerPos}
            title={property?.name || 'Property'}
            label={{ text: 'P', color: 'white', fontWeight: 'bold' }}
          />
        </GoogleMap>
      </div>
    </div>
  );
}
