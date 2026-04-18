// src/hooks/useAuditLog.js
// Provides a `log(entry)` function and a `useAuditEntries()` reader.
// All entries are attributed to the current session user.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Get current session (set by useAuth on login)
function getSession() {
  try {
    const raw = sessionStorage.getItem('gdl_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useAuditLog() {
  const log = useCallback(async ({ action, subject, detail, tab = '', prevValue = '', newValue = '' }) => {
    const session = getSession();
    try {
      await supabase.from('gd_audit_log').insert({
        id:         genId(),
        action,
        subject:    subject   ?? '',
        detail:     detail    ?? '',
        tab:        tab       ?? '',
        prev_value: prevValue ?? '',
        new_value:  newValue  ?? '',
        user_id:    session?.userId   ?? '',
        username:   session?.displayName ?? session?.username ?? 'Unknown',
      });
    } catch (e) {
      console.warn('Audit log write failed:', e);
    }
  }, []);

  return { log };
}

export function useAuditEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gd_audit_log')
        .select('*')
        .order('ts', { ascending: false })
        .limit(500);
      if (error) throw error;
      setEntries(data ?? []);
    } catch (e) {
      console.warn('Audit log read failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { entries, loading, reload: load };
}
