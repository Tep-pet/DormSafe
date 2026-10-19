import { supabase } from './supabaseClient';

/**
 * HTTP client for Express API (Logic Layer).
 * Attaches Supabase JWT when available and handles transparent retry
 * on transient network drops (e.g. idle socket resets, keep-alive race conditions).
 */
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Resolves candidates for target URL:
 * Primary: configured API_URL (e.g. http://localhost:5000/api/...)
 * Fallback: same-origin path (/api/...) proxied by Vite dev server
 */
function getUrlCandidates(path) {
  if (API_URL) {
    const primary = `${API_URL}${path}`;
    const fallback = path;
    return primary !== fallback ? [primary, fallback] : [primary];
  }
  return [path];
}

/**
 * Resolve fresh access token from Supabase session if not passed or stale
 */
async function resolveToken(token) {
  if (token) return token;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Checks if an error is a transient network error (e.g. ECONNRESET, keepalive drop, Failed to fetch)
 */
function isNetworkError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('connection')
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeFetch(url, { method = 'GET', body, token, formData } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function request(path, { method = 'GET', body, token, formData } = {}) {
  let activeToken = await resolveToken(token);
  const candidates = getUrlCandidates(path);
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const targetUrl = candidates[attempt % candidates.length];

    try {
      const { response, data } = await executeFetch(targetUrl, {
        method,
        body,
        token: activeToken,
        formData,
      });

      // Handle 401: attempt token refresh once
      if (response.status === 401 && attempt === 0) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session?.access_token) {
            activeToken = refreshData.session.access_token;
            continue; // retry with refreshed token
          }
        } catch {
          // ignore refresh error and throw standard response error below
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      return data;
    } catch (err) {
      lastError = err;

      // Only retry on transient network errors (Failed to fetch, connection resets)
      // Do NOT retry application/HTTP logic errors (e.g. 400 validation, 404)
      if (isNetworkError(err) && attempt < maxRetries) {
        await sleep(150 * (attempt + 1));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('Request failed');
}

export const apiClient = {
  get: (path, token) => request(path, { method: 'GET', token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  put: (path, body, token) => request(path, { method: 'PUT', body, token }),
  patch: (path, body, token) => request(path, { method: 'PATCH', body, token }),
  delete: (path, token) => request(path, { method: 'DELETE', token }),
  upload: (path, formData, token) => request(path, { method: 'POST', formData, token }),
};

