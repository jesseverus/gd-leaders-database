// src/hooks/useRealtimeChanges.js
// Subscribes to real-time changes on all GDL tables via Supabase Realtime.
// - Debounces per-record: if the same record is updated multiple times within
//   DEBOUNCE_MS, only one notification fires (last write wins).
// - Auto-dismisses each notification after AUTO_DISMISS_MS.
// - Ignores changes made by the current browser session.

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const DEBOUNCE_MS     = 2500; // wait this long after last change before notifying
const AUTO_DISMISS_MS = 6000; // each notification disappears after this long

const getSessionId = () => {
  let id = sessionStorage.getItem('gdl_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('gdl_session_id', id);
  }
  return id;
};
export const MY_SESSION_ID = getSessionId();

const TABLE_LABELS = {
  gd_officers:       'GD Roster',
  gd_certs:          'Certifications',
  gd_transfers:      'Transfers',
  gd_terminations:   'Terminations',
  gd_port_trials:    'PORT Trials',
  gd_port_callsigns: 'PORT Callsigns',
  gd_fto_officers:   'FTO Database',
};
const ALL_TABLES = Object.keys(TABLE_LABELS);

function rowLabel(table, row) {
  if (!row) return '';
  if (table === 'gd_officers')       return row.full_name || row.steam_name || '';
  if (table === 'gd_transfers')      return row.full_name || '';
  if (table === 'gd_terminations')   return row.full_name || '';
  if (table === 'gd_port_trials')    return row.name || '';
  if (table === 'gd_port_callsigns') return `POR ${row.number}${row.officer ? ` (${row.officer})` : ''}`;
  if (table === 'gd_fto_officers')   return row.full_name || '';
  return '';
}

export function useRealtimeChanges() {
  const [changes, setChanges]   = useState([]);
  const debounceTimers          = useRef({});
  const dismissTimers           = useRef({});
  const recentWrites            = useRef(new Set());

  const scheduleDismiss = useCallback((key) => {
    clearTimeout(dismissTimers.current[key]);
    dismissTimers.current[key] = setTimeout(() => {
      setChanges(prev => prev.filter(c => c.key !== key));
      delete dismissTimers.current[key];
    }, AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    const channel = supabase.channel('gdl_realtime_all');

    ALL_TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const row        = payload.new || payload.old;
        const id         = row?.id;
        const eventType  = payload.eventType;

        if (id && recentWrites.current.has(id)) return;

        const debounceKey = `${table}_${id}`;
        clearTimeout(debounceTimers.current[debounceKey]);

        debounceTimers.current[debounceKey] = setTimeout(() => {
          delete debounceTimers.current[debounceKey];

          const label     = rowLabel(table, row);
          const eventWord = eventType === 'INSERT' ? 'added'
                          : eventType === 'DELETE' ? 'removed' : 'updated';
          const key       = `${debounceKey}_${Date.now()}`;

          setChanges(prev => {
            const without = prev.filter(c => c.recordKey !== debounceKey);
            return [...without, {
              key, recordKey: debounceKey, table,
              tableLabel: TABLE_LABELS[table] || table,
              event: eventWord,
              label: label || 'a record',
              time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
            }].slice(-10);
          });

          scheduleDismiss(key);
        }, DEBOUNCE_MS);
      });
    });

    channel.subscribe();
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
      Object.values(dismissTimers.current).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [scheduleDismiss]);

  const markWritten = useCallback((id) => {
    if (!id) return;
    recentWrites.current.add(id);
    setTimeout(() => recentWrites.current.delete(id), DEBOUNCE_MS + 500);
  }, []);

  const dismiss = useCallback(() => {
    Object.values(dismissTimers.current).forEach(clearTimeout);
    dismissTimers.current = {};
    setChanges([]);
  }, []);

  const dismissOne = useCallback((key) => {
    clearTimeout(dismissTimers.current[key]);
    delete dismissTimers.current[key];
    setChanges(prev => prev.filter(c => c.key !== key));
  }, []);

  return { changes, markWritten, dismiss, dismissOne };
}
