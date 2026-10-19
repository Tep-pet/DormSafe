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
};
