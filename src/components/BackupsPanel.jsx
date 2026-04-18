// src/components/BackupsPanel.jsx
import { useState } from 'react';
import { T, Btn } from './ui.jsx';

export function BackupsPanel({ backup, data }) {
  const { backups, backupLoading, lastBackup, createBackup, downloadBackup } = backup;
  const [label,   setLabel]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const flash = (m, isErr = false) => {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setErr(''); setMsg(''); }, 4000);
  };

  const handleCreate = async () => {
    const result = await createBackup(label.trim() || undefined);
    if (result.ok) { flash(`Backup created: "${result.label}"`); setLabel(''); }
    else flash(result.error, true);
  };

  const officerCount = data?.officers?.length ?? 0;

  return (
    <div style={{ padding: '10px 14px', overflowY: 'auto', maxHeight: 'calc(100vh - 102px)' }}>

      <div style={{ fontSize: 13, color: T.hint, marginBottom: 16 }}>
        Backups · {backups.length} stored · Auto-backup runs daily
        {lastBackup && ` · Last: ${lastBackup.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}`}
      </div>

      {msg && <div style={{ background:'#14532d', border:'1px solid #166534', borderRadius:5,
        padding:'7px 12px', fontSize:12, color:'#bbf7d0', marginBottom:10 }}>{msg}</div>}
      {err && <div style={{ background:'#7f1d1d', border:'1px solid #991b1b', borderRadius:5,
        padding:'7px 12px', fontSize:12, color:'#fca5a5', marginBottom:10 }}>{err}</div>}

      {/* Manual backup */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.hint, marginBottom: 10,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>Create Manual Backup</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional — e.g. Before restructure)"
            style={{ background:'#060d1a', border:`1px solid ${T.border}`, borderRadius:4,
              color:T.text, padding:'6px 10px', fontSize:12, flex:1, outline:'none' }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}/>
          <Btn size="sm" onClick={handleCreate} disabled={backupLoading || !officerCount}>
            {backupLoading ? 'Backing up…' : '⬆ Backup Now'}
          </Btn>
        </div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>
          Snapshot includes all {officerCount} officers, certs, transfers, terminations, PORT trials, PORT callsigns, and FTO records.
          The last {30} backups are kept.
        </div>
      </div>

      {/* Backup history */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
        letterSpacing: '0.06em', marginBottom: 8 }}>Backup History</div>

      {backups.length === 0 && (
        <div style={{ color: T.muted, textAlign: 'center', padding: 24, fontSize: 13 }}>
          No backups yet. The first auto-backup will run shortly.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {backups.map((b, i) => (
          <div key={b.id} style={{ background: '#090f1c', border: `1px solid ${T.border}`,
            borderRadius: 6, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: T.text, fontWeight: 600, fontSize: 12, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                {i === 0 && (
                  <span style={{ background: '#14532d', color: '#bbf7d0', borderRadius: 3,
                    padding: '1px 5px', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>LATEST</span>
                )}
              </div>
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>
                {new Date(b.created_at).toLocaleString('en-AU', {
                  timeZone: 'Australia/Melbourne', day: '2-digit', month: 'short',
                  year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {b.created_by && ` · ${b.created_by}`}
                {b.size_bytes > 0 && ` · ${Math.round(b.size_bytes / 1024)}KB`}
              </div>
            </div>
            <button onClick={() => downloadBackup(b.id)}
              style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4,
                color: T.hint, fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                flexShrink: 0 }}>
              ⬇ Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
