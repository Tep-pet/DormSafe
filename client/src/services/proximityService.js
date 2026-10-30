import { apiClient } from './apiClient';

const detailCache = new Map();

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

    const res = await apiClient.get(`/api/proximity/search?${params.toString()}`, token);
    const list = res?.data || [];
    // Populate client cache so clicking any property navigates instantly (0ms)
    for (const item of list) {
      if (item?.id) {
        detailCache.set(`prop_${item.id}_${gate || 'jacinto'}`, {
          data: item,
          timestamp: Date.now(),
        });
      }
    }
    return res;
  },

  async getPropertyDetail(id, gate, token) {
    const cacheKey = `prop_${id}_${gate || 'jacinto'}`;
    const cachedItem = this.getCachedProperty(id, gate);

    // If cached in memory with rooms, return immediately (0ms instant page load)
    if (cachedItem?.rooms?.length > 0) {
      // Fire-and-forget background revalidation so user never waits 8 seconds
      apiClient.get(`/api/proximity/properties/${id}?gate=${encodeURIComponent(gate || 'jacinto')}`, token)
        .then((res) => {
          if (res?.data) {
            detailCache.set(cacheKey, { data: res.data, timestamp: Date.now() });
          }
        })
        .catch(() => {});
      return { data: cachedItem };
    }

    const params = new URLSearchParams();
    if (gate) params.set('gate', gate);
    const res = await apiClient.get(`/api/proximity/properties/${id}?${params.toString()}`, token);
    if (res?.data) {
      detailCache.set(cacheKey, {
        data: res.data,
        timestamp: Date.now(),
      });
    }
    return res;
  },

  getCachedProperty(id, gate) {
    const exact = detailCache.get(`prop_${id}_${gate || 'jacinto'}`)?.data;
    if (exact) return exact;
    for (const [key, val] of detailCache.entries()) {
      if (key.startsWith(`prop_${id}_`) && val?.data) {
        return val.data;
      }
    }
    return null;
  },

  async getPropertyById(id, gate, token) {
    const res = await this.getPropertyDetail(id, gate, token);
    return res?.data || res;
  },
};
