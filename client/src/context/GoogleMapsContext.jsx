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
  const [copied, setCopied] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://dormsafe.vercel.app';
  const recommendedReferrers = [
    `${currentOrigin}/*`,
    'https://*.vercel.app/*',
    'http://localhost:5173/*',
  ];

  const handleCopy = () => {
    navigator.clipboard?.writeText(recommendedReferrers.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs sm:text-sm text-amber-950 max-w-full overflow-hidden shadow-xs">
      <div className="flex items-center gap-2 mb-2 font-bold text-amber-900 text-sm">
        <span>⚠️ Google Maps Authorization Error</span>
      </div>
      <p className="text-amber-800 leading-relaxed mb-3">
        Google is blocking this domain (<strong>{currentOrigin}</strong>) because your API key was restricted to <code>localhost</code> during local development.
      </p>

      <div className="rounded-xl border border-amber-200/80 bg-white/90 p-3 mb-3 space-y-2">
        <p className="font-semibold text-xs text-slate-800">
          How to fix in 1 minute on Google Cloud Console:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
          <li>
            Open{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ateneo-blue font-semibold underline hover:text-blue-900"
            >
              Google Cloud Credentials ↗
            </a>
          </li>
          <li>Click on your browser API key.</li>
          <li>Under <strong>Website restrictions (HTTP referrers)</strong>, add these allowed URLs:</li>
        </ol>

        <div className="rounded-lg bg-slate-900 p-2.5 text-slate-100 font-mono text-[11px] space-y-1 select-all break-all">
          <div>https://*.vercel.app/*</div>
          <div>{currentOrigin}/*</div>
          <div>http://localhost:5173/*</div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-ateneo-blue text-white font-medium text-xs hover:bg-blue-900 transition flex items-center justify-center gap-1.5"
        >
          {copied ? '✓ Copied URLs to Clipboard' : 'Copy Allowed URLs'}
        </button>
      </div>

      <div className="text-[11px] text-amber-800 space-y-1 border-t border-amber-200/60 pt-2.5">
        <p>• Also ensure <strong>Maps JavaScript API</strong> & <strong>Directions API</strong> are enabled.</p>
        <p>• Ensure an active <strong>Billing</strong> account is linked to your Google Cloud project.</p>
        <p className="text-[10px] text-amber-600 mt-1">Note: Google Cloud changes take ~1-2 minutes to propagate globally.</p>
      </div>
    </div>
  );
}
