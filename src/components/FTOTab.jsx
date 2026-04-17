// src/components/FTOTab.jsx
import { useState } from 'react';
import { T, Btn, FRow, FINP, FSEL } from './ui.jsx';
import { RANKS, RANK_ORDER, RANK_META, TIER_ROW, FTO_LEVELS, FTO_DIV, BASE_INP, genId } from '../lib/utils.js';

const FTO_LEVEL_DISPLAY = {
  "FTO Senior Leadership/Command": { bg:"#78350f", fg:"#fef9c3" },
  "FTO Leader":                    { bg:"#1e3a8a", fg:"#bfdbfe" },
  "FTO Supervisor":                { bg:"#14532d", fg:"#bbf7d0" },
  "Senior FTO":                    { bg:"#4c1d95", fg:"#ede9fe" },
  "FTO":                           { bg:"#374151", fg:"#d1d5db" },
};

// Props: ftoOfficers, onUpsert(o), onRemove(id), search

export function FTOTab({ftoOfficers,onUpsert,onRemove,onCheckAndAdd,search}){
const[showAdd,setShowAdd]=useState(false);const[form,setForm]=useState({fullName:"",rank:"Senior Constable",division:"GD",ftoLevel:"FTO",isFTO:"Y",isSFTO:"N",isAcademyTrainer:"N",isInductionHost:"N",isSupervisor:"N",isLeader:"N"});
const[active,setActive]=useState(null);const isA=(id,f)=>active?.id===id&&active?.f===f;const act=(id,f)=>setActive({id,f});const deact=()=>setActive(null);
const[collapsedLevels,setCollapsedLevels]=useState({});
const[prevCollapsed,setPrevCollapsed]=useState(true);
const[prevNoteEdit,setPrevNoteEdit]=useState(null);
const isLevelCollapsed=level=>collapsedLevels[level]??true;
const toggleLevel=level=>setCollapsedLevels(p=>({...p,[level]:!isLevelCollapsed(level)}));
const upd=k=>e=>{
  const v=e.target.value;
  let patch={[k]:v};
  if(k==="rank"&&LEADERSHIP_RANKS_FTO.has(v)){patch={...patch,isFTO:"Y",isSFTO:"Y"};}
  if(k==="ftoLevel"&&SFTO_LEVELS_SET.has(v)){patch={...patch,isFTO:"Y",isSFTO:"Y"};}
  setForm(p=>({...p,...patch}));
};
const addOfficer=()=>{
  if(!form.fullName.trim())return;
  const newRec={...form,id:genId(),fullName:form.fullName.trim(),isPrevious:'N',removedDate:'',notes:''};
  if(onCheckAndAdd){onCheckAndAdd(newRec);}else{onUpsert(newRec);}
  setShowAdd(false);
  setForm({fullName:"",rank:"Senior Constable",division:"GD",ftoLevel:"FTO",isFTO:"Y",isSFTO:"N",isAcademyTrainer:"N",isInductionHost:"N",isSupervisor:"N",isLeader:"N"});
};
const del=id=>{if(window.confirm("Remove from FTO Database?"))onRemove(id);};
// When a cert toggle changes, check if ALL of FTO/SFTO/Trainer/Induction are now N
// (Supervisor and Leader are excluded per spec)
const handleToggle=(o,k,v)=>{
  const updated={...o,[k]:v};
  const certFields=["isFTO","isSFTO","isAcademyTrainer","isInductionHost"];
  const allN=certFields.every(f=>updated[f]==="N");
  if(allN){
    if(window.confirm(`All active certs cleared for ${o.fullName}.\nMove to Previous FTO (keeps a record)?`)){
      onRemove(o.id); return; // App.jsx will archive rather than delete
    }
  }
  updF(o.id,k,v);
};
const LEADERSHIP_RANKS_FTO=new Set(["Superintendent","Onions Burger","Acting Inspector","Senior Sergeant","Acting Senior Sergeant","Sergeant","Acting Sergeant","Leading Senior Constable","Acting LSC","Acting Leading Senior Constable"]);
const SFTO_LEVELS_SET=new Set(["FTO Senior Leadership/Command","FTO Leader","FTO Supervisor","Senior FTO"]);
const updF=(id,f,v)=>{
  const o=ftoOfficers.find(x=>x.id===id);
  if(!o)return;
  let updated={...o,[f]:v};
  if(f==="rank"&&LEADERSHIP_RANKS_FTO.has(v)){updated={...updated,isFTO:"Y",isSFTO:"Y"};}
  if(f==="ftoLevel"&&SFTO_LEVELS_SET.has(v)){updated={...updated,isFTO:"Y",isSFTO:"Y"};}
  onUpsert(updated);
};
const sq=search.toLowerCase();
const DIV_ORDER={'GD':0,'HWY':1,'CIRT':2};
const sorted=[...ftoOfficers]
  .filter(o=>!sq||[o.fullName,o.rank,o.division,o.ftoLevel].some(v=>(v||"").toLowerCase().includes(sq)))
  .sort((a,b)=>{
    // 1. FTO level group
    const la=FTO_LEVELS.indexOf(a.ftoLevel??"");
    const lb=FTO_LEVELS.indexOf(b.ftoLevel??"");
    if(la!==lb)return la-lb;
    // 2. Rank
    const ra=(RANK_ORDER[a.rank]??99)-(RANK_ORDER[b.rank]??99);
    if(ra!==0)return ra;
    // 3. Division — GD first, then HWY, then CIRT, then others
    const da=(DIV_ORDER[a.division]??3)-(DIV_ORDER[b.division]??3);
    if(da!==0)return da;
    // 4. Alphabetical by full name
    return(a.fullName??"").localeCompare(b.fullName??"");
  });
const activeOfficers=sorted.filter(o=>o.isPrevious!=='Y');
const previousOfficers=[...ftoOfficers]
  .filter(o=>o.isPrevious==='Y')
  .filter(o=>!sq||[o.fullName,o.rank,o.division].some(v=>(v||'').toLowerCase().includes(sq)))
  .sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||''));
const byLevel={};activeOfficers.forEach(o=>{const l=o.ftoLevel||"FTO";if(!byLevel[l])byLevel[l]=[];byLevel[l].push(o);});
const Toggle=({val,onChange})=><button onClick={()=>onChange(val==="Y"?"N":"Y")} style={{background:val==="Y"?"#14532d":"transparent",color:val==="Y"?"#bbf7d0":"#475569",border:`1px solid ${val==="Y"?"#14532d":T.border}`,borderRadius:3,padding:"1px 8px",fontSize:10,fontWeight:700,cursor:"pointer",minWidth:32}}>{val==="Y"?"Y":"N"}</button>;
const FIELDS=[["isFTO","FTO"],["isSFTO","SFTO"],["isAcademyTrainer","Trainer"],["isInductionHost","Induction"],["isSupervisor","Supervisor"],["isLeader","Leader"]];
return<div style={{padding:"10px 14px",overflowY:"auto",maxHeight:"calc(100vh - 102px)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
<div style={{fontSize:13,color:T.hint}}>FTO Database · {ftoOfficers.length} officers · Independently editable (not synced from GD tab)</div>
<Btn size="sm" variant="success" onClick={()=>setShowAdd(p=>!p)}>+ Add FTO Officer</Btn></div>
{showAdd&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:14}}>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
<FRow label="Full Name"><input style={FINP} value={form.fullName} onChange={upd("fullName")} autoFocus/></FRow>
<FRow label="Rank"><select style={FSEL} value={form.rank} onChange={upd("rank")}>{RANKS.map(r=><option key={r}>{r}</option>)}</select></FRow>
<FRow label="Division"><select style={FSEL} value={form.division} onChange={upd("division")}>{FTO_DIV.map(d=><option key={d}>{d}</option>)}</select></FRow>
<FRow label="FTO Level"><select style={FSEL} value={form.ftoLevel} onChange={upd("ftoLevel")}>{FTO_LEVELS.map(l=><option key={l}>{l}</option>)}</select></FRow>
</div>
<div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:10}}>{FIELDS.map(([k,label])=><div key={k} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,color:T.hint}}>{label}</span><Toggle val={form[k]} onChange={v=>setForm(p=>({...p,[k]:v}))}/></div>)}</div>
<div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn size="sm" variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn size="sm" onClick={addOfficer}>Add</Btn></div>
</div>}
{FTO_LEVELS.map(level=>{const grp=byLevel[level];if(!grp||grp.length===0)return null;const lm=FTO_LEVEL_DISPLAY[level]||{bg:"#374151",fg:"#d1d5db"};
return<div key={level} style={{marginBottom:16}}>
<div onClick={()=>toggleLevel(level)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",background:"#040710",borderBottom:`1px solid ${T.borderMid}`,borderTop:`2px solid ${T.borderMid}`,marginBottom:4,cursor:"pointer",userSelect:"none"}}>
<span style={{color:T.hint,fontSize:11}}>{isLevelCollapsed(level)?"▶":"▼"}</span>
<span style={{background:lm.bg,color:lm.fg,borderRadius:3,padding:"2px 10px",fontSize:9,fontWeight:800,letterSpacing:"0.12em"}}>{level.toUpperCase()}</span>
<span style={{color:T.muted,fontSize:9}}>{grp.length} officer{grp.length!==1?"s":""}</span>
</div>
{!isLevelCollapsed(level)&&<div style={{display:"flex",flexDirection:"column",gap:4}}>
{grp.map(o=><div key={o.id} style={{background:TIER_ROW.silver.even,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
<div style={{width:36,height:36,background:RANK_META[o.rank]?.bg||"#374151",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:RANK_META[o.rank]?.fg||"#d1d5db",fontSize:10,fontWeight:800}}>{(o.fullName||"?").slice(0,2).toUpperCase()}</span></div>
<div style={{flex:"0 0 180px",minWidth:0}}>{isA(o.id,"fn")?<input autoFocus value={o.fullName} onChange={e=>updF(o.id,"fullName",e.target.value)} onBlur={deact} style={{...BASE_INP,fontSize:13}}/>:<div onClick={()=>act(o.id,"fn")} style={{cursor:"pointer",color:T.text,fontWeight:700,fontSize:13}}>{o.fullName}</div>}<div style={{color:T.hint,fontSize:11}}>{o.division}</div></div>
<div style={{flex:"0 0 190px"}}><select value={o.rank} onChange={e=>updF(o.id,"rank",e.target.value)} style={{...BASE_INP,padding:"2px 4px",fontSize:11}}>{RANKS.map(r=><option key={r}>{r}</option>)}</select></div>
<div style={{flex:"0 0 160px"}}><select value={o.ftoLevel} onChange={e=>updF(o.id,"ftoLevel",e.target.value)} style={{...BASE_INP,padding:"2px 4px",fontSize:11}}>{FTO_LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>{FIELDS.map(([k,label])=><div key={k} style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:T.muted}}>{label}</span><Toggle val={o[k]||"N"} onChange={v=>handleToggle(o,k,v)}/></div>)}</div>
<button onClick={()=>del(o.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13,lineHeight:1,marginLeft:"auto"}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div>)}
</div>}</div>;})}
{activeOfficers.length===0&&!previousOfficers.length&&<div style={{color:T.muted,textAlign:"center",padding:32,fontSize:13}}>No FTO officers match.</div>}

{/* Previous FTO section */}
{(previousOfficers.length>0||!sq)&&<div style={{marginTop:16}}>
<div onClick={()=>setPrevCollapsed(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",background:"#040710",borderBottom:`1px solid ${T.borderMid}`,borderTop:`2px solid ${T.borderMid}`,marginBottom:4,cursor:"pointer",userSelect:"none"}}>
<span style={{color:T.hint,fontSize:11}}>{prevCollapsed?"▶":"▼"}</span>
<span style={{background:"#374151",color:"#9ca3af",borderRadius:3,padding:"2px 10px",fontSize:9,fontWeight:800,letterSpacing:"0.12em"}}>PREVIOUS FTO</span>
<span style={{color:T.muted,fontSize:9}}>{previousOfficers.length} officer{previousOfficers.length!==1?"s":""}</span>
</div>
{!prevCollapsed&&<div style={{display:"flex",flexDirection:"column",gap:4}}>
{previousOfficers.length===0&&<div style={{color:T.muted,fontSize:12,textAlign:"center",padding:12}}>No previous FTO officers.</div>}
{previousOfficers.map(o=>(
<div key={o.id} style={{background:"#0d0d0d",border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 14px",opacity:0.75}}>
<div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
<div style={{width:36,height:36,background:"#374151",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
<span style={{color:"#9ca3af",fontSize:10,fontWeight:800}}>{(o.fullName||"?").slice(0,2).toUpperCase()}</span></div>
<div style={{flex:"0 0 180px",minWidth:0}}>
<div style={{color:"#9ca3af",fontWeight:700,fontSize:13}}>{o.fullName}</div>
<div style={{color:T.muted,fontSize:11}}>{o.rank} · {o.division}</div>
</div>
<div style={{flex:"0 0 120px",fontSize:11}}>
<div style={{color:T.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>Removed</div>
<div style={{color:"#9ca3af"}}>{o.removedDate||"—"}</div>
</div>
<div style={{flex:"0 0 80px",fontSize:11}}>
<div style={{color:T.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>Level</div>
<div style={{color:"#9ca3af"}}>{o.ftoLevel||"—"}</div>
</div>
<div style={{flex:"1 1 200px"}}>
<div style={{color:T.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Notes</div>
{prevNoteEdit===o.id
?<input autoFocus value={o.notes||""} onChange={e=>onUpsert({...o,notes:e.target.value})} onBlur={()=>setPrevNoteEdit(null)} style={{...BASE_INP,fontSize:12,background:"#060d1a"}}/>
:<div onClick={()=>setPrevNoteEdit(o.id)} style={{cursor:"pointer",color:o.notes?"#9ca3af":T.muted,fontSize:12,fontStyle:o.notes?"normal":"italic"}}>{o.notes||"Click to add notes…"}</div>}
</div>
<button onClick={()=>{if(window.confirm(`Permanently delete ${o.fullName} from Previous FTO?`))onRemove(o.id);}} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:12,lineHeight:1,marginLeft:"auto"}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
</div></div>
))}
</div>}
</div>}
</div>;}
// ─── APP ROOT ─────────────────────────────────────────────────────────────────
