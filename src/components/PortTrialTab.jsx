// src/components/PortTrialTab.jsx
import { useState } from 'react';
import { T, Btn, FRow, FINP, BASE_INP } from './ui.jsx';
import { TIER_ROW, melbToday, addDays, fmtShort, genId, daysUntil } from '../lib/utils.js';

// Props: portTrials, onUpsert(t), onRemove(id), search

export function PortTrialTab({portTrials,onUpsert,onRemove,search}){
const[showAdd,setShowAdd]=useState(false);const[form,setForm]=useState({name:"",rank:"First Constable"});
const[active,setActive]=useState(null);const isA=(id,f)=>active?.id===id&&active?.f===f;const act=(id,f)=>setActive({id,f});const deact=()=>setActive(null);
const addTrial=()=>{if(!form.name.trim())return;const today=melbToday();onUpsert({id:genId(),name:form.name.trim(),rank:form.rank.trim(),startDate:today,endDate:addDays(today,14),outcome:"In Progress",notes:""});setForm({name:"",rank:"First Constable"});setShowAdd(false);};
const del=id=>{if(window.confirm("Remove trial?"))onRemove(id);};
const updT=(id,f,v)=>{const t=portTrials.find(x=>x.id===id);if(t)onUpsert({...t,[f]:v});};
const sq=search.toLowerCase();
const filtered=[...portTrials].filter(t=>!sq||[t.name,t.rank].some(v=>(v||"").toLowerCase().includes(sq))).sort((a,b)=>a.startDate>b.startDate?1:-1);
const OCOL={"Finished":"#22c55e","Didn't Finish":"#ef4444","In Progress":"#fbbf24"};
return<div style={{padding:"10px 14px",overflowY:"auto",maxHeight:"calc(100vh - 102px)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
<div style={{fontSize:13,color:T.hint}}>PORT Trial Period · {portTrials.length} entries · ordered by start date ↑ · {portTrials.filter(t=>t.outcome==="In Progress").length} in progress</div>
<Btn size="sm" variant="success" onClick={()=>setShowAdd(p=>!p)}>+ Add Trial</Btn></div>
{showAdd&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12}}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
<FRow label="Officer Name"><input style={FINP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name" autoFocus/></FRow>
<FRow label="GD Rank"><input style={FINP} value={form.rank} onChange={e=>setForm(p=>({...p,rank:e.target.value}))} placeholder="First Constable"/></FRow>
</div>
<div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn size="sm" variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn size="sm" onClick={addTrial}>Add</Btn></div>
</div>}
{filtered.length===0&&<div style={{color:T.muted,textAlign:"center",padding:32,fontSize:13}}>No trials match.</div>}
<div style={{display:"flex",flexDirection:"column",gap:5}}>
{filtered.map((t,i)=>{const oc=t.outcome||"In Progress";const ocCol=OCOL[oc]||T.muted;const dLeft=daysUntil(t.endDate);const expired=dLeft!==null&&dLeft<0;
return<div key={t.id} style={{background:expired&&oc==="In Progress"?TIER_ROW.bronze.even:TIER_ROW.silver.even,border:`1px solid ${expired&&oc==="In Progress"?T.danger:T.border}`,borderRadius:7,padding:"9px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
<div style={{width:26,height:26,background:T.borderMid,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:T.hint,fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
<div style={{flex:"0 0 200px"}}>
{isA(t.id,"name")?<input autoFocus value={t.name} onChange={e=>updT(t.id,"name",e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:13}}/>:<div onClick={()=>act(t.id,"name")} style={{cursor:"pointer",color:T.text,fontWeight:700,fontSize:13}}>{t.name}</div>}
{isA(t.id,"rank")?<input autoFocus value={t.rank} onChange={e=>updT(t.id,"rank",e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:11}}/>:<div onClick={()=>act(t.id,"rank")} style={{cursor:"pointer",color:T.hint,fontSize:11}}>{t.rank||"—"}</div>}
</div>
<div style={{flex:"0 0 80px",fontSize:12}}><div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Start</div><div style={{color:T.text}}>{fmtShort(t.startDate)}</div></div>
<div style={{flex:"0 0 80px",fontSize:12}}><div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>End</div><div style={{color:T.text}}>{fmtShort(t.endDate)}</div></div>
<div style={{flex:"0 0 100px"}}><select value={oc} onChange={e=>updT(t.id,"outcome",e.target.value)} style={{...BASE_INP,padding:"2px 4px",fontSize:11,color:ocCol,fontWeight:700}}>{["Finished","Didn't Finish","In Progress"].map(v=><option key={v}>{v}</option>)}</select></div>
<div style={{flex:"1 1 200px",fontSize:12}}>{isA(t.id,"notes")?<input autoFocus value={t.notes||""} onChange={e=>updT(t.id,"notes",e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:12}}/>:<div onClick={()=>act(t.id,"notes")} style={{cursor:"pointer",color:t.notes?T.text:T.muted,fontSize:12}}>{t.notes||"Notes…"}</div>}</div>
<button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,lineHeight:1,marginLeft:"auto"}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div>;})}
</div></div>;}

// ─── TAB 5: PORT CALLSIGNS ────────────────────────────────────────────────────
