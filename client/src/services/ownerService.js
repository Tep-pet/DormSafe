import { apiClient } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function submitVerification(file, token) {
  const formData = new FormData();
  formData.append('permit', file);

  const response = await fetch(`${API_URL}/api/owners/verification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data;
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
};
