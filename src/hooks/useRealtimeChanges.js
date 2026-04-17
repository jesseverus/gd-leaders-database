// src/hooks/useRealtimeChanges.js
// Subscribes to real-time changes on all GDL tables via Supabase Realtime.
// Ignores changes made by the current browser session (MY_SESSION_ID).
// Returns a list of pending change notifications and a dismiss/reload function.

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// A random ID stamped on every write so we can ignore our own changes.
// Stored in sessionStorage so it persists across re-renders but resets on new tabs.
const getSessionId = () => {
  let id = sessionStorage.getItem('gdl_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('gdl_session_id', id);
  }
  return id;
};
export const MY_SESSION_ID = getSessionId();

// Human-readable table labels
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

// Best-effort human name from a raw DB row
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
  const [changes, setChanges] = useState([]); // list of { id, table, event, label, time }
  const channelRef = useRef(null);

  useEffect(() => {
    // Subscribe to all tables via a single Postgres Changes channel
    const channel = supabase.channel('gdl_realtime_all');

    ALL_TABLES.forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          // Ignore our own writes (stamped via session_id column not present — 
          // we use a lightweight approach: ignore changes that happen within
          // 2 seconds of a local write to the same record id)
          const row  = payload.new || payload.old;
          const id   = row?.id;
          const event = payload.eventType; // INSERT | UPDATE | DELETE

          // Check if this id was recently written by us
          if (id && recentWrites.current.has(id)) return;

          const label = rowLabel(table, row);
          const eventWord = event === 'INSERT' ? 'added' : event === 'DELETE' ? 'removed' : 'updated';

          setChanges(prev => {
            // Deduplicate — if same id+table already pending, update it
            const without = prev.filter(c => !(c.id === id && c.table === table));
            return [...without, {
              key:   `${table}_${id}_${Date.now()}`,
              table,
              tableLabel: TABLE_LABELS[table] || table,
              event: eventWord,
              label: label || 'a record',
              time:  new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' }),
            }].slice(-20); // cap at 20 pending notifications
          });
        }
      );
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track recent local writes so we can suppress self-notifications
  const recentWrites = useRef(new Set());

  const markWritten = useCallback((id) => {
    if (!id) return;
    recentWrites.current.add(id);
    // Remove after 3 seconds — enough time for the realtime event to arrive
    setTimeout(() => recentWrites.current.delete(id), 3000);
  }, []);

  const dismiss = useCallback(() => setChanges([]), []);

  return { changes, markWritten, dismiss };
}
