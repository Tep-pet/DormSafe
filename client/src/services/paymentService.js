import { apiClient } from './apiClient';

function withPropertyQuery(path, propertyId) {
  if (!propertyId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}propertyId=${encodeURIComponent(propertyId)}`;
}

export const paymentService = {
  list(token, propertyId) {
    return apiClient.get(withPropertyQuery('/api/payments', propertyId), token);
  },
  create(data, token) {
    return apiClient.post('/api/payments', data, token);
  },
  updateStatus(id, status, token) {
    return apiClient.patch(`/api/payments/${id}/status`, { status }, token);
  },
  uploadReceipt(id, file, token) {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiClient.upload(`/api/payments/${id}/receipt`, formData, token);
  },
};
