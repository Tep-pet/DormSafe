import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { CAMPUS_GATES, SEARCH_RADIUS_KM } from '../../constants/campusGates';
import { useGoogleMaps, GoogleMapsErrorHelp } from '../../context/GoogleMapsContext';
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
 * Script is preloaded app-wide via GoogleMapsProvider (target: load < 3s).
 */
export function MapView({ gateId = 'jacinto', properties = [], onMarkerClick }) {
  const { isLoaded, loadError, authFailed, apiKey } = useGoogleMaps();
  const gate = CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;

  if (!apiKey) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 p-4 text-center text-sm text-gray-600">
        Add <code className="mx-1 rounded bg-gray-200 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to
        client/.env to enable the map.
      </div>
    );
  }

  if (loadError || authFailed) {
    return <GoogleMapsErrorHelp />;
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
