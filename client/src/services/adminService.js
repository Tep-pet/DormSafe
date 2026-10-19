import { apiClient } from './apiClient';

function qs(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const adminService = {
  getDashboardStats(token) {
    return apiClient.get('/api/admin/dashboard/stats', token);
  },
  getPendingListings(token, filters = {}) {
    return apiClient.get(`/api/admin/listings/pending${qs(filters)}`, token);
  },
  getAllProperties(token) {
    return apiClient.get('/api/admin/listings/properties', token);
  },
  getListingDocuments(id, token) {
    return apiClient.get(`/api/admin/listings/${id}/documents`, token);
  },
  approveListing(id, token) {
    return apiClient.patch(`/api/admin/listings/${id}/approve`, {}, token);
  },
  rejectListing(id, token) {
    return apiClient.patch(`/api/admin/listings/${id}/reject`, {}, token);
  },
  removeListing(id, token) {
    return apiClient.patch(`/api/admin/listings/${id}/remove`, {}, token);
  },
  bulkListings(ids, action, token) {
    return apiClient.post('/api/admin/listings/bulk', { ids, action }, token);
  },
  bulkAccounts(ids, status, notes, token) {
    return apiClient.post('/api/admin/accounts/bulk', { ids, status, notes }, token);
  },
  getPendingVerifications(token) {
    return apiClient.get('/api/admin/verifications/pending', token);
  },
  getAccountVerifications(token, filters = {}) {
    return apiClient.get(`/api/admin/verifications/accounts${qs(filters)}`, token);
  },
  getVerificationDocuments(id, token) {
    return apiClient.get(`/api/admin/verifications/accounts/${id}/documents`, token);
  },
  reviewAccountVerification(id, body, token) {
    return apiClient.patch(`/api/admin/verifications/accounts/${id}`, body, token);
  },
  reviewVerification(id, body, token) {
    return apiClient.patch(`/api/admin/verifications/${id}`, body, token);
  },
  getUsers(token) {
    return apiClient.get('/api/admin/users', token);
  },
  getTenants(token) {
    return apiClient.get('/api/admin/tenants', token);
  },
  removeTenant(id, token) {
    return apiClient.delete(`/api/admin/tenants/${id}`, token);
  },
  updateUserRole(id, role, token) {
    return apiClient.patch(`/api/admin/users/${id}/role`, { role }, token);
  },
  reviewUserAccount(id, body, token) {
    return apiClient.patch(`/api/admin/users/${id}/verification`, body, token);
  },
  getAuditLogs(token, page = 1) {
    return apiClient.get(`/api/admin/audit-logs?page=${page}`, token);
  },
  getSystemHealth(token) {
    return apiClient.get('/api/admin/system-health', token);
  },
  getCampusStats(token) {
    return apiClient.get('/api/admin/campus-stats', token);
  },
  getPendingReviews(token) {
    return apiClient.get('/api/admin/reviews/pending', token);
  },
  moderateReview(id, status, token) {
    return apiClient.patch(`/api/admin/reviews/${id}`, { status }, token);
  },
  getPendingReports(token) {
    return apiClient.get('/api/admin/reports/pending', token);
  },
  dismissReport(id, token) {
    return apiClient.patch(`/api/admin/reports/${id}/dismiss`, {}, token);
  },
};
