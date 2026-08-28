import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  Marker,
  DirectionsService,
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

function fitMapToMarkers(map, gatePos, propertyPos) {
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(gatePos);
  bounds.extend(propertyPos);
  map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
}

/**
 * Property detail map — shows listing location, campus gate, and walking route.
 */
export function PropertyLocationMap({ property, gateId, walkingMinutes }) {
  const { isLoaded, loadError, authFailed, apiKey } = useGoogleMaps();
  const [directions, setDirections] = useState(null);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [map, setMap] = useState(null);

  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
  const propertyPos = useMemo(
    () => ({ lat: property.latitude, lng: property.longitude }),
    [property.latitude, property.longitude]
  );
  const gatePos = useMemo(() => ({ lat: gate.lat, lng: gate.lng }), [gate.lat, gate.lng]);

  const center = useMemo(
    () => ({
      lat: (propertyPos.lat + gatePos.lat) / 2,
      lng: (propertyPos.lng + gatePos.lng) / 2,
    }),
    [propertyPos, gatePos]
  );

  const onMapLoad = useCallback(
    (loadedMap) => {
      setMap(loadedMap);
      fitMapToMarkers(loadedMap, gatePos, propertyPos);
    },
    [gatePos, propertyPos]
  );

  useEffect(() => {
    if (map) fitMapToMarkers(map, gatePos, propertyPos);
  }, [map, gatePos, propertyPos]);

  const directionsCallback = useCallback((response, status) => {
    if (status === 'OK' && response) {
      setDirections(response);
      setDirectionsFailed(false);
    } else if (status !== 'OK') {
      setDirectionsFailed(true);
    }
  }, []);

  const mapsDirectionsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${gate.lat},${gate.lng}` +
    `&destination=${property.latitude},${property.longitude}` +
    `&travelmode=walking`;

  if (!apiKey) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600">
        Map unavailable — add <code className="rounded bg-gray-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>From {gate.label}</span>
          <WalkingTimeBadge minutes={walkingMinutes} />
        </div>
        <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary">
            Open directions in Google Maps
          </Button>
        </a>
      </div>

      <p className="text-sm text-gray-600">{property.address}</p>

      <div className="h-[320px] overflow-hidden rounded-lg border border-gray-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {!directions && !directionsFailed && (
            <DirectionsService
              options={{
                origin: gatePos,
                destination: propertyPos,
                travelMode: google.maps.TravelMode.WALKING,
              }}
              callback={directionsCallback}
            />
          )}

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
              path={[gatePos, propertyPos]}
              options={{
                strokeColor: '#003366',
                strokeOpacity: 0.45,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          )}

          <Marker
            position={gatePos}
            title={gate.label}
            label={{ text: 'G', color: 'white', fontWeight: 'bold' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#003366',
              fillOpacity: 1,
              strokeColor: '#C5A900',
              strokeWeight: 2,
            }}
          />

          <Marker
            position={propertyPos}
            title={property.name}
            label={{ text: 'P', color: 'white', fontWeight: 'bold' }}
          />
        </GoogleMap>
      </div>
    </div>
  );
}
