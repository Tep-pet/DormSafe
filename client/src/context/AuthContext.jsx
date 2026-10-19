import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await authService.getProfile(userId);
      setProfile(p);
      return p;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const s = await authService.getSession();
        if (!mounted) return;
        setSession(s);
        if (s?.user) {
          await loadProfile(s.user.id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      return loadProfile(session.user.id);
    }
    return null;
  }, [session, loadProfile]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isAuthenticated: !!session,
      role: profile?.role ?? null,
      accessToken: session?.access_token ?? null,
      login: authService.login,
      register: authService.register,
      registerWithDocuments: authService.registerWithDocuments,
      logout: authService.logout,
      refreshProfile,
    }),
    [session, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
