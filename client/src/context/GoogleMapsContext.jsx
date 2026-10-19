import { createContext, useContext, useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  authFailed: false,
  apiKey: '',
});

/** Stable loader id — prevents duplicate script tags and preloads Maps JS early */
const MAPS_LOADER_ID = 'dormsafe-google-maps';

export function GoogleMapsProvider({ children }) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, authFailed, apiKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

/** Shown when Google rejects the browser API key (billing, referrer, or wrong APIs) */
export function GoogleMapsErrorHelp() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium">Google Maps could not load</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900">
        <li>
          <strong>Billing</strong> must be enabled on your Google Cloud project (required even for
          free tier)
        </li>
        <li>
          Use a <strong>browser key</strong> in <code className="rounded bg-amber-100 px-1">client/.env</code>{' '}
          with referrer <code className="rounded bg-amber-100 px-1">http://localhost:5173/*</code>
        </li>
        <li>
          That key needs <strong>Maps JavaScript API</strong> and <strong>Directions API</strong>{' '}
          enabled under API restrictions
        </li>
        <li>
          Use a <strong>separate server key</strong> in <code className="rounded bg-amber-100 px-1">server/.env</code>{' '}
          (no referrer restriction) for Distance Matrix
        </li>
      </ul>
    </div>
  );
}
