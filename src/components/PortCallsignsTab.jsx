// src/components/PortCallsignsTab.jsx
import { useState } from 'react';
import { T, Btn, FRow, FINP, BASE_INP } from './ui.jsx';
import { genId } from '../lib/utils.js';

// Props: portCS, onUpsert(s), onRemove(id), search

export function PortCallsignsTab({portCS,onUpsert,onRemove,search}){
const[adding,setAdding]=useState(null);const[form,setForm]=useState({number:"",officer:""});
const sq=search.toLowerCase();
const groupMap={};portCS.forEach(s=>{if(!groupMap[s.group])groupMap[s.group]=[];groupMap[s.group].push(s);});
const GROUP_ORDER=["Senior Command","Senior Sergeant / Acting Senior Sgt","Sergeant","Leading Senior Constable","Senior Constable / First Constable"];
const groups=GROUP_ORDER.map(g=>({label:g,slots:(groupMap[g]||[]).sort((a,b)=>Number(a.number)-Number(b.number))}));
const allNums=portCS.map(s=>s.number).filter(Boolean);
const dupNums=new Set(allNums.filter((v,i,a)=>a.indexOf(v)!==i));
const updOfficer=(id,val)=>{const s=portCS.find(x=>x.id===id);if(s)onUpsert({...s,officer:val});};
const addSlot=gLabel=>{if(!form.number.trim())return;const num=parseInt(form.number.replace(/\D/g,""));if(isNaN(num)||num>499){alert("Callsign must be ≤499.");return;}onUpsert({id:genId(),group:gLabel,number:String(num),officer:form.officer.trim()});setAdding(null);setForm({number:"",officer:""});};
const delSlot=id=>{if(window.confirm("Remove callsign slot?"))onRemove(id);};
return<div style={{padding:"10px 14px",overflowY:"auto",maxHeight:"calc(100vh - 102px)"}}>
<div style={{fontSize:13,color:T.hint,marginBottom:12}}>PORT callsigns (POR 000–499) · Click officer name to edit · {portCS.filter(s=>s.officer).length} assigned of {portCS.length} slots</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
{groups.map(({label,slots})=>{const vis=!sq?slots:slots.filter(s=>[s.number,s.officer].some(v=>(v||"").toLowerCase().includes(sq)));
return<div key={label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
<div style={{background:"#0d1729",padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<span style={{color:T.text,fontWeight:700,fontSize:12}}>{label}</span>
<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:T.muted,fontSize:10}}>{slots.filter(s=>s.officer).length}/{slots.length}</span><Btn size="sm" variant="ghost" onClick={()=>{setAdding(label);setForm({number:"",officer:""});}}>+</Btn></div>
</div>
{adding===label&&<div style={{padding:"10px 14px",background:"#0a1120",borderBottom:`1px solid ${T.border}`}}>
<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:8}}>
<FRow label="# (≤499)"><input style={FINP} value={form.number} onChange={e=>setForm(p=>({...p,number:e.target.value}))} placeholder="350" autoFocus/></FRow>
<FRow label="Officer"><input style={FINP} value={form.officer} onChange={e=>setForm(p=>({...p,officer:e.target.value}))} placeholder="Name or blank"/></FRow>
</div>
<div style={{display:"flex",justifyContent:"flex-end",gap:6}}><Btn size="sm" variant="ghost" onClick={()=>setAdding(null)}>Cancel</Btn><Btn size="sm" onClick={()=>addSlot(label)}>Add Slot</Btn></div>
</div>}
<div style={{padding:"8px 14px",maxHeight:300,overflowY:"auto"}}>
{vis.length===0&&<div style={{color:T.muted,fontSize:12,textAlign:"center",padding:"8px 0"}}>No slots.</div>}
{vis.map(s=>{const isDup=dupNums.has(s.number);return<div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
<span style={{fontFamily:"monospace",fontSize:12,color:isDup?"#ef4444":T.accent,minWidth:46,fontWeight:700}}>POR {s.number}</span>
<input value={s.officer||""} onChange={e=>updOfficer(s.id,e.target.value)} placeholder="Unassigned" style={{...BASE_INP,flex:1,fontSize:11,padding:"1px 4px",color:s.officer?T.text:T.muted}}/>
{isDup&&<span style={{background:"#7f1d1d",color:"#fca5a5",borderRadius:3,padding:"0 5px",fontSize:9,fontWeight:700}}>DUP</span>}
<button onClick={()=>delSlot(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:12,lineHeight:1,padding:0}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div>;})}
</div></div>;})}</div></div>;}

// ─── TAB 6: FTO DATABASE ──────────────────────────────────────────────────────
const FTO_LEVELS=["FTO Senior Leadership/Command","FTO Leader","FTO Supervisor","Senior FTO","FTO"];
const FTO_LEVEL_DISPLAY={"FTO Senior Leadership/Command":{bg:"#78350f",fg:"#fef9c3"},"FTO Leader":{bg:"#1e3a8a",fg:"#bfdbfe"},"FTO Supervisor":{bg:"#14532d",fg:"#bbf7d0"},"Senior FTO":{bg:"#4c1d95",fg:"#ede9fe"},"FTO":{bg:"#374151",fg:"#d1d5db"}};
const FTO_DIV=["Leadership","GD","HWY","CIRT","N/A"];
