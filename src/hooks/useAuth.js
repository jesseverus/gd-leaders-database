// src/hooks/useAuth.js
// Per-user authentication with username + PIN.
// PIN is hashed client-side with SHA-256 before comparing.
// Session stored in sessionStorage — survives refresh, clears on tab close.

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const SESSION_KEY = 'gdl_session';

// SHA-256 hash of a string (returns hex string)
export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Load session from sessionStorage
function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Save session to sessionStorage
function saveSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
  const [session, setSession] = useState(() => loadSession());
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all users (admins see all, users see none — but we load for admin UI)
  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('gd_users').select('*').order('created_at');
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    if (session?.role === 'admin') loadUsers();
  }, [session?.role, loadUsers]);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, pin) => {
    setLoading(true);
    try {
      const hash = await sha256(pin);
      const { data, error } = await supabase
        .from('gd_users')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .eq('pin_hash', hash)
        .single();

      if (error || !data) return { ok: false, error: 'Incorrect username or PIN.' };
      if (!data.is_active) return { ok: false, error: 'Your access has been revoked. Contact an administrator.' };

      const sess = {
        userId:      data.id,
        username:    data.username,
        displayName: data.display_name || data.username,
        role:        data.role,
      };
      setSession(sess);
      saveSession(sess);
      return { ok: true, session: sess };
    } catch (e) {
      return { ok: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  // ── Create user (admin only) ─────────────────────────────────────────────────
  const createUser = useCallback(async ({ username, pin, displayName, role }) => {
    if (!session || session.role !== 'admin') return { ok: false, error: 'Admin only.' };
    const hash = await sha256(pin);
    const id   = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const { error } = await supabase.from('gd_users').insert({
      id, username: username.toLowerCase().trim(),
      pin_hash: hash,
      display_name: displayName.trim(),
      role,
      is_active: true,
      created_by: session.username,
    });
    if (error) return { ok: false, error: error.message };
    await loadUsers();
    return { ok: true };
  }, [session, loadUsers]);

  // ── Update user (admin only) ─────────────────────────────────────────────────
  const updateUser = useCallback(async (id, changes) => {
    if (!session || session.role !== 'admin') return { ok: false, error: 'Admin only.' };
    // If changing PIN, hash it first
    if (changes.pin) {
      changes.pin_hash = await sha256(changes.pin);
      delete changes.pin;
    }
    const { error } = await supabase.from('gd_users').update(changes).eq('id', id);
    if (error) return { ok: false, error: error.message };
    await loadUsers();
    return { ok: true };
  }, [session, loadUsers]);

  // ── Revoke / Restore access ───────────────────────────────────────────────────
  const setActive = useCallback(async (id, isActive) => {
    return updateUser(id, { is_active: isActive });
  }, [updateUser]);

  const isAdmin = session?.role === 'admin';

  return {
    session, users, loading,
    login, logout,
    createUser, updateUser, setActive,
    isAdmin, loadUsers,
  };
}
