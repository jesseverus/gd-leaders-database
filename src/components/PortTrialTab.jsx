// src/components/PortTrialTab.jsx
import { useState, useMemo } from 'react';
import { T, Btn, FRow, FINP, BASE_INP } from './ui.jsx';
import { TIER_ROW, melbToday, addDays, fmtShort, genId, daysUntil } from '../lib/utils.js';

// Props: portTrials, onUpsert(t), onRemove(id), search

export function PortTrialTab({portTrials,onUpsert,onRemove,search}){
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({name:'',rank:'First Constable'});
  const [active,   setActive]   = useState(null);

  const isA   = (id,f) => active?.id===id && active?.f===f;
  const act   = (id,f) => setActive({id,f});
  const deact = ()     => setActive(null);

  const addTrial = () => {
    if(!form.name.trim()) return;
    const today = melbToday();
    onUpsert({id:genId(),name:form.name.trim(),rank:form.rank.trim(),
      startDate:today,endDate:addDays(today,14),outcome:'In Progress',notes:''});
    setForm({name:'',rank:'First Constable'});
    setShowAdd(false);
  };
  const del  = id => { if(window.confirm('Remove trial?')) onRemove(id); };
  const updT = (id,f,v) => { const t=portTrials.find(x=>x.id===id); if(t) onUpsert({...t,[f]:v}); };

  const sq = search.toLowerCase();
  const OCOL = {'Finished':'#22c55e',"Didn't Finish":'#ef4444','In Progress':'#fbbf24'};

  const { activeTrials, byYear, years } = useMemo(() => {
    const filtered = [...portTrials]
      .filter(t => !sq || [t.name,t.rank].some(v=>(v||'').toLowerCase().includes(sq)));

    const activeTrials = filtered
      .filter(t => t.outcome==='In Progress')
      .sort((a,b) => a.startDate > b.startDate ? 1 : -1);

    const completed = filtered
      .filter(t => t.outcome!=='In Progress')
      .sort((a,b) => a.startDate > b.startDate ? -1 : 1);

    const byYear = {};
    completed.forEach(t => {
      const y = t.startDate ? t.startDate.slice(0,4) : 'Unknown';
      if(!byYear[y]) byYear[y]=[];
      byYear[y].push(t);
    });
    const years = Object.keys(byYear).sort((a,b) => Number(b)-Number(a));
    return { activeTrials, byYear, years };
  }, [portTrials, sq]);

  // All completed-year groups collapsed by default — only Active Trials section is always visible
  const [collapsed, setCollapsed] = useState({});
  const isCollapsed = year => year in collapsed ? collapsed[year] : true;
  const toggleYear  = year => setCollapsed(p => ({...p, [year]: !isCollapsed(year)}));

  const TrialRow = ({t, index, showIndex=true}) => {
    const oc      = t.outcome||'In Progress';
    const ocCol   = OCOL[oc]||T.muted;
    const dLeft   = daysUntil(t.endDate);
    const expired = dLeft!==null && dLeft<0;
    return (
      <div style={{
        background: expired&&oc==='In Progress' ? TIER_ROW.bronze.even : TIER_ROW.silver.even,
        border:`1px solid ${expired&&oc==='In Progress' ? T.danger : T.border}`,
        borderRadius:7,padding:'9px 16px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>

        {showIndex && (
          <div style={{width:24,height:24,background:T.borderMid,borderRadius:'50%',display:'flex',
            alignItems:'center',justifyContent:'center',color:T.hint,fontSize:10,fontWeight:700,flexShrink:0}}>
            {index}
          </div>
        )}

        <div style={{flex:'0 0 200px'}}>
          {isA(t.id,'name')
            ? <input autoFocus value={t.name} onChange={e=>updT(t.id,'name',e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:13}}/>
            : <div onClick={()=>act(t.id,'name')} style={{cursor:'pointer',color:T.text,fontWeight:700,fontSize:13}}>{t.name}</div>}
          {isA(t.id,'rank')
            ? <input autoFocus value={t.rank} onChange={e=>updT(t.id,'rank',e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:11}}/>
            : <div onClick={()=>act(t.id,'rank')} style={{cursor:'pointer',color:T.hint,fontSize:11}}>{t.rank||'—'}</div>}
        </div>

        <div style={{flex:'0 0 80px',fontSize:12}}>
          <div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:'uppercase'}}>Start</div>
          <div style={{color:T.text}}>{fmtShort(t.startDate)}</div>
        </div>
        <div style={{flex:'0 0 80px',fontSize:12}}>
          <div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:'uppercase'}}>End</div>
          <div style={{color:expired&&oc==='In Progress'?'#ef4444':T.text}}>{fmtShort(t.endDate)}</div>
        </div>

        {oc==='In Progress' && dLeft!==null && (
          <div style={{flex:'0 0 70px',fontSize:12}}>
            <div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:'uppercase'}}>Days left</div>
            <div style={{color:expired?'#ef4444':dLeft<=3?'#fbbf24':'#22c55e',fontWeight:700}}>{expired?`${Math.abs(dLeft)}d over`:`${dLeft}d`}</div>
          </div>
        )}

        <div style={{flex:'0 0 110px'}}>
          <select value={oc} onChange={e=>updT(t.id,'outcome',e.target.value)}
            style={{...BASE_INP,padding:'2px 4px',fontSize:11,color:ocCol,fontWeight:700}}>
            {['Finished',"Didn't Finish",'In Progress'].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>

        <div style={{flex:'1 1 160px',fontSize:12}}>
          {isA(t.id,'notes')
            ? <input autoFocus value={t.notes||''} onChange={e=>updT(t.id,'notes',e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:12}}/>
            : <div onClick={()=>act(t.id,'notes')} style={{cursor:'pointer',color:t.notes?T.text:T.muted,fontSize:12}}>{t.notes||'Notes…'}</div>}
        </div>

        <button onClick={()=>del(t.id)} style={{background:'none',border:'none',cursor:'pointer',
          color:T.muted,fontSize:14,lineHeight:1,marginLeft:'auto'}}
          onMouseEnter={e=>e.target.style.color=T.danger}
          onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
      </div>
    );
  };

  return (
    <div style={{padding:'10px 14px',overflowY:'auto',maxHeight:'calc(100vh - 102px)'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:13,color:T.hint}}>
          PORT Trial Period · {portTrials.length} total · {activeTrials.length} active
        </div>
        <Btn size="sm" variant="success" onClick={()=>setShowAdd(p=>!p)}>+ Add Trial</Btn>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <FRow label="Officer Name">
              <input style={FINP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name" autoFocus/>
            </FRow>
            <FRow label="GD Rank">
              <input style={FINP} value={form.rank} onChange={e=>setForm(p=>({...p,rank:e.target.value}))} placeholder="First Constable"/>
            </FRow>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn size="sm" variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={addTrial}>Add</Btn>
          </div>
        </div>
      )}

      {portTrials.length===0 && (
        <div style={{color:T.muted,textAlign:'center',padding:32,fontSize:13}}>No trials.</div>
      )}

      {/* ── ACTIVE TRIALS ── always shown, never collapsible */}
      {activeTrials.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'7px 14px',
            background:'#1c0f00',border:`1px solid #92400e`,borderRadius:6,marginBottom:6}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#fbbf24',flexShrink:0,
              boxShadow:'0 0 6px #fbbf24'}}/>
            <span style={{color:'#fef3c7',fontSize:13,fontWeight:700}}>Active Trials</span>
            <span style={{background:'#92400e',color:'#fef3c7',borderRadius:10,padding:'1px 8px',fontSize:10,fontWeight:700}}>
              {activeTrials.length}
            </span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {activeTrials.map((t,i) => <TrialRow key={t.id} t={t} index={i+1}/>)}
          </div>
        </div>
      )}

      {/* ── COMPLETED — grouped by year ── */}
      {years.length > 0 && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,paddingTop:activeTrials.length>0?8:0,
            borderTop:activeTrials.length>0?`1px solid ${T.border}`:'none'}}>
            <span style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>Completed trials</span>
          </div>
          {years.map(year => {
            const entries  = byYear[year];
            const closed   = isCollapsed(year);
            const finished = entries.filter(t=>t.outcome==='Finished').length;
            const failed   = entries.filter(t=>t.outcome==="Didn't Finish").length;
            return (
              <div key={year} style={{marginBottom:8}}>
                <div onClick={()=>toggleYear(year)} style={{display:'flex',alignItems:'center',gap:10,
                  background:'#0d1729',borderRadius:6,padding:'7px 14px',cursor:'pointer',
                  border:`1px solid ${T.border}`,userSelect:'none',marginBottom:closed?0:5}}>
                  <span style={{color:T.accent,fontSize:11,minWidth:10}}>{closed?'▶':'▼'}</span>
                  <span style={{color:T.text,fontSize:13,fontWeight:700}}>{year}</span>
                  <span style={{color:T.muted,fontSize:11}}>{entries.length} trial{entries.length!==1?'s':''}</span>
                  {finished>0 && <span style={{color:'#22c55e',fontSize:10}}>{finished} finished</span>}
                  {failed>0   && <span style={{color:'#ef4444',fontSize:10}}>{failed} didn't finish</span>}
                </div>
                {!closed && (
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {entries.map((t,i) => <TrialRow key={t.id} t={t} index={entries.length-i} showIndex={true}/>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
