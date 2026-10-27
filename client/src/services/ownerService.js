import { apiClient } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function submitVerification(file, token) {
  const formData = new FormData();
  formData.append('permit', file);
  return apiClient.upload('/api/owners/verification', formData, token);
}

export const ownerService = {
  getAnalytics(token, propertyId) {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return apiClient.get(`/api/owners/analytics${qs}`, token);
  },
  getOccupancy(token, propertyId) {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return apiClient.get(`/api/owners/occupancy${qs}`, token);
  },
  sendPaymentReminders(token) {
    return apiClient.post('/api/owners/payment-reminders', {}, token);
  },
  getMaintenance(token) {
    return apiClient.get('/api/owners/maintenance', token);
  },
  updateMaintenance(id, status, token) {
    return apiClient.patch(`/api/owners/maintenance/${id}`, { status }, token);
  },
  getInquiries(token) {
    return apiClient.get('/api/owners/inquiries', token);
  },
  replyToInquiry(id, body, token) {
    return apiClient.post(`/api/owners/inquiries/${id}/reply`, body, token);
  },
};
