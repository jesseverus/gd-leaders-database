// src/hooks/useDb.js
// Replaces the window.storage useShared hook.
// Loads from Supabase on mount, and provides save/upsert/delete helpers.
// Falls back to the bundled JSON seed data if the DB is empty (first run).

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/supabase.js';

// Seed data (bundled JSON — the source of truth for first-run seeding)
import seedOfficers     from '../data/officers.json';
import seedCerts        from '../data/certs.json';
import seedTransfers    from '../data/transfers.json';
import seedTerminations from '../data/terminations.json';
import seedPortTrials   from '../data/port_trials.json';
import seedPortCS       from '../data/port_callsigns.json';
import seedFTO          from '../data/fto_officers.json';

const SEEDS = {
  officers:     seedOfficers,
  certs:        seedCerts,
  transfers:    seedTransfers,
  terminations: seedTerminations,
  portTrials:   seedPortTrials,
  portCallsigns:seedPortCS,
  ftoOfficers:  seedFTO,
};

/**
 * useDb(table) — returns [rows, helpers, ready]
 *
 * helpers = {
 *   upsert(row)      — insert or update a single row
 *   upsertMany(arr)  — bulk upsert
 *   remove(id)       — delete by id
 *   set(arr)         — replace entire local state (does NOT push to DB; use upsertMany)
 * }
 */
export function useDb(table) {
  const [rows,  setRows]  = useState([]);
  const [ready, setReady] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let data = await db[table].getAll();

        // If the table is empty and we haven't seeded yet, push seed data
        if (data.length === 0 && !seededRef.current) {
          seededRef.current = true;
          const seed = SEEDS[table] ?? [];
          if (seed.length > 0) {
            await db[table].upsertMany(seed);
            data = seed;
          }
        }

        if (!cancelled) setRows(data);
      } catch (err) {
        console.error(`useDb(${table}) load error:`, err);
        // Fall back to seed data so the UI still works offline
        if (!cancelled) setRows(SEEDS[table] ?? []);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [table]);

  const upsert = useCallback(async (row) => {
    setRows(prev => {
      const exists = prev.find(r => r.id === row.id);
      return exists ? prev.map(r => r.id === row.id ? row : r) : [...prev, row];
    });
    try { await db[table].upsert(row); }
    catch (err) { console.error(`useDb.upsert(${table}):`, err); }
  }, [table]);

  const upsertMany = useCallback(async (arr) => {
    setRows(arr);
    try { await db[table].upsertMany(arr); }
    catch (err) { console.error(`useDb.upsertMany(${table}):`, err); }
  }, [table]);

  const remove = useCallback(async (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
    try { await db[table].delete(id); }
    catch (err) { console.error(`useDb.remove(${table}):`, err); }
  }, [table]);

  // set() is a local-only state update — call upsertMany() to also persist
  const set = useCallback((arr) => setRows(arr), []);

  return [rows, { upsert, upsertMany, remove, set }, ready];
}
