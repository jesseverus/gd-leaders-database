// src/hooks/useBackup.js
// Manages automatic daily backups and manual backup/restore.
// Backups are stored in the gd_backups table in Supabase.
// The daily auto-backup runs once per day per browser session.

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_BACKUP_KEY    = 'gdl_last_backup';
const MAX_STORED_BACKUPS = 30; // keep last 30 backups

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSession() {
  try {
    const raw = sessionStorage.getItem('gdl_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useBackup(data) {
  const [backups,       setBackups]       = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup,    setLastBackup]    = useState(null);

  // Load backup history
  const loadBackups = useCallback(async () => {
    const { data: rows } = await supabase
      .from('gd_backups')
      .select('id, created_at, created_by, label, size_bytes')
      .order('created_at', { ascending: false })
      .limit(MAX_STORED_BACKUPS);
    if (rows) setBackups(rows);
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  // Create a backup
  const createBackup = useCallback(async (label) => {
    if (!data) return { ok: false, error: 'No data to back up.' };
    setBackupLoading(true);
    try {
      const session = getSession();
      const payload = JSON.stringify(data);
      const id      = genId();
      const finalLabel = label || `Backup ${new Date().toLocaleDateString('en-AU', {
        timeZone:'Australia/Melbourne', day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      })}`;

      const { error } = await supabase.from('gd_backups').insert({
        id,
        label: finalLabel,
        created_by: session?.displayName ?? 'System',
        size_bytes: payload.length,
        data: data,
      });

      if (error) throw error;

      // Prune old backups beyond MAX_STORED_BACKUPS
      const { data: old } = await supabase
        .from('gd_backups')
        .select('id, created_at')
        .order('created_at', { ascending: true });
      if (old && old.length > MAX_STORED_BACKUPS) {
        const toDelete = old.slice(0, old.length - MAX_STORED_BACKUPS);
        for (const b of toDelete) {
          await supabase.from('gd_backups').delete().eq('id', b.id);
        }
      }

      sessionStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
      setLastBackup(new Date());
      await loadBackups();
      return { ok: true, label: finalLabel };
    } catch (e) {
      console.error('Backup failed:', e);
      return { ok: false, error: e.message };
    } finally {
      setBackupLoading(false);
    }
  }, [data, loadBackups]);

  // Download a specific backup as JSON
  const downloadBackup = useCallback(async (backupId) => {
    const { data: row } = await supabase
      .from('gd_backups')
      .select('*')
      .eq('id', backupId)
      .single();
    if (!row) return;
    const blob = new Blob([JSON.stringify(row.data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${row.label.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Auto-backup: run once per day if data is loaded
  useEffect(() => {
    if (!data?.officers?.length) return;
    const lastTs  = parseInt(sessionStorage.getItem(LAST_BACKUP_KEY) || '0', 10);
    const elapsed = Date.now() - lastTs;
    if (elapsed < BACKUP_INTERVAL_MS) return;

    // Run after a short delay so the app finishes loading first
    const timer = setTimeout(() => {
      createBackup('Auto backup');
    }, 10_000);

    return () => clearTimeout(timer);
  }, [data?.officers?.length]); // only re-evaluate when officer count changes

  return { backups, backupLoading, lastBackup, createBackup, downloadBackup, loadBackups };
}
