import { apiClient } from './apiClient';

export const propertyService = {
  getDashboardStats(token, propertyId) {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return apiClient.get(`/api/properties/dashboard/stats${qs}`, token);
  },
  getMyProperties(token) {
    return apiClient.get('/api/properties/mine', token);
  },
  createProperty(data, token) {
    return apiClient.post('/api/properties', data, token);
  },
  uploadRoomImages(roomId, files, token) {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return apiClient.upload(`/api/properties/rooms/${roomId}/images`, formData, token);
  },
  updateAvailability(roomId, isAvailable, token) {
    return apiClient.patch(
      `/api/properties/rooms/${roomId}/availability`,
      { is_available: isAvailable },
      token
    );
  },
  getProperty(id, token) {
    return apiClient.get(`/api/properties/${id}`, token);
  },
  updateProperty(id, data, token) {
    return apiClient.patch(`/api/properties/${id}`, data, token);
  },
};
