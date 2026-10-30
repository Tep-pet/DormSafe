import { apiClient } from '../apiClient.js';

/**
 * Verified ground-truth routes calibrated to exact student walking paths.
 * Guarantees routes strictly follow actual sidewalks and street centerlines
 * (matches user-specified verified paths for Jacinto, Roxas, CCFC, and Claveria gates).
 */
function checkVerifiedRoute(origin, destination, mode = 'walk') {
  if (!origin || !destination) return null;
  const oLat = Number(origin.lat);
  const oLng = Number(origin.lng);
  const dLat = Number(destination.lat);
  const dLng = Number(destination.lng);
  const isWalk = mode === 'walk';

  // 1. Corella / Correla Dormitory (108 Roxas Ave)
  if (Math.abs(dLat - 7.06945) < 0.0012 && Math.abs(dLng - 125.61468) < 0.0012) {
    // Ateneo Roxas CCFC Gate (7.07135, 125.61285)
    if (
      (Math.abs(oLat - 7.07135) < 0.0003 && Math.abs(oLng - 125.61285) < 0.0003) ||
      (Math.abs(oLat - 7.07105) < 0.0003 && Math.abs(oLng - 125.61305) < 0.0003) ||
      (Math.abs(oLat - 7.07110) < 0.0003 && Math.abs(oLng - 125.61220) < 0.0003)
    ) {
      return {
        coordinates: [
          [7.07135, 125.61285], // Ateneo Roxas CCFC Gate (Northeast Sidewalk)
          [7.07065, 125.61335], // M. Roxas Ave past Tree of Life / Night Market
          [7.07010, 125.61380], // M. Roxas Ave past Chippens
          [7.06970, 125.61415], // M. Roxas Ave
          [7.06945, 125.61468], // Correla Dormitory (108 Roxas Ave)
        ],
        distanceMeters: 280,
        durationSeconds: (isWalk ? 3 : 2) * 60,
        durationMinutes: isWalk ? 3 : 2,
        formattedDistance: '280 m',
        formattedDuration: `${isWalk ? 3 : 2} min`,
        summary: 'via M. Roxas Ave',
        provider: 'verified',
        trafficAware: false,
        mode,
      };
    }

    // Ateneo Roxas Gate (7.07175, 125.61255)
    if (
      (Math.abs(oLat - 7.07175) < 0.0003 && Math.abs(oLng - 125.61255) < 0.0003) ||
      (Math.abs(oLat - 7.07180) < 0.0003 && Math.abs(oLng - 125.61230) < 0.0003)
    ) {
      return {
        coordinates: [
          [7.07175, 125.61255], // Ateneo Roxas Gate (Northeast Sidewalk)
          [7.07140, 125.61280], // M. Roxas Ave past Roxas Grounds
          [7.07135, 125.61285], // M. Roxas Ave past Ateneo CCFC Gate
          [7.07065, 125.61335], // M. Roxas Ave past Tree of Life / Night Market
          [7.07010, 125.61380], // M. Roxas Ave past Chippens
          [7.06970, 125.61415], // M. Roxas Ave approaching Correla Dormitory
          [7.06945, 125.61468], // Correla Dormitory (108 Roxas Ave)
        ],
        distanceMeters: 350,
        durationSeconds: (isWalk ? 4 : 2) * 60,
        durationMinutes: isWalk ? 4 : 2,
        formattedDistance: '350 m',
        formattedDuration: `${isWalk ? 4 : 2} min`,
        summary: 'via M. Roxas Ave',
        provider: 'verified',
        trafficAware: false,
        mode,
      };
    }

        // Ateneo Jacinto Gate (7.07280, 125.61405)
    if (
      (Math.abs(oLat - 7.07280) < 0.0010 || Math.abs(oLat - 7.07225) < 0.0010 || Math.abs(oLat - 7.07200) < 0.0010) &&
      Math.abs(oLng - 125.61405) < 0.0015
    ) {
      return {
        coordinates: [
          [7.07280, 125.61405], // Ateneo Jacinto Gate (Bellarmine Hall entrance)
          [7.07255, 125.61415], // E. Jacinto St near 7-Eleven
          [7.07220, 125.61415], // E. Jacinto St near Keepsakes / Sun Star
          [7.07170, 125.61395], // E. Jacinto St past PNB
          [7.07125, 125.61375], // E. Jacinto St
          [7.07105, 125.61365], // Corner of E. Jacinto St & Padre Zamora St
          [7.07090, 125.61330], // Padre Zamora St heading southwest
          [7.07075, 125.61290], // Padre Zamora St past Jubilee Hall
          [7.07065, 125.61270], // Corner of Padre Zamora St & M. Roxas Ave (Tree of Life Memorial)
          [7.07035, 125.61305], // M. Roxas Ave heading southeast past Night Market
          [7.07000, 125.61350], // M. Roxas Ave past Padre Gomez St
          [7.06970, 125.61400], // M. Roxas Ave
          [7.06945, 125.61468], // Correla Dormitory (108 Roxas Ave)
        ],
        distanceMeters: 560,
        durationSeconds: (isWalk ? 7 : 4) * 60,
        durationMinutes: isWalk ? 7 : 4,
        formattedDistance: '560 m',
        formattedDuration: `${isWalk ? 7 : 4} min`,
        summary: 'via E. Jacinto St, Padre Zamora St & M. Roxas Ave',
        provider: 'verified',
        trafficAware: false,
        mode,
      };
    }

    // Ateneo Claveria Gate (7.07260, 125.61220)
    if (Math.abs(oLat - 7.07260) < 0.0010 && Math.abs(oLng - 125.61220) < 0.0010) {
      return {
        coordinates: [
          [7.07260, 125.61220], // Ateneo Claveria Gate
          [7.07220, 125.61225], // C.M. Recto Ave turning onto M. Roxas Ave
          [7.07175, 125.61255], // Ateneo Roxas Gate (Northeast Sidewalk)
          [7.07140, 125.61280], // M. Roxas Ave past Roxas Grounds
          [7.07135, 125.61285], // M. Roxas Ave past CCFC Gate
          [7.07065, 125.61335], // M. Roxas Ave past Tree of Life
          [7.07010, 125.61380], // M. Roxas Ave past Chippens
          [7.06970, 125.61415], // M. Roxas Ave
          [7.06945, 125.61468], // Correla Dormitory (108 Roxas Ave)
        ],
        distanceMeters: 480,
        durationSeconds: (isWalk ? 6 : 3) * 60,
        durationMinutes: isWalk ? 6 : 3,
        formattedDistance: '480 m',
        formattedDuration: `${isWalk ? 6 : 3} min`,
        summary: 'via M. Roxas Ave',
        provider: 'verified',
        trafficAware: false,
        mode,
      };
    }
  }

  return null;
}

/**
 * Fetch real road route (walk or drive) from backend live routing service.
 * mode: 'walk' | 'drive'. Throws on failure (caller shows an error state).
 * Returns { coordinates:[[lat,lng],...], distanceMeters, durationSeconds, durationMinutes,
 *           formattedDistance, formattedDuration, summary, provider, trafficAware, mode }
 */
export async function fetchRoute(origin, destination, mode = 'walk') {
  // Check client-side verified ground-truth routes first
  const verified = checkVerifiedRoute(origin, destination, mode);
  if (verified) {
    return verified;
  }

  const q = new URLSearchParams({
    originLat: origin.lat,
    originLng: origin.lng,
    destLat: destination.lat,
    destLng: destination.lng,
    mode,
  });
  const res = await apiClient.get(`/api/proximity/live-route?${q.toString()}`);
  const d = res?.data || res;
  if (!d?.coordinates || d.coordinates.length < 2 || !Number.isFinite(d.durationSeconds)) {
    throw new Error('No route returned');
  }
  const durationMinutes = Math.max(1, Math.ceil(d.durationSeconds / 60));
  const m = Math.round(d.distanceMeters || 0);
  return {
    coordinates: d.coordinates, // already [lat, lng] from the server
    distanceMeters: m,
    durationSeconds: d.durationSeconds,
    durationMinutes,
    formattedDistance: m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`,
    formattedDuration: `${durationMinutes} min`,
    summary: d.summary || '',
    provider: d.provider,
    trafficAware: !!d.trafficAware,
    mode: d.mode,
  };
}
