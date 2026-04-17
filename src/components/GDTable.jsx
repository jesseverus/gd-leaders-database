// src/components/GDTable.jsx
import { useState } from 'react';
import { T, TxtCell, DropCell, DateCell, CvBadge, RankBadge, Btn } from './ui.jsx';
import {
  RANKS, RANK_ORDER, RANK_META, TIER_ROW, promoColor,
  CV_OPTS, PORT_OPTS, CV_META, HW_OPTS, HW_META, LIC_META, BOOL_OPTS,
  daysSince, daysUntil, fmtShort,
} from '../lib/utils.js';

// Props:
//   officers, certs         — arrays from useDb()
//   onUpsertOfficer(o)      — called on any officer cell edit
//   onRemoveOfficer(id)     — called on delete
//   onUpsertCert(c)         — called when a cert column is added
//   onRemoveCert(id)        — called when a cert column is removed
//   search                  — search string
//   onTransfer(o)           — called when → is clicked

export function GDTable({officers,certs,onUpsertOfficer,onRemoveOfficer,onUpsertCert,onRemoveCert,search,onTransfer}){
const[active,setActive]=useState(null);
const isA=(id,col)=>active?.id===id&&active?.col===col;
const act=(id,col)=>setActive({id,col});
const deact=()=>setActive(null);
const updO=(id,f,v)=>{const o=officers.find(x=>x.id===id);if(o)onUpsertOfficer({...o,[f]:v});};
const updCV=(id,cid,v)=>{const o=officers.find(x=>x.id===id);if(o)onUpsertOfficer({...o,certValues:{...o.certValues,[cid]:v}});};
const delO=id=>{if(window.confirm(`Remove officer?`))onRemoveOfficer(id);};
const delC=id=>{if(window.confirm("Remove cert column?")){onRemoveCert(id);officers.forEach(o=>{const cv={...o.certValues};delete cv[id];onUpsertOfficer({...o,certValues:cv});});}};
const csCount={};officers.forEach(o=>{if(o.callsign&&o.callsign!=="-")csCount[o.callsign]=(csCount[o.callsign]||0)+1;});
const sq=search.toLowerCase();
const sorted=[...officers].filter(o=>!sq||[o.steamName,o.fullName,o.callsign].some(v=>(v||"").toLowerCase().includes(sq))).sort((a,b)=>{const rd=(RANK_ORDER[a.rank]??99)-(RANK_ORDER[b.rank]??99);if(rd!==0)return rd;return(daysSince(b.lastPromotionDate)??-1)-(daysSince(a.lastPromotionDate)??-1);});
const CW={full:155,steam:124,call:72,rank:158,lic:60,cert:44,hw:88,hwdate:72,expret:74,daysrem:62,misc:72,promo:72,since:60,restrict:112,ol:54,del:32};
const thB={background:T.nav,color:T.hint,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",borderRight:`1px solid ${T.border}`,borderBottom:`2px solid ${T.borderMid}`,padding:"5px 3px",textAlign:"center",whiteSpace:"nowrap",position:"sticky",top:0,zIndex:4};
const th=(w,sl,sticky)=>({...thB,minWidth:w,width:w,...(sticky?{position:"sticky",left:sl,zIndex:6,top:0}:{})});
const tdB={border:`1px solid ${T.border}`,padding:0,verticalAlign:"middle"};
const tdS=(bg)=>({...tdB,position:"sticky",left:0,background:bg,zIndex:2,minWidth:CW.full,width:CW.full});
const certOpts=cid=>cid==="port"?PORT_OPTS.map(v=>({value:v,label:v||"—"})):CV_OPTS.map(v=>({value:v,label:v||"—"}));
const totalCols=5+certs.length+10;
const rows=[];let lastRank=null;let ri=0;
sorted.forEach(o=>{
if(o.rank!==lastRank){lastRank=o.rank;ri=0;
const rm=RANK_META[o.rank]||{bg:"#374151",fg:"#d1d5db"};
const cnt=sorted.filter(x=>x.rank===o.rank).length;
rows.push(<tr key={`g_${o.rank}`}><td colSpan={totalCols} style={{background:"#040710",padding:"5px 12px",borderBottom:`1px solid ${T.borderMid}`,borderTop:rows.length>0?`2px solid ${T.borderMid}`:"none",position:"sticky",left:0,zIndex:3,whiteSpace:"nowrap"}}><span style={{background:rm.bg,color:rm.fg,borderRadius:3,padding:"2px 10px",fontSize:9,fontWeight:800,letterSpacing:"0.12em"}}>{o.rank.toUpperCase()}</span><span style={{color:T.muted,fontSize:9,marginLeft:10}}>{cnt} officer{cnt!==1?"s":""} · sorted by tenure</span></td></tr>);}
const rm=RANK_META[o.rank]||{tier:"silver"};
const bg=TIER_ROW[rm.tier||"silver"][ri%2===0?"even":"odd"];ri++;
const isOL=o.onLeave==="TRUE";
const days=daysSince(o.lastPromotionDate);
const dayCol=promoColor(o.rank,days);
const hwM=HW_META[o.hoursWarning||""]||HW_META[""];
const licM=LIC_META[o.licenseClass]||{bg:"#1e293b",fg:"#94a3b8"};
const isDup=o.callsign&&o.callsign!=="-"&&(csCount[o.callsign]||0)>1;
const dRem=daysUntil(o.expectedReturn);
const dRemCol=dRem===null?T.muted:dRem<0?"#ef4444":dRem<=3?"#fbbf24":"#22c55e";
rows.push(<tr key={o.id} style={{background:bg,opacity:isOL?0.5:1}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.28)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
<td style={tdS(bg)}><TxtCell value={o.fullName} isActive={isA(o.id,"full")} onActivate={()=>act(o.id,"full")} onChange={v=>updO(o.id,"fullName",v)} onDone={deact}/></td>
<td style={{...tdB,minWidth:CW.steam,width:CW.steam}}><TxtCell value={o.steamName} mono isActive={isA(o.id,"steam")} onActivate={()=>act(o.id,"steam")} onChange={v=>updO(o.id,"steamName",v)} onDone={deact}/></td>
<td style={{...tdB,minWidth:CW.call,width:CW.call,...(isDup?{boxShadow:"inset 0 0 0 2px #ef4444"}:{})}}><TxtCell value={o.callsign} mono align="center" isActive={isA(o.id,"call")} onActivate={()=>act(o.id,"call")} onChange={v=>updO(o.id,"callsign",v)} onDone={deact}/></td>
<td style={{...tdB,minWidth:CW.rank,width:CW.rank}}><DropCell value={o.rank} options={RANKS.map(r=>({value:r,label:r}))} isActive={isA(o.id,"rank")} onActivate={()=>act(o.id,"rank")} onDone={v=>{updO(o.id,"rank",v);deact();}}><RankBadge rank={o.rank}/></DropCell></td>
<td style={{...tdB,minWidth:CW.lic,width:CW.lic}}><DropCell value={o.licenseClass} options={["Gold","Silver","Bronze",""].map(v=>({value:v,label:v||"—"}))} isActive={isA(o.id,"lic")} onActivate={()=>act(o.id,"lic")} onDone={v=>{updO(o.id,"licenseClass",v);deact();}}><span style={{background:licM.bg,color:licM.fg,borderRadius:3,padding:"2px 7px",fontSize:10,fontWeight:700}}>{o.licenseClass||"—"}</span></DropCell></td>
{certs.map(cert=>{const cv=o.certValues?.[cert.id]||"";return<td key={cert.id} style={{...tdB,minWidth:CW.cert,width:CW.cert}} title={cert.fullName}><DropCell value={cv} options={certOpts(cert.id)} isActive={isA(o.id,`cv_${cert.id}`)} onActivate={()=>act(o.id,`cv_${cert.id}`)} onDone={v=>{updCV(o.id,cert.id,v);deact();}}><CvBadge val={cv}/></DropCell></td>;})}
<td style={{...tdB,minWidth:CW.hw,width:CW.hw}}><DropCell value={o.hoursWarning||""} options={HW_OPTS.map(v=>({value:v,label:v||"—"}))} isActive={isA(o.id,"hw")} onActivate={()=>act(o.id,"hw")} onDone={v=>{updO(o.id,"hoursWarning",v);deact();}}><span style={{fontSize:12,fontWeight:600,color:hwM.color,whiteSpace:"nowrap"}}>{hwM.label}</span></DropCell></td>
<td style={{...tdB,minWidth:CW.hwdate,width:CW.hwdate}}><DateCell value={o.date30Hours} isActive={isA(o.id,"hw30")} onActivate={()=>act(o.id,"hw30")} onDone={v=>{updO(o.id,"date30Hours",v);deact();}}/></td>
<td style={{...tdB,minWidth:CW.expret,width:CW.expret}}><DateCell value={o.expectedReturn} isActive={isA(o.id,"expret")} onActivate={()=>act(o.id,"expret")} onDone={v=>{updO(o.id,"expectedReturn",v);deact();}}/></td>
<td style={{...tdB,minWidth:CW.daysrem,width:CW.daysrem}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:26}}>{o.expectedReturn?<span style={{fontSize:12,fontWeight:700,color:dRemCol}}>{dRem!==null?(dRem<0?`${Math.abs(dRem)}d ago`:`${dRem}d`):"—"}</span>:<span style={{color:T.muted,fontSize:11}}>—</span>}</div></td>
<td style={{...tdB,minWidth:CW.misc,width:CW.misc}}><DateCell value={o.lastRpMisconduct} isActive={isA(o.id,"misc")} onActivate={()=>act(o.id,"misc")} onDone={v=>{updO(o.id,"lastRpMisconduct",v);deact();}}/></td>
<td style={{...tdB,minWidth:CW.promo,width:CW.promo}}><DateCell value={o.lastPromotionDate} isActive={isA(o.id,"promo")} onActivate={()=>act(o.id,"promo")} onDone={v=>{updO(o.id,"lastPromotionDate",v);deact();}}/></td>
<td style={{...tdB,minWidth:CW.since,width:CW.since}}><DateCell value={o.lastPromotionDate} isActive={isA(o.id,"promo2")} onActivate={()=>act(o.id,"promo2")} onDone={v=>{updO(o.id,"lastPromotionDate",v);deact();}} display={o.lastPromotionDate?<span style={{fontSize:12,fontWeight:700,color:dayCol}}>{days}d</span>:<span style={{color:T.muted,fontSize:11}}>—</span>}/></td>
<td style={{...tdB,minWidth:CW.restrict,width:CW.restrict}}><TxtCell value={o.rankRestriction} isActive={isA(o.id,"restr")} onActivate={()=>act(o.id,"restr")} onChange={v=>updO(o.id,"rankRestriction",v)} onDone={deact}/></td>
<td style={{...tdB,minWidth:CW.ol,width:CW.ol}}><DropCell value={o.onLeave||""} options={BOOL_OPTS} isActive={isA(o.id,"ol")} onActivate={()=>act(o.id,"ol")} onDone={v=>{updO(o.id,"onLeave",v);deact();}}><span style={{fontSize:12,fontWeight:700,color:isOL?"#fbbf24":"#22c55e"}}>{isOL?"Yes":"No"}</span></DropCell></td>
<td style={{...tdB,minWidth:CW.del,width:CW.del,textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}><button onClick={()=>onTransfer(o)} title="Transfer" style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",fontSize:13,padding:"2px 3px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#a855f7"} onMouseLeave={e=>e.target.style.color="#6d28d9"}>→</button><button onClick={()=>delO(o.id)} title="Delete" style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13,padding:"2px 3px",lineHeight:1}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.muted}>✕</button></div></td>
</tr>);});
const thTop={...thB,top:0,zIndex:5,fontSize:8,letterSpacing:"0.12em",color:"#3a5878",borderBottom:`1px solid ${T.borderMid}`};
return<div style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 102px)",borderRadius:7,border:`1px solid ${T.border}`,margin:"0 10px 10px"}}>
<table style={{borderCollapse:"collapse",width:"max-content",tableLayout:"fixed"}}><thead>
<tr><th style={{...thTop,position:"sticky",left:0,zIndex:8,background:"#0a1020",textAlign:"center"}}>OFFICER INFO</th><th colSpan={4} style={{...thTop,background:"#0a1020"}}/><th colSpan={certs.length} style={{...thTop,background:"#08152a",color:"#3a6080"}}>CERTIFICATIONS</th><th colSpan={5} style={{...thTop,background:"#150a1e",color:"#5a3878"}}>LEAVE &amp; WARNINGS</th><th colSpan={3} style={{...thTop,background:"#0a1a0a",color:"#3a6840"}}>PROMOTION</th><th colSpan={2} style={{...thTop,background:"#0a1020"}}/></tr>
<tr><th style={{...th(CW.full,0,true),top:22,zIndex:7}}>Full Name</th><th style={{...th(CW.steam),top:22}}>Steam</th><th style={{...th(CW.call),top:22}}>Callsign</th><th style={{...th(CW.rank),top:22}}>Rank</th><th style={{...th(CW.lic),top:22}}>Lic.</th>
{certs.map(c=><th key={c.id} title={c.fullName} style={{...th(CW.cert),top:22}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:9}}>{c.name}</span><button onClick={()=>delC(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#1e3050",fontSize:8,padding:0,lineHeight:1}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color="#1e3050"}>×</button></div></th>)}
<th style={{...th(CW.hw),top:22}}>Hours Warning</th><th style={{...th(CW.hwdate),top:22}}>HW Date</th><th style={{...th(CW.expret),top:22}}>Exp. Return</th><th style={{...th(CW.daysrem),top:22}}>Days Left</th><th style={{...th(CW.misc),top:22}}>Last Misc.</th><th style={{...th(CW.promo),top:22}}>Last Promo</th><th style={{...th(CW.since),top:22}} title="Days since promo ↓">Since ↓</th><th style={{...th(CW.restrict),top:22}}>Restriction</th><th style={{...th(CW.ol),top:22}}>Leave</th><th style={{...th(CW.del),top:22}}/></tr>
</thead><tbody>{sorted.length===0?<tr><td colSpan={totalCols} style={{padding:32,textAlign:"center",color:T.muted,fontSize:13}}>{search?"No results.":"No officers."}</td></tr>:rows}</tbody></table></div>;}

// ─── TAB 2: TRANSFERS ─────────────────────────────────────────────────────────
