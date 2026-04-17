// src/hooks/useAuditLog.js
// Provides a `log(entry)` function that writes to gd_audit_log,
// and a `useAuditEntries()` hook to read recent entries.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Write a single audit entry — fire-and-forget (errors logged to console only)
export function useAuditLog() {
  const log = useCallback(async ({ action, subject, detail, tab = '', prevValue = '', newValue = '' }) => {
    try {
      await supabase.from('gd_audit_log').insert({
        id:         genId(),
        action,
        subject:    subject   ?? '',
        detail:     detail    ?? '',
        tab:        tab       ?? '',
        prev_value: prevValue ?? '',
        new_value:  newValue  ?? '',
      });
    } catch (e) {
      console.warn('Audit log write failed:', e);
    }
  }, []);

  return { log };
}

// Read recent audit entries (newest first, last 500)
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
