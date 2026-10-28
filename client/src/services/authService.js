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
    let backendError = null;

    // 1. Trigger backend with branded Gmail SMTP service
    try {
      const res = await apiClient.post('/api/auth/forgot-password', { email: cleanEmail });
      return { sent: true, data: res.data || res };
    } catch (err) {
      backendError = err;
      console.warn('[authService] Backend forgot-password error, falling back to Supabase:', err.message);
    }

    // 2. Fallback to Supabase direct reset if backend is offline/unreachable
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (error) throw error;
      return { sent: true, data };
    } catch (sbErr) {
      console.warn('[authService] Supabase reset error:', sbErr.message);
      throw new Error(
        backendError?.message || sbErr.message || 'Unable to send reset email. Please verify your address.'
      );
    }
  },

  async verifyRecoveryOtp({ email, token, token_hash }) {
    if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery',
      });
      if (error) throw error;
      return data;
    }
    if (email && token) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'recovery',
      });
      if (error) throw error;
      return data;
    }
    throw new Error('Missing verification token or recovery code');
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  /** Reset password directly via verified OTP code and new password */
  async resetPasswordWithCode({ email, code, newPassword }) {
    const res = await apiClient.post('/api/auth/reset-password-with-code', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    });
    return res.data || res;
  },
};

