// src/hooks/useRealtimeChanges.js
// Realtime change notifications with:
// - Per-record debounce (DEBOUNCE_MS) so rapid typing doesn't flood notifications
// - Auto-dismiss toasts after AUTO_DISMISS_MS
// - Auto-reload when external change arrives, UNLESS user is actively typing
// - If typing: queues a reload and shows toast; reloads when they stop (on blur)
// - Modal/overlay fields: never trigger reload until focus leaves the modal

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const DEBOUNCE_MS     = 2500;
const AUTO_DISMISS_MS = 6000;

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

// Returns true if the currently focused element is inside a modal overlay
// (anything with zIndex >= 9000 or a [data-modal] attribute in its ancestor chain)
function isInsideModal(el) {
  let node = el;
  while (node && node !== document.body) {
    const z = parseInt(window.getComputedStyle(node).zIndex || '0', 10);
    if (z >= 9000) return true;
    if (node.dataset?.modal !== undefined) return true;
    node = node.parentElement;
  }
  return false;
}

export function useRealtimeChanges() {
  const [changes, setChanges] = useState([]);
  const debounceTimers        = useRef({});
  const dismissTimers         = useRef({});
  const recentWrites          = useRef(new Set());
  const isTyping              = useRef(false);  // true while an input/textarea has focus
  const isInModal             = useRef(false);  // true if focused element is in a modal
  const pendingReload         = useRef(false);  // reload queued but waiting for blur

  // ── Typing detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const onFocusIn = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        isTyping.current  = true;
        isInModal.current = isInsideModal(e.target);
      }
    };
    const onFocusOut = () => {
      isTyping.current  = false;
      isInModal.current = false;
      // If a reload was queued while the user was typing, do it now
      if (pendingReload.current) {
        pendingReload.current = false;
        window.location.reload();
      }
    };
    document.addEventListener('focusin',  onFocusIn,  true);
    document.addEventListener('focusout', onFocusOut, true);
    return () => {
      document.removeEventListener('focusin',  onFocusIn,  true);
      document.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);

  // ── Auto-dismiss timer ───────────────────────────────────────────────────────
  const scheduleDismiss = useCallback((key) => {
    clearTimeout(dismissTimers.current[key]);
    dismissTimers.current[key] = setTimeout(() => {
      setChanges(prev => prev.filter(c => c.key !== key));
      delete dismissTimers.current[key];
    }, AUTO_DISMISS_MS);
  }, []);

  // ── Supabase subscription ────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('gdl_realtime_all');

    ALL_TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const row       = payload.new || payload.old;
        const id        = row?.id;
        const eventType = payload.eventType;

        // Ignore our own writes
        if (id && recentWrites.current.has(id)) return;

        const debounceKey = `${table}_${id}`;
        clearTimeout(debounceTimers.current[debounceKey]);

        debounceTimers.current[debounceKey] = setTimeout(() => {
          delete debounceTimers.current[debounceKey];

          // ── Decide whether to auto-reload or show a toast ────────────────
          const userBusy = isTyping.current; // true if they're in any input field

          if (!userBusy) {
            // Nobody typing — reload immediately and silently
            window.location.reload();
            return;
          }

          // User is typing — show toast and queue reload for when they finish
          // But if they're inside a modal, don't queue — wait for them to close it
          if (!isInModal.current) {
            pendingReload.current = true;
          }

          // Show toast notification
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
              pending: !isInModal.current, // will auto-reload on blur
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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const markWritten = useCallback((id) => {
    if (!id) return;
    recentWrites.current.add(id);
    setTimeout(() => recentWrites.current.delete(id), DEBOUNCE_MS + 500);
  }, []);

  const dismiss = useCallback(() => {
    Object.values(dismissTimers.current).forEach(clearTimeout);
    dismissTimers.current = {};
    pendingReload.current = false;
    setChanges([]);
  }, []);

  const dismissOne = useCallback((key) => {
    clearTimeout(dismissTimers.current[key]);
    delete dismissTimers.current[key];
    setChanges(prev => {
      const remaining = prev.filter(c => c.key !== key);
      // If no more pending reloads in the queue, cancel the pending flag
      if (!remaining.some(c => c.pending)) pendingReload.current = false;
      return remaining;
    });
  }, []);

  return { changes, markWritten, dismiss, dismissOne };
}
