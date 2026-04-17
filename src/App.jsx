// src/App.jsx
// GD Leaders Database — Supabase-backed React app.
// All state is persisted to Supabase in real time via useDb().

import { useState, useRef, useMemo, useCallback } from 'react';
import { useDb } from './hooks/useDb.js';
import { GDTable }          from './components/GDTable.jsx';
import { TransfersTab }     from './components/TransfersTab.jsx';
import { TerminationsTab }  from './components/TerminationsTab.jsx';
import { PortTrialTab }     from './components/PortTrialTab.jsx';
import { PortCallsignsTab } from './components/PortCallsignsTab.jsx';
import { FTOTab }           from './components/FTOTab.jsx';
import { LoginScreen }      from './components/LoginScreen.jsx';
import { AddOfficerModal }  from './components/modals/AddOfficerModal.jsx';
import { AddCertModal }     from './components/modals/AddCertModal.jsx';
import { Btn }              from './components/ui.jsx';
import { melbToday, genId } from './lib/utils.js';

const AUTH_PW  = import.meta.env.VITE_APP_PASSWORD ?? 'burnbook';
const APP_NAME = 'GD Leaders Database';
const SESSION_KEY = 'gdl_authed';

const TABS = [
  { short: 'GD'          },
  { short: 'Transfers'   },
  { short: 'Terminations'},
  { short: 'PORT Trials' },
  { short: 'PORT CS'     },
  { short: 'FTO DB'      },
];

export default function App() {
  const [loggedIn,  setLoggedIn]  = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [tab,       setTab]       = useState(0);
  const [search,    setSearch]    = useState('');
  const [showAddO,  setShowAddO]  = useState(false);
  const [showAddC,  setShowAddC]  = useState(false);
  const [archiveModal, setArchiveModal] = useState(null); // { ftoRecord } | null
  const [archiveReason, setArchiveReason] = useState('');
  const importRef = useRef(null);

  const [officers,      {upsert: upsertO, upsertMany: upsertManyO, remove: removeO},           oR] = useDb('officers');
  const [certs,         {upsert: upsertC, upsertMany: upsertManyC, remove: removeC},           cR] = useDb('certs');
  const [transfers,     {upsert: upsertT, remove: removeT},                                    tR] = useDb('transfers');
  const [terminations,  {upsert: upsertTm, remove: removeTm},                                  tmR]= useDb('terminations');
  const [portTrials,    {upsert: upsertPT, remove: removePT},                                  ptR]= useDb('portTrials');
  const [portCS,        {upsert: upsertCS, remove: removeCS},                                  pcR]= useDb('portCallsigns');
  const [ftoOfficers,   {upsert: upsertFTO, remove: removeFTO},                                foR]= useDb('ftoOfficers');

  const ready = oR && cR && tR && tmR && ptR && pcR && foR;

  // Sort certs by order
  const sortedCerts = useMemo(() => [...certs].sort((a, b) => (a.order || 0) - (b.order || 0)), [certs]);

  // ─── FTO SYNC ────────────────────────────────────────────────────────────────
  // Any certValues.fto value other than N or empty means the officer has an FTO cert
  const FTO_ACTIVE = new Set(['Y','TL','2IC','TO','SFTO','FPO','TP','OPs']);

  const ftoLevelFromCert = (val) => {
    if (val === 'TL' || val === '2IC') return 'FTO Leader';
    if (val === 'SFTO')               return 'Senior FTO';
    return 'FTO';
  };

  // Archive an active FTO record to "Previous FTO" — opens modal to collect reason
  const archiveFTO = useCallback((existingFTO) => {
    setArchiveReason('');
    setArchiveModal(existingFTO);
  }, []);

  // Called when user confirms the archive modal
  const confirmArchive = useCallback(() => {
    if (!archiveModal) return;
    upsertFTO({
      ...archiveModal,
      isPrevious:  'Y',
      removedDate: melbToday(),
      notes: archiveReason.trim(),
    });
    setArchiveModal(null);
    setArchiveReason('');
  }, [archiveModal, archiveReason, upsertFTO]);

  // Check for a previous FTO record and ask before overwriting
  const checkAndAddFTO = useCallback((newRecord) => {
    const prevRecord = ftoOfficers.find(f =>
      f.isPrevious === 'Y' &&
      (f.gdOfficerId === newRecord.gdOfficerId || f.fullName === newRecord.fullName)
    );
    if (prevRecord) {
      if (!window.confirm(
        `"${newRecord.fullName}" has a Previous FTO record (removed ${prevRecord.removedDate || 'previously'}).\n\nOverwrite and restore as active FTO?`
      )) return;
      // Overwrite the previous record in-place (keep same id, restore fields)
      upsertFTO({ ...prevRecord, ...newRecord, id: prevRecord.id, isPrevious: 'N', removedDate: '' });
    } else {
      upsertFTO(newRecord);
    }
  }, [upsertFTO, ftoOfficers]);

  // Wrapped officer upsert — syncs FTO cert grants/removals and rank changes into FTO DB
  const handleUpsertOfficer = useCallback((updated) => {
    upsertO(updated);
    const prev        = officers.find(o => o.id === updated.id);
    const prevFtoCert = prev?.certValues?.fto ?? '';
    const newFtoCert  = updated.certValues?.fto ?? '';
    const hadFTO      = FTO_ACTIVE.has(prevFtoCert);
    const hasFTO      = FTO_ACTIVE.has(newFtoCert);
    const prevName    = prev?.fullName ?? updated.fullName;

    // Match active record by officer ID first, then name
    const existingFTO = ftoOfficers.find(f => f.isPrevious !== 'Y' && f.gdOfficerId === updated.id)
                     ?? ftoOfficers.find(f => f.isPrevious !== 'Y' && f.fullName === prevName);

    if (hasFTO && !existingFTO) {
      // FTO cert granted — check for previous record first
      checkAndAddFTO({
        id: genId(), gdOfficerId: updated.id,
        fullName: updated.fullName, rank: updated.rank,
        division: updated.rank === 'Special Constable' ? 'Special' : 'GD',
        ftoLevel: ftoLevelFromCert(newFtoCert),
        isFTO: 'Y',
        isSFTO: (newFtoCert === 'SFTO' || newFtoCert === 'TL' || newFtoCert === '2IC') ? 'Y' : 'N',
        isAcademyTrainer: 'N', isInductionHost: 'N', isSupervisor: 'N', isLeader: 'N',
        isPrevious: 'N', removedDate: '', notes: '',
      });
    } else if (!hasFTO && hadFTO && existingFTO) {
      // FTO cert removed — archive rather than delete
      archiveFTO(existingFTO);
    } else if (hasFTO && existingFTO) {
      // Already in FTO DB — sync name, rank and/or level if anything changed
      const nameChanged  = existingFTO.fullName !== updated.fullName;
      const rankChanged  = existingFTO.rank     !== updated.rank;
      const certChanged  = newFtoCert !== prevFtoCert;
      const levelChanged = certChanged && ftoLevelFromCert(newFtoCert) !== existingFTO.ftoLevel;
      if (nameChanged || rankChanged || levelChanged) {
        upsertFTO({
          ...existingFTO,
          gdOfficerId: updated.id,
          fullName: updated.fullName,
          rank:     updated.rank,
          ftoLevel: levelChanged ? ftoLevelFromCert(newFtoCert) : existingFTO.ftoLevel,
        });
      }
    }
  }, [upsertO, upsertFTO, officers, ftoOfficers, archiveFTO, checkAndAddFTO]);

  // Wrapped officer remove — archives FTO record instead of deleting
  const handleRemoveOfficer = useCallback((id) => {
    const o = officers.find(x => x.id === id);
    removeO(id);
    if (o) {
      const existingFTO = ftoOfficers.find(f => f.isPrevious !== 'Y' && f.gdOfficerId === id)
                       ?? ftoOfficers.find(f => f.isPrevious !== 'Y' && f.fullName === o.fullName);
      if (existingFTO) archiveFTO(existingFTO);
    }
  }, [removeO, officers, ftoOfficers, archiveFTO]);

  // Terminate an officer — adds termination record, removes from GD, FTO DB, and PORT CS
  const handleTerminate = useCallback((o, type, reason) => {
    const now = melbToday();
    const year = new Date().getFullYear().toString();
    // Add termination record
    upsertTm({
      id: genId(), steamName: o.steamName, fullName: o.fullName,
      callsign: o.callsign, rank: o.rank,
      type, reason, termDate: now, year,
    });
    // Remove from GD (triggers FTO removal via handleRemoveOfficer)
    handleRemoveOfficer(o.id);
    // Clear any PORT callsign assignment
    portCS.forEach(s => {
      if (s.officer && s.officer.trim().toLowerCase() === (o.fullName||'').trim().toLowerCase()) {
        upsertCS({...s, officer:''});
      }
    });
  }, [upsertTm, handleRemoveOfficer, portCS, upsertCS]);

  // Transfer an officer from GD tab (adds transfer record, optionally removes from GD)
  const handleTransfer = useCallback((o) => {
    const reason = window.prompt(`Moving "${o.fullName || o.steamName}" — enter destination/reason (cancel to abort):`);
    if (reason === null) return;
    const div = (window.prompt('Division transferred to (CIRT / HWY / blank):') ?? '').trim().toUpperCase();
    upsertT({
      id: genId(), steamName: o.steamName, fullName: o.fullName,
      callsign: o.callsign, rank: o.rank, promoDate: o.lastPromotionDate,
      division: div, notes: reason.trim(),
      year: new Date().getFullYear().toString(),
    });
    if (window.confirm(`Also remove "${o.fullName || o.steamName}" from GD Database?`)) {
      removeO(o.id);
    }
  }, [upsertT, removeO]);

  // JSON export — full backup of all tables
  const handleExport = useCallback(() => {
    const data = { officers, certs, transfers, terminations, portTrials, portCS, ftoOfficers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `gd-leaders-backup-${melbToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [officers, certs, transfers, terminations, portTrials, portCS, ftoOfficers]);

  // JSON import — restores a full backup
  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!d.officers || !d.certs) { alert('Invalid backup file.'); return; }
        if (!window.confirm(`Import backup with ${d.officers.length} officers? This replaces ALL current data.`)) return;
        await upsertManyO(d.officers);
        await upsertManyC(d.certs);
        if (d.transfers)    for (const t  of d.transfers)    await upsertT(t);
        if (d.terminations) for (const t  of d.terminations) await upsertTm(t);
        if (d.portTrials)   for (const t  of d.portTrials)   await upsertPT(t);
        if (d.portCS)       for (const s  of d.portCS)       await upsertCS(s);
        if (d.ftoOfficers)  for (const fo of d.ftoOfficers)  await upsertFTO(fo);
      } catch { alert('Failed to parse backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [upsertManyO, upsertManyC, upsertT, upsertTm, upsertPT, upsertCS, upsertFTO]);

  // Search badge counts
  const sq = search.toLowerCase();
  const tabCounts = useMemo(() => {
    if (!sq) return {};
    return {
      0: officers.filter(o  => [o.steamName,o.fullName,o.callsign].some(v=>(v||'').toLowerCase().includes(sq))).length,
      1: transfers.filter(t => [t.fullName,t.steamName,t.division,t.rank].some(v=>(v||'').toLowerCase().includes(sq))).length,
      2: terminations.filter(t=> [t.fullName,t.steamName,t.rank,t.reason].some(v=>(v||'').toLowerCase().includes(sq))).length,
      3: portTrials.filter(t => [t.name,t.rank].some(v=>(v||'').toLowerCase().includes(sq))).length,
      4: portCS.filter(s => (s.officer||'').toLowerCase().includes(sq)).length,
      5: ftoOfficers.filter(o=> [o.fullName,o.rank,o.division].some(v=>(v||'').toLowerCase().includes(sq))).length,
    };
  }, [sq, officers, transfers, terminations, portTrials, portCS, ftoOfficers]);

  const olCount  = officers.filter(o => o.onLeave === 'TRUE').length;
  const hwCount  = officers.filter(o => o.hoursWarning && o.hoursWarning !== 'No' && o.hoursWarning !== '').length;

  const T = {
    bg:'#07090f',nav:'#0b0f1a',card:'#0f1525',border:'#17243a',borderMid:'#1e3050',
    accent:'#3b82f6',text:'#d8e4f0',muted:'#3d526e',hint:'#5a7a9a',
  };

  if (!loggedIn) return <LoginScreen onLogin={() => { sessionStorage.setItem(SESSION_KEY,'1'); setLoggedIn(true); }} authPw={AUTH_PW} appName={APP_NAME}/>;
  if (!ready)    return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',color:T.hint,fontSize:14}}>
      Connecting to database…
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:'system-ui,-apple-system,sans-serif',color:T.text,display:'flex',flexDirection:'column'}}>

      {/* ── HEADER ── */}
      <div style={{position:'sticky',top:0,zIndex:500,background:T.nav,borderBottom:`1px solid ${T.border}`}}>

        {/* Row 1: logo · search · summary · logout */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 14px',flexWrap:'wrap',minHeight:44,borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{width:28,height:28,background:'#1e3a8a',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:12,letterSpacing:'0.06em',color:T.text,lineHeight:1}}>{APP_NAME}</div>
              <div style={{fontSize:8,color:T.muted,letterSpacing:'0.1em'}}>SUPABASE · v5.2</div>
            </div>
          </div>

          <div style={{position:'relative',flex:'1 1 160px',maxWidth:280,minWidth:130}}>
            <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:T.muted,fontSize:12,pointerEvents:'none'}}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all tabs…"
              style={{background:'#060d1a',border:`1px solid ${T.border}`,borderRadius:5,color:T.text,padding:'5px 10px 5px 26px',fontSize:12,width:'100%',outline:'none'}}/>
            {search && <button onClick={() => setSearch('')}
              style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:T.muted,cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>}
          </div>

          <div style={{flexShrink:0,fontSize:11,color:T.hint,background:'#060a14',border:`1px solid ${T.border}`,borderRadius:4,padding:'3px 9px',display:'flex',gap:8,whiteSpace:'nowrap'}}>
            <span>Officers: <strong style={{color:T.text}}>{officers.length}</strong></span>
            <span style={{color:T.borderMid}}>|</span>
            <span>Leave: <strong style={{color:'#fbbf24'}}>{olCount}</strong></span>
            <span style={{color:T.borderMid}}>|</span>
            <span>HW: <strong style={{color:'#fb923c'}}>{hwCount}</strong></span>
            <span style={{color:T.borderMid}}>|</span>
            <span>FTO: <strong style={{color:'#a78bfa'}}>{ftoOfficers.length}</strong></span>
          </div>
          <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setLoggedIn(false); }}
            style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:11,marginLeft:'auto',flexShrink:0}}>
            Logout
          </button>
        </div>

        {/* Row 2: tabs · action buttons */}
        <div style={{display:'flex',alignItems:'center',padding:'0 14px',overflowX:'auto',minHeight:40}}>
          {TABS.map((tb, i) => {
            const cnt = tabCounts[i] || 0;
            const isActive = tab === i;
            return (
              <button key={i} onClick={() => setTab(i)}
                style={{background:'none',border:'none',borderBottom:`2px solid ${isActive ? T.accent : 'transparent'}`,
                  cursor:'pointer',padding:'0 12px',height:40,fontSize:11,fontWeight:600,
                  color:isActive ? T.accent : T.hint,display:'flex',alignItems:'center',gap:5,flexShrink:0,whiteSpace:'nowrap'}}>
                {tb.short}
                {cnt > 0 && <span style={{background:T.accent,color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:9,fontWeight:700,minWidth:16,textAlign:'center'}}>{cnt}</span>}
              </button>
            );
          })}
          <div style={{marginLeft:'auto',display:'flex',gap:5,alignItems:'center',paddingLeft:12,flexShrink:0}}>
            {tab === 0 && <>
              <Btn size="sm" variant="success" style={{minWidth:76}} onClick={() => setShowAddO(true)}>+ Officer</Btn>
              <Btn size="sm" variant="ghost"   style={{minWidth:60}} onClick={() => setShowAddC(true)}>+ Cert</Btn>
            </>}
            <Btn size="sm" variant="ghost" style={{minWidth:68}} onClick={handleExport}>⬇ Export</Btn>
            <Btn size="sm" variant="ghost" style={{minWidth:68}} onClick={() => importRef.current?.click()}>⬆ Import</Btn>
            <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport}/>
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{flex:1,overflow:'hidden'}}>
        {tab === 0 && <GDTable officers={officers} certs={sortedCerts}
          onUpsertOfficer={handleUpsertOfficer} onRemoveOfficer={handleRemoveOfficer}
          onUpsertCert={upsertC} onRemoveCert={removeC}
          search={search} onTransfer={handleTransfer} onTerminate={handleTerminate}/>}
        {tab === 1 && <TransfersTab transfers={transfers} onUpsert={upsertT} onRemove={removeT} search={search}/>}
        {tab === 2 && <TerminationsTab terminations={terminations} onUpsert={upsertTm} onRemove={removeTm} search={search}/>}
        {tab === 3 && <PortTrialTab portTrials={portTrials} onUpsert={upsertPT} onRemove={removePT} search={search}/>}
        {tab === 4 && <PortCallsignsTab portCS={portCS} onUpsert={upsertCS} onRemove={removeCS} search={search}/>}
        {tab === 5 && <FTOTab ftoOfficers={ftoOfficers} onUpsert={upsertFTO}
          onRemove={id=>{const f=ftoOfficers.find(x=>x.id===id);if(f&&f.isPrevious!=='Y')archiveFTO(f);else removeFTO(id);}}
          onCheckAndAdd={checkAndAddFTO}
          search={search}/>}
      </div>

      {showAddO && <AddOfficerModal certs={sortedCerts}
        onClose={() => setShowAddO(false)}
        onAdd={o => { handleUpsertOfficer(o); setShowAddO(false); }}/>}
      {showAddC && <AddCertModal
        onClose={() => setShowAddC(false)}
        onAdd={c => { const mo = Math.max(...certs.map(x => x.order || 0), 0); upsertC({...c, order: mo+1}); setShowAddC(false); }}/>}

      {archiveModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:10000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={()=>setArchiveModal(null)}>
          <div style={{background:'#0f1a2e',border:'1px solid #1e3050',borderRadius:10,
            width:'100%',maxWidth:420,overflow:'hidden'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #17243a',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{color:'#d8e4f0',fontWeight:700,fontSize:14}}>Move to Previous FTO</div>
                <div style={{color:'#5a7a9a',fontSize:11}}>{archiveModal.fullName} &middot; {archiveModal.rank}</div>
              </div>
              <button onClick={()=>setArchiveModal(null)}
                style={{background:'none',border:'none',color:'#3d526e',fontSize:20,cursor:'pointer',lineHeight:1}}>x</button>
            </div>
            <div style={{padding:16}}>
              <div style={{fontSize:11,color:'#5a7a9a',marginBottom:12,lineHeight:1.6}}>
                This officer will be moved to <strong style={{color:'#d8e4f0'}}>Previous FTO</strong>. Their record will be kept for reference.
              </div>
              <label style={{display:'block',color:'#5a7a9a',fontSize:10,fontWeight:700,
                textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>Reason (optional)</label>
              <textarea value={archiveReason} onChange={e=>setArchiveReason(e.target.value)}
                autoFocus rows={3}
                placeholder='e.g. Left the division, cert expired, rank change...'
                style={{width:'100%',background:'#060d1a',border:'1px solid #1e3050',
                  borderRadius:4,color:'#d8e4f0',padding:'6px 8px',fontSize:12,
                  resize:'vertical',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                <button onClick={()=>setArchiveModal(null)}
                  style={{background:'none',border:'1px solid #17243a',borderRadius:5,
                    color:'#5a7a9a',fontSize:11,padding:'6px 14px',cursor:'pointer'}}>Cancel</button>
                <button onClick={confirmArchive}
                  style={{background:'#374151',border:'none',borderRadius:5,
                    color:'#d1d5db',fontSize:11,padding:'6px 16px',cursor:'pointer',fontWeight:700}}>Move to Previous FTO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
