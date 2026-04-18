// src/components/TransfersTab.jsx
import { useState } from 'react';
import { T, RankBadge, Btn, BASE_INP } from './ui.jsx';
import { TIER_ROW, fmtShort } from '../lib/utils.js';

// Props: transfers, onUpsert(t), onRemove(id), search

export function TransfersTab({transfers,onUpsert,onRemove,search}){
const[collapsed,setCollapsed]=useState({});const[active,setActive]=useState(null);
const isCollapsed=year=>year in collapsed?collapsed[year]:true;
const toggleYear=year=>setCollapsed(p=>({...p,[year]:!isCollapsed(year)}));
const isA=(id,f)=>active?.id===id&&active?.f===f;const act=(id,f)=>setActive({id,f});const deact=()=>setActive(null);
const sq=search.toLowerCase();
const filtered=transfers.filter(t=>!sq||[t.fullName,t.steamName,t.rank,t.division].some(v=>(v||"").toLowerCase().includes(sq)));
const byYear={};
filtered.forEach(t=>{
  // Derive year from the actual transfer date (promoDate) if available,
  // fall back to the stored year field, then Unknown
  const y = t.promoDate ? t.promoDate.slice(0,4) : (t.year||"Unknown");
  if(!byYear[y])byYear[y]=[];
  byYear[y].push(t);
});
const years=Object.keys(byYear).sort((a,b)=>Number(b)-Number(a));
const del=id=>{if(window.confirm("Remove transfer record?"))onRemove(id);};
const updT=(id,f,v)=>{const t=transfers.find(x=>x.id===id);if(t)onUpsert({...t,[f]:v});};
return<div style={{padding:"10px 14px",overflowY:"auto",maxHeight:"calc(100vh - 102px)"}}>
<div style={{fontSize:13,color:T.hint,marginBottom:12}}>Divisional transfers · {transfers.length} total · Grouped by year · Use → on GD tab to add entries</div>
{years.length===0&&<div style={{color:T.muted,textAlign:"center",padding:32,fontSize:13}}>No records.</div>}
{years.map(year=><div key={year} style={{marginBottom:12}}>
<div style={{display:"flex",alignItems:"center",gap:10,background:"#0d1729",borderRadius:6,padding:"6px 14px",cursor:"pointer",border:`1px solid ${T.border}`}} onClick={()=>toggleYear(year)}>
<span style={{color:T.accent,fontSize:12}}>{isCollapsed(year)?"▶":"▼"}</span>
<span style={{color:T.text,fontSize:13,fontWeight:700}}>{year}</span>
<span style={{color:T.muted,fontSize:11,marginLeft:4}}>{byYear[year].length} records</span>
<span style={{color:"#3b82f6",fontSize:10,marginLeft:4}}>{byYear[year].filter(x=>x.division==="CIRT").length} CIRT</span>
<span style={{color:"#f59e0b",fontSize:10,marginLeft:4}}>{byYear[year].filter(x=>x.division==="HWY").length} HWY</span>
</div>
{!isCollapsed(year)&&<div style={{marginTop:4,display:"flex",flexDirection:"column",gap:4}}>
{[...byYear[year]].sort((a,b)=>(a.promoDate||"")>(b.promoDate||"")?-1:1).map(t=>
<div key={t.id} style={{background:TIER_ROW.silver.even,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
<div style={{flex:"0 0 170px"}}>{isA(t.id,"fn")?<input autoFocus defaultValue={t.fullName} onChange={()=>{}} onBlur={e=>{updT(t.id,"fullName",e.target.value);deact();}} style={{...BASE_INP,fontSize:13}}/>:<div onClick={()=>act(t.id,"fn")} style={{cursor:"pointer",color:T.text,fontWeight:700,fontSize:13}}>{t.fullName||t.steamName}</div>}<div style={{color:T.hint,fontSize:11}}>{t.steamName}</div></div>
<div style={{flex:"0 0 160px"}}><RankBadge rank={t.rank} small/></div>
<div style={{flex:"0 0 80px",textAlign:"center"}}><div style={{background:t.division==="CIRT"?"#1e3a8a":t.division==="HWY"?"#78350f":"#374151",color:t.division?"#bfdbfe":"#9ca3af",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,display:"inline-block"}}>{t.division||"—"}</div></div>
<div style={{flex:"0 0 130px",fontSize:12,color:T.hint}}>Transfer date: <span style={{color:T.text}}>{fmtShort(t.promoDate)||"—"}</span></div>
<div style={{flex:"2 1 160px",fontSize:12}}>{isA(t.id,"notes")?<input autoFocus defaultValue={t.notes||""} onChange={()=>{}} onBlur={e=>{updT(t.id,"notes",e.target.value);deact();}} style={{...BASE_INP,fontSize:12}}/>:<div onClick={()=>act(t.id,"notes")} style={{cursor:"pointer",color:t.notes?T.text:T.muted,fontSize:12}}>{t.notes||"Notes…"}</div>}</div>
<button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,lineHeight:1}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div>)}
</div>}
</div>)}
</div>;}

// ─── TAB 3: TERMINATIONS ──────────────────────────────────────────────────────
