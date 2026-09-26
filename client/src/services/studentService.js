import { apiClient } from './apiClient';

export const studentService = {
  getMyStays(token) {
    return apiClient.get('/api/students/stays', token);
  },
  updateMoveOut(tenantId, moveOutDate, token) {
    return apiClient.patch(`/api/students/stays/${tenantId}/move-out`, { move_out_date: moveOutDate }, token);
  },
  confirmMoveOut(tenantId, token) {
    return apiClient.post(`/api/students/stays/${tenantId}/confirm-move-out`, {}, token);
  },
  disputeMoveOut(tenantId, reason, token) {
    return apiClient.post(`/api/students/stays/${tenantId}/dispute-move-out`, { reason }, token);
  },
  getLeaseSummary(tenantId, token) {
    return apiClient.get(`/api/students/stays/${tenantId}/lease-summary`, token);
  },
  rerent(tenantId, token, body = {}) {
    return apiClient.post(`/api/students/stays/${tenantId}/rerent`, body, token);
  },
  getReservations(token) {
    return apiClient.get('/api/students/reservations', token);
  },
  createReservation(body, token) {
    return apiClient.post('/api/students/reservations', body, token);
  },
  updateReservation(id, reservedStartDate, token) {
    return apiClient.patch(`/api/students/reservations/${id}`, { reserved_start_date: reservedStartDate }, token);
  },
  getPayments(token) {
    return apiClient.get('/api/students/payments', token);
  },
  getFavorites(token, gate = 'jacinto') {
    return apiClient.get(`/api/students/favorites?gate=${encodeURIComponent(gate)}`, token);
  },
  toggleFavorite(propertyId, token) {
    return apiClient.post(`/api/students/favorites/${propertyId}`, {}, token);
  },
  requestRoom(body, token) {
    return apiClient.post('/api/students/inquiries', body, token);
  },
  getInquiries(token) {
    return apiClient.get('/api/students/inquiries', token);
  },
  updateInquiry(id, body, token) {
    return apiClient.patch(`/api/students/inquiries/${id}`, body, token);
  },
  cancelInquiry(id, token) {
    return apiClient.post(`/api/students/inquiries/${id}/cancel`, {}, token);
  },
  createReview(body, token) {
    return apiClient.post('/api/students/reviews', body, token);
  },
  reportListing(body, token) {
    return apiClient.post('/api/students/reports', body, token);
  },
  getMaintenance(token) {
    return apiClient.get('/api/students/maintenance', token);
  },
  createMaintenance(body, token) {
    return apiClient.post('/api/students/maintenance', body, token);
  },
};
