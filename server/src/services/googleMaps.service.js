/**
 * Legacy Google Maps service bridge — redirected to matrixRouting.service.js (OpenRouteService & Haversine).
 * Zero Google Maps dependencies remain.
 */
export {
  getWalkingDurationMinutes,
  getWalkingDurationsBatch,
} from './matrixRouting.service.js';
