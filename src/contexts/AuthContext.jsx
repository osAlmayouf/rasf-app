import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(undefined); // undefined = loading
  const [profile,  setProfile]  = useState(null);

  // ── Fetch user profile (role + sectors) ───────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  }, []);

  // ── Listen for auth changes ────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        fetchProfile(session?.user?.id);
      })
      .catch(() => setSession(null)); // missing/invalid env vars → show login

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchProfile(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  // ── Create user via Edge Function (admin only) ────────────────────
  const createUser = useCallback(async ({ email, password, fullName, role, sectors }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password, fullName, role, sectors }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to create user');
    return json;
  }, []);

  // ── Change own password ───────────────────────────────────────────
  const changeOwnPassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    // Update bcrypt hash in profile too
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user?.id) {
      const bcrypt = await import('bcryptjs');
      const hash = bcrypt.hashSync(newPassword, 12);
      await supabase.from('user_profiles').update({ password: hash, updated_at: new Date().toISOString() }).eq('id', s.user.id);
    }
  }, []);

  // ── Admin change another user's password via Edge Function ────────
  const adminChangeUserPassword = useCallback(async (userId, newPassword) => {
    const { data: { session: s } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-password`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${s.access_token}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId, newPassword }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to update password');
    return json;
  }, []);

  // ── Update user profile (admin only) ──────────────────────────────
  const updateUserProfile = useCallback(async (userId, updates) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  }, []);

  // ── List all users (admin only) ────────────────────────────────────
  const listUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  }, []);

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin      = profile?.role === 'admin' || isSuperAdmin;
  const isDepAdmin   = isAdmin || profile?.role === 'dep_admin';
  const loading    = session === undefined;
  const loggedIn   = !!session;

  return (
    <AuthContext.Provider value={{
      session, profile, loading, loggedIn, isSuperAdmin, isAdmin, isDepAdmin,
      login, logout, createUser, updateUserProfile, listUsers,
      changeOwnPassword, adminChangeUserPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
