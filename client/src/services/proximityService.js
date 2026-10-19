import { apiClient } from './apiClient';

export const proximityService = {
  /**
   * Search approved properties within 2 km of selected campus gate.
   * Proximity Algorithm runs on Express (proposal §3.2).
   */
  async search({ gate, minPrice, maxPrice, propertyType, token }) {
    const params = new URLSearchParams();
    if (gate) params.set('gate', gate);
    if (minPrice != null && minPrice !== '') params.set('minPrice', minPrice);
    if (maxPrice != null && maxPrice !== '') params.set('maxPrice', maxPrice);
    if (propertyType) params.set('propertyType', propertyType);

    return apiClient.get(`/api/proximity/search?${params.toString()}`, token);
  },

  async getPropertyDetail(id, gate, token) {
    const params = new URLSearchParams();
    if (gate) params.set('gate', gate);
    return apiClient.get(`/api/proximity/properties/${id}?${params.toString()}`, token);
  },
};
