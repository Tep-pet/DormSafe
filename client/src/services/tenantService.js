import { apiClient } from './apiClient';

function withPropertyQuery(path, propertyId) {
  if (!propertyId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}propertyId=${encodeURIComponent(propertyId)}`;
}

export const tenantService = {
  list(token, propertyId) {
    return apiClient.get(withPropertyQuery('/api/tenants', propertyId), token);
  },
  create(data, token) {
    return apiClient.post('/api/tenants', data, token);
  },
  remove(id, token) {
    return apiClient.delete(`/api/tenants/${id}`, token);
  },
};
