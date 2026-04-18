// src/hooks/useRowLock.js
// Provides row-level "someone is editing this" indicators for the GD Officers table.
//
// Usage:
//   const { locks, acquireLock, releaseLock, releaseAll } = useRowLock(sessionName);
//
// - locks: Map<officerId, { sessionId, sessionName, lockedAt }>
// - acquireLock(officerId): call when a user activates a cell on that row
// - releaseLock(officerId): call when they deactivate
// - releaseAll(): call on unmount / tab change

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { MY_SESSION_ID } from './useRealtimeChanges.js';

const LOCK_TABLE   = 'gd_locks';
const STALE_MS     = 30_000; // locks older than 30s are ignored

export function useRowLock(sessionName = 'A user') {
  const [locks, setLocks] = useState(new Map()); // Map<officerId, lockRow>
  const heldLocks = useRef(new Set());            // officer IDs we currently hold

  // ── Load existing locks + subscribe to changes ──────────────────────────────
  useEffect(() => {
    // Initial fetch
    const load = async () => {
      const { data } = await supabase.from(LOCK_TABLE).select('*');
      if (data) {
        const now = Date.now();
        const fresh = data.filter(r =>
          now - new Date(r.locked_at).getTime() < STALE_MS
        );
        setLocks(new Map(fresh.map(r => [r.officer_id, r])));
      }
    };
    load();

    // Subscribe to realtime changes
    const channel = supabase.channel('gdl_locks')
      .on('postgres_changes', { event: '*', schema: 'public', table: LOCK_TABLE }, (payload) => {
        setLocks(prev => {
          const next = new Map(prev);
          if (payload.eventType === 'DELETE') {
            next.delete(payload.old?.officer_id);
          } else {
            const row = payload.new;
            if (row) {
              // Ignore stale locks
              if (Date.now() - new Date(row.locked_at).getTime() < STALE_MS) {
                next.set(row.officer_id, row);
              }
            }
          }
          return next;
        });
      })
      .subscribe();

    // Periodically evict stale locks from local display
    const staleSweep = setInterval(() => {
      const now = Date.now();
      setLocks(prev => {
        const next = new Map(prev);
        for (const [id, row] of next) {
          if (now - new Date(row.locked_at).getTime() >= STALE_MS) {
            next.delete(id);
          }
        }
        return next;
      });
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(staleSweep);
    };
  }, []);

  // ── Heartbeat — refresh our own locks every 15s so they don't go stale ──────
  useEffect(() => {
    const heartbeat = setInterval(async () => {
      for (const officerId of heldLocks.current) {
        await supabase.from(LOCK_TABLE).upsert({
          officer_id:   officerId,
          session_id:   MY_SESSION_ID,
          session_name: sessionName,
          locked_at:    new Date().toISOString(),
        }, { onConflict: 'officer_id' });
      }
    }, 15_000);
    return () => clearInterval(heartbeat);
  }, [sessionName]);

  // ── Release all our locks on page unload ────────────────────────────────────
  useEffect(() => {
    const cleanup = async () => {
      for (const officerId of heldLocks.current) {
        await supabase.from(LOCK_TABLE)
          .delete().eq('officer_id', officerId).eq('session_id', MY_SESSION_ID);
      }
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  // ── Acquire lock ─────────────────────────────────────────────────────────────
  const acquireLock = useCallback(async (officerId) => {
    if (!officerId) return;
    heldLocks.current.add(officerId);
    try {
      await supabase.from(LOCK_TABLE).upsert({
        officer_id:   officerId,
        session_id:   MY_SESSION_ID,
        session_name: sessionName,
        locked_at:    new Date().toISOString(),
      }, { onConflict: 'officer_id' });
    } catch (e) {
      console.warn('acquireLock failed:', e);
    }
  }, [sessionName]);

  // ── Release lock ─────────────────────────────────────────────────────────────
  const releaseLock = useCallback(async (officerId) => {
    if (!officerId) return;
    heldLocks.current.delete(officerId);
    try {
      await supabase.from(LOCK_TABLE)
        .delete().eq('officer_id', officerId).eq('session_id', MY_SESSION_ID);
    } catch (e) {
      console.warn('releaseLock failed:', e);
    }
  }, []);

  // ── Release all our locks ────────────────────────────────────────────────────
  const releaseAll = useCallback(async () => {
    const ids = [...heldLocks.current];
    heldLocks.current.clear();
    for (const officerId of ids) {
      try {
        await supabase.from(LOCK_TABLE)
          .delete().eq('officer_id', officerId).eq('session_id', MY_SESSION_ID);
      } catch (e) {
        console.warn('releaseAll failed:', e);
      }
    }
  }, []);

  // Helper: is a given officer row locked by someone else?
  const isLockedByOther = useCallback((officerId) => {
    const lock = locks.get(officerId);
    if (!lock) return false;
    if (lock.session_id === MY_SESSION_ID) return false;
    if (Date.now() - new Date(lock.locked_at).getTime() >= STALE_MS) return false;
    return true;
  }, [locks]);

  const lockedBy = useCallback((officerId) => {
    const lock = locks.get(officerId);
    if (!lock) return null;
    if (lock.session_id === MY_SESSION_ID) return null;
    if (Date.now() - new Date(lock.locked_at).getTime() >= STALE_MS) return null;
    return lock.session_name || 'Another user';
  }, [locks]);

  return { locks, acquireLock, releaseLock, releaseAll, isLockedByOther, lockedBy };
}
