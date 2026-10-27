import { supabase } from './supabaseClient';
import { apiClient } from './apiClient';

export const authService = {
  /** Register via server API with ID / license upload */
  async registerWithDocuments({ email, password, fullName, role, idFile, licenseFile }) {
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email.trim());
    formData.append('password', password);
    formData.append('role', role);
    formData.append('idDocument', idFile);
    if (licenseFile) formData.append('licenseDocument', licenseFile);
    return apiClient.upload('/api/auth/register', formData);
  },

  /** @deprecated use registerWithDocuments */
  async register({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) throw error;
    return data;
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async forgotPassword(email) {
    const cleanEmail = email.trim();
    const redirectTo = `${window.location.origin}/reset-password`;

    // 1. Primary: Trigger backend with branded Gmail SMTP service
    try {
      const res = await apiClient.post('/api/auth/forgot-password', { email: cleanEmail });
      if (res?.data?.success || res?.success) {
        return { sent: true };
      }
      if (res?.data?.message) {
        throw new Error(res.data.message);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message;
      if (errMsg && !errMsg.includes('Network Error') && !errMsg.includes('Failed to fetch')) {
        throw new Error(errMsg);
      }
    }

    // 2. Secondary fallback only if backend server is unreachable
    try {
      const { error: sbErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (sbErr) throw sbErr;
      return { sent: true };
    } catch (sbErr) {
      throw new Error(sbErr.message || 'Unable to send password reset email.');
    }
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },
};
