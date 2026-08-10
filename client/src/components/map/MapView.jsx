import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { Loader } from '../common/Loader';

const mapContainerStyle = { width: '100%', height: '100%', minHeight: '400px' };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

/**
 * Google Maps view with campus gate, 2 km radius, and property markers.
 * Target: map load < 3 seconds (proposal §1.3).
 */
export function MapView({ gateId = 'jacinto', properties = [], onMarkerClick }) {
  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  if (!apiKey) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 p-4 text-center text-sm text-gray-600">
        Add <code className="mx-1 rounded bg-gray-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to
        client/.env to enable the map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load Google Maps. Check your API key and billing settings.
      </div>
    );
  }

  if (!isLoaded) return <Loader message="Loading map…" />;

  const center = { lat: gate.lat, lng: gate.lng };
  const radiusMeters = SEARCH_RADIUS_KM * 1000;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      options={mapOptions}
    >
      {/* Campus gate marker */}
      <Marker
        position={center}
        title={gate.label}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#003366',
          fillOpacity: 1,
          strokeColor: '#C5A900',
          strokeWeight: 2,
        }}
      />

      {/* 2 km search radius */}
      <Circle
        center={center}
        radius={radiusMeters}
        options={{
          fillColor: '#003366',
          fillOpacity: 0.06,
          strokeColor: '#003366',
          strokeOpacity: 0.4,
          strokeWeight: 1,
        }}
      />

      {/* Approved property markers */}
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={{ lat: p.latitude, lng: p.longitude }}
          title={p.name}
          onClick={() => onMarkerClick?.(p)}
        />
      ))}
    </GoogleMap>
  );
}
