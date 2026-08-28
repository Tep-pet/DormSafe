import { apiClient } from './apiClient';

export const notificationService = {
  list(token) {
    return apiClient.get('/api/notifications', token);
  },
  unreadCount(token) {
    return apiClient.get('/api/notifications/unread-count', token);
  },
  markRead(id, token) {
    return apiClient.patch(`/api/notifications/${id}/read`, {}, token);
  },
  markAllRead(token) {
    return apiClient.patch('/api/notifications/read-all', {}, token);
  },
};
