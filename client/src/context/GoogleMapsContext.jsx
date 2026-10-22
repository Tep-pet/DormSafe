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
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-950 max-w-full overflow-hidden">
      <p className="font-semibold text-amber-950">Google Maps could not load</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-amber-900 leading-relaxed">
        <li>
          <strong>Billing</strong> must be enabled on your Google Cloud project (required even for free tier).
        </li>
        <li>
          If using HTTP referrer restrictions, add your live Vercel domain:{' '}
          <code className="rounded bg-amber-100/90 px-1.5 py-0.5 text-[11px] font-mono break-all inline-block mt-0.5">
            https://*.vercel.app/*
          </code>
        </li>
        <li>
          Ensure <strong>Maps JavaScript API</strong> and <strong>Directions API</strong> are enabled in Google Cloud Console.
        </li>
      </ul>
    </div>
  );
}
