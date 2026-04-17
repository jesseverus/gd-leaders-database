// src/components/TerminationsTab.jsx
import { useState } from 'react';
import { T, RankBadge } from './ui.jsx';
import { TIER_ROW, fmtShort } from '../lib/utils.js';

// Props: terminations, onUpsert(t), onRemove(id), search

export function TerminationsTab({terminations,onUpsert,onRemove,search}){
const[collapsed,setCollapsed]=useState({});
const sq=search.toLowerCase();
const filtered=terminations.filter(t=>!sq||[t.fullName,t.steamName,t.rank,t.reason,t.type].some(v=>(v||"").toLowerCase().includes(sq)));
const byYear={};filtered.forEach(t=>{const y=t.year||"Unknown";if(!byYear[y])byYear[y]=[];byYear[y].push(t);});
const years=Object.keys(byYear).sort((a,b)=>Number(b)-Number(a));
const del=id=>{if(window.confirm("Remove record?"))onRemove(id);};
const TYPE_COLORS={"Terminated":"#ef4444","Resigned":"#fbbf24"};
return<div style={{padding:"10px 14px",overflowY:"auto",maxHeight:"calc(100vh - 102px)"}}>
<div style={{fontSize:13,color:T.hint,marginBottom:12}}>GD Terminations &amp; Resignations · {terminations.length} total records · Grouped by year</div>
{years.length===0&&<div style={{color:T.muted,textAlign:"center",padding:32,fontSize:13}}>No records.</div>}
{years.map(year=><div key={year} style={{marginBottom:12}}>
<div style={{display:"flex",alignItems:"center",gap:10,background:"#0d1729",borderRadius:6,padding:"6px 14px",cursor:"pointer",border:`1px solid ${T.border}`}} onClick={()=>setCollapsed(p=>({...p,[year]:!p[year]}))}>
<span style={{color:T.accent,fontSize:12}}>{collapsed[year]?"▶":"▼"}</span>
<span style={{color:T.text,fontSize:13,fontWeight:700}}>{year}</span>
<span style={{color:T.muted,fontSize:11,marginLeft:4}}>{byYear[year].length} records</span>
<span style={{color:"#ef4444",fontSize:10,marginLeft:4}}>{byYear[year].filter(x=>x.type==="Terminated").length} terminated</span>
<span style={{color:"#fbbf24",fontSize:10,marginLeft:4}}>{byYear[year].filter(x=>x.type==="Resigned").length} resigned</span>
</div>
{!collapsed[year]&&<div style={{marginTop:4,display:"flex",flexDirection:"column",gap:3}}>
{[...byYear[year]].sort((a,b)=>(a.termDate||"")>(b.termDate||"")?-1:1).map(t=>
<div key={t.id} style={{background:TIER_ROW.bronze.even,border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
<div style={{flex:"0 0 160px"}}><div style={{color:T.text,fontWeight:700,fontSize:13}}>{t.fullName||t.steamName}</div><div style={{color:T.hint,fontSize:11}}>{t.steamName}</div></div>
<div style={{flex:"0 0 150px"}}><RankBadge rank={t.rank} small/></div>
<div style={{flex:"0 0 90px"}}><span style={{background:TYPE_COLORS[t.type]||T.muted,color:"#fff",borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>{t.type||"—"}</span></div>
<div style={{flex:"0 0 90px",fontSize:12,color:T.hint}}>Date: <span style={{color:T.text}}>{fmtShort(t.termDate)||"—"}</span></div>
<div style={{flex:"2 1 200px",fontSize:12,color:t.reason?T.text:T.muted}}>{t.reason||"—"}</div>
<button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,lineHeight:1}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div>)}
</div>}
</div>)}
</div>;}

// ─── TAB 4: PORT TRIALS ───────────────────────────────────────────────────────
