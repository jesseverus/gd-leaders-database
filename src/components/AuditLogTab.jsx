// src/components/AuditLogTab.jsx
import { useState, useMemo } from 'react';
import { T, Btn } from './ui.jsx';
import { useAuditEntries } from '../hooks/useAuditLog.js';

const ACTION_COLORS = {
  OFFICER_ADD:      { bg: '#14532d', fg: '#bbf7d0', label: 'Added' },
  OFFICER_REMOVE:   { bg: '#7f1d1d', fg: '#fecaca', label: 'Removed' },
  RANK_CHANGE:      { bg: '#1e3a8a', fg: '#bfdbfe', label: 'Rank' },
  CERT_CHANGE:      { bg: '#4c1d95', fg: '#ede9fe', label: 'Cert' },
  TERMINATE:        { bg: '#7f1d1d', fg: '#fca5a5', label: 'Terminated' },
  RESIGN:           { bg: '#78350f', fg: '#fef3c7', label: 'Resigned' },
  TRANSFER:         { bg: '#1e3a5f', fg: '#93c5fd', label: 'Transfer' },
  FTO_ADD:          { bg: '#14532d', fg: '#bbf7d0', label: 'FTO Add' },
  FTO_REMOVE:       { bg: '#78350f', fg: '#fef3c7', label: 'FTO Remove' },
  FTO_ARCHIVE:      { bg: '#374151', fg: '#d1d5db', label: 'Prev FTO' },
  FTO_REINSTATE:    { bg: '#14532d', fg: '#bbf7d0', label: 'Reinstated' },
  PORT_TRIAL_ADD:   { bg: '#1e3a5f', fg: '#93c5fd', label: 'Trial Add' },
  PORT_TRIAL_END:   { bg: '#374151', fg: '#d1d5db', label: 'Trial End' },
  NAME_CHANGE:      { bg: '#4c1d95', fg: '#ede9fe', label: 'Renamed' },
  USER_LOGIN:       { bg: '#065f46', fg: '#6ee7b7', label: 'Login' },
  USER_LOGOUT:      { bg: '#374151', fg: '#9ca3af', label: 'Logout' },
};

function Badge({ action }) {
  const c = ACTION_COLORS[action] ?? { bg: '#374151', fg: '#d1d5db', label: action };
  return (
    <span style={{ background: c.bg, color: c.fg, borderRadius: 3,
      padding: '1px 7px', fontSize: 9, fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.06em', flexShrink: 0 }}>
      {c.label}
    </span>
  );
}

export function AuditLogTab({ search }) {
  const { entries, loading, reload } = useAuditEntries();
  const [filterTab,    setFilterTab]    = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterUser,   setFilterUser]   = useState('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const sq = search.toLowerCase();

  const tabs  = useMemo(() => ['All', ...new Set(entries.map(e => e.tab).filter(Boolean))].sort(), [entries]);
  const users = useMemo(() => ['All', ...new Set(entries.map(e => e.username).filter(Boolean))].sort(), [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterTab    !== 'All' && e.tab      !== filterTab)    return false;
      if (filterAction !== 'All' && e.action   !== filterAction) return false;
      if (filterUser   !== 'All' && e.username !== filterUser)   return false;
      if (dateFrom && e.ts < dateFrom) return false;
      if (dateTo   && e.ts > dateTo + 'T23:59:59') return false;
      if (sq && ![e.subject, e.detail, e.action, e.tab, e.prev_value, e.new_value, e.username]
        .some(v => (v || '').toLowerCase().includes(sq))) return false;
      return true;
    });
  }, [entries, filterTab, filterAction, filterUser, dateFrom, dateTo, sq]);

  const byDate = useMemo(() => {
    const groups = {};
    filtered.forEach(e => {
      const day = e.ts
        ? new Date(e.ts).toLocaleDateString('en-AU', {
            timeZone: 'Australia/Melbourne', weekday: 'long',
            day: 'numeric', month: 'long', year: 'numeric' })
        : 'Unknown date';
      if (!groups[day]) groups[day] = [];
      groups[day].push(e);
    });
    return groups;
  }, [filtered]);

  const selStyle = { background: '#060d1a', border: `1px solid ${T.border}`, borderRadius: 4,
    color: T.text, fontSize: 11, padding: '3px 8px', cursor: 'pointer' };

  return (
    <div style={{ padding: '10px 14px', overflowY: 'auto', maxHeight: 'calc(100vh - 102px)' }}>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: T.hint, flexShrink: 0 }}>
          Audit Log · {filtered.length} of {entries.length}
        </div>
        <select value={filterTab}    onChange={e=>setFilterTab(e.target.value)}    style={selStyle}>
          {tabs.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={selStyle}>
          <option value="All">All actions</option>
          {Object.keys(ACTION_COLORS).map(a=><option key={a}>{a}</option>)}
        </select>
        <select value={filterUser}   onChange={e=>setFilterUser(e.target.value)}   style={selStyle}>
          {users.map(u=><option key={u}>{u}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
          style={{...selStyle,padding:'2px 6px'}} title="From date"/>
        <input type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}
          style={{...selStyle,padding:'2px 6px'}} title="To date"/>
        <button onClick={reload}
          style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:4,
            color:T.hint, fontSize:11, padding:'3px 10px', cursor:'pointer', marginLeft:'auto' }}>
          ↻ Refresh
        </button>
      </div>

      {loading && <div style={{color:T.muted,textAlign:'center',padding:32,fontSize:13}}>Loading…</div>}
      {!loading && filtered.length===0 && <div style={{color:T.muted,textAlign:'center',padding:32,fontSize:13}}>No entries match.</div>}

      {Object.keys(byDate).map(day => (
        <div key={day} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '4px 0', borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
            {day}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {byDate[day].map(e => (
              <div key={e.id} style={{ background: '#090f1c', border: `1px solid ${T.border}`,
                borderRadius: 6, padding: '7px 12px', display: 'flex', alignItems: 'baseline',
                gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: T.muted, fontSize: 10, flexShrink: 0, minWidth: 44 }}>
                  {new Date(e.ts).toLocaleTimeString('en-AU', {
                    timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge action={e.action} />
                {e.username && (
                  <span style={{ background: '#1e3050', color: '#93c5fd', borderRadius: 3,
                    padding: '1px 5px', fontSize: 9, fontWeight: 600, flexShrink: 0 }}>
                    {e.username}
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text,
                  flexShrink: 0, minWidth: 100 }}>
                  {e.subject || '—'}
                </span>
                <span style={{ fontSize: 12, color: T.hint, flex: 1 }}>{e.detail || '—'}</span>
                {(e.prev_value || e.new_value) && (
                  <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>
                    {e.prev_value && <span style={{ color: '#ef4444' }}>{e.prev_value}</span>}
                    {e.prev_value && e.new_value && <span style={{ color: T.muted }}> → </span>}
                    {e.new_value  && <span style={{ color: '#22c55e' }}>{e.new_value}</span>}
                  </span>
                )}
                <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>{e.tab || ''}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
