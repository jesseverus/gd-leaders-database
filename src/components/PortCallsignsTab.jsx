// src/components/PortCallsignsTab.jsx
import { useState, useMemo } from 'react';
import { T, Btn, FRow, FINP, BASE_INP } from './ui.jsx';
import { genId } from '../lib/utils.js';

// Props: portCS, onUpsert(s), onRemove(id), search

// Rank band definitions for the rank-specific tables (excluding plain SC/FC bands)
const RANK_BANDS = [
  { label:'Senior Command',              key:'command', range:[100,149], color:{bg:'#7c2d12',fg:'#fed7aa'} },
  { label:'Senior Sergeant / Acting SS', key:'ssngt',   range:[460,469], color:{bg:'#78350f',fg:'#fef9c3'} },
  { label:'Sergeant',                    key:'sgt',     range:[450,459], color:{bg:'#1e3a8a',fg:'#bfdbfe'} },
  { label:'Leading Senior Constable',    key:'lsc',     range:[440,449], color:{bg:'#14532d',fg:'#bbf7d0'} },
];
// SC/FC range covers everything not in a rank band
const SC_RANGES = [[400,439],[470,499]];
const inSCRange = n => SC_RANGES.some(([lo,hi]) => n>=lo && n<=hi);
const inRankBand = n => RANK_BANDS.some(b => n>=b.range[0] && n<=b.range[1]);

export function PortCallsignsTab({portCS, onUpsert, onRemove, search}){
  const [editing,   setEditing]   = useState(null);
  const [addingTo,  setAddingTo]  = useState(null);
  const [newSlot,   setNewSlot]   = useState({number:'',officer:''});
  // Section collapse state — all start expanded
  const [collapsed, setCollapsed] = useState({});
  const isCollapsed = key => collapsed[key] ?? true;
  const toggle      = key => setCollapsed(p=>({...p,[key]:!isCollapsed(key)}));

  const sq = search.toLowerCase();

  const updateOfficer = (id, val) => {
    const s = portCS.find(x=>x.id===id);
    if(s) onUpsert({...s, officer:val});
  };
  const removeSlot = id => { if(window.confirm('Remove this callsign slot?')) onRemove(id); };

  // Rank band slots
  const rankBands = useMemo(() => RANK_BANDS.map(band => ({
    ...band,
    slots: portCS
      .filter(s => { const n=parseInt(s.number); return n>=band.range[0] && n<=band.range[1]; })
      .filter(s => !sq || [s.number,s.officer].some(v=>(v||'').toLowerCase().includes(sq)))
      .sort((a,b)=>parseInt(a.number)-parseInt(b.number)),
  })), [portCS, sq]);

  // SC/FC slots — all 400s and 470s
  const scSlots = useMemo(() => portCS
    .filter(s => inSCRange(parseInt(s.number)))
    .filter(s => !sq || [s.number,s.officer].some(v=>(v||'').toLowerCase().includes(sq)))
    .sort((a,b)=>parseInt(a.number)-parseInt(b.number))
  , [portCS, sq]);

  const availableSlots = useMemo(() => scSlots.filter(s => !s.officer || !s.officer.trim()), [scSlots]);
  const assignedSlots  = useMemo(() => scSlots.filter(s =>  s.officer &&  s.officer.trim()), [scSlots]);

  const addSlot = (bandKey) => {
    const band = RANK_BANDS.find(b=>b.key===bandKey);
    const num  = parseInt(newSlot.number.replace(/\D/g,''));
    if(isNaN(num)) return;
    if(num < band.range[0] || num > band.range[1]) {
      alert(`Number must be between ${band.range[0]} and ${band.range[1]} for this group.`);
      return;
    }
    onUpsert({id:genId(), group:band.label, number:String(num), officer:newSlot.officer.trim()});
    setAddingTo(null); setNewSlot({number:'',officer:''});
  };

  const addSCSlot = () => {
    const num = parseInt(newSlot.number.replace(/\D/g,''));
    if(isNaN(num)) return;
    if(!inSCRange(num)) { alert('Number must be in range 400–439 or 470–499.'); return; }
    onUpsert({id:genId(), group:'Senior / First Constable', number:String(num), officer:newSlot.officer.trim()});
    setAddingTo(null); setNewSlot({number:'',officer:''});
  };

  const totalAssigned = portCS.filter(s=>s.officer&&s.officer.trim()).length;

  const SectionHeader = ({sectionKey, label, color, count, assignedCount, onAdd}) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'6px 12px', borderRadius: isCollapsed(sectionKey) ? 6 : '6px 6px 0 0',
      background: color?.bg ?? '#0d1729',
      border: color ? 'none' : `1px solid ${T.border}`,
      cursor:'pointer', marginBottom:0, userSelect:'none'}}
      onClick={()=>toggle(sectionKey)}>
      <div style={{display:'flex',alignItems:'center',gap:10}} onClick={e=>{e.stopPropagation();toggle(sectionKey);}}>
        <span style={{color:color?.fg ?? T.accent, fontSize:11}}>{isCollapsed(sectionKey)?'▶':'▼'}</span>
        <span style={{color:color?.fg ?? T.text, fontSize:11, fontWeight:700, letterSpacing:'0.06em'}}>
          {label.toUpperCase()}
        </span>
        {assignedCount!==undefined && (
          <span style={{color:color?.fg ?? T.muted, fontSize:10, opacity:0.8}}>
            {assignedCount}/{count}
          </span>
        )}
        {assignedCount===undefined && count!==undefined && (
          <span style={{color:color?.fg ?? T.muted, fontSize:10, opacity:0.8}}>{count}</span>
        )}
      </div>
      {onAdd && (
        <button onClick={e=>{e.stopPropagation();onAdd();}}
          style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:3,
            color:color?.fg ?? T.hint,fontSize:10,padding:'2px 8px',cursor:'pointer',fontWeight:600}}>
          + Add slot
        </button>
      )}
    </div>
  );

  const AddSlotForm = ({onSubmit, placeholder, hint}) => (
    <div style={{background:'#0a1120',border:`1px solid ${T.border}`,borderTop:'none',
      padding:'10px 14px',display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
      <div style={{flex:'0 0 110px'}}>
        <label style={{display:'block',color:T.hint,fontSize:10,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>
          Number {hint && <span style={{color:T.muted,fontSize:9}}>({hint})</span>}
        </label>
        <input style={{...FINP,fontSize:12}} value={newSlot.number}
          onChange={e=>setNewSlot(p=>({...p,number:e.target.value}))} placeholder={placeholder} autoFocus/>
      </div>
      <div style={{flex:'1 1 180px'}}>
        <label style={{display:'block',color:T.hint,fontSize:10,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Officer (optional)</label>
        <input style={{...FINP,fontSize:12}} value={newSlot.officer}
          onChange={e=>setNewSlot(p=>({...p,officer:e.target.value}))} placeholder="Leave blank if unassigned"
          onKeyDown={e=>e.key==='Enter'&&onSubmit()}/>
      </div>
      <div style={{display:'flex',gap:6,paddingBottom:1}}>
        <Btn size="sm" variant="ghost" onClick={()=>{setAddingTo(null);setNewSlot({number:'',officer:''});}}>Cancel</Btn>
        <Btn size="sm" onClick={onSubmit}>Add</Btn>
      </div>
    </div>
  );

  const SlotRow = ({s, i}) => {
    const isAssigned = s.officer && s.officer.trim();
    const rowBg = i%2===0 ? '#090f1c' : '#0c1525';
    return (
      <tr style={{background:rowBg}}
        onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.3)'}
        onMouseLeave={e=>e.currentTarget.style.filter=''}>
        <td style={{padding:'6px 12px',borderRight:`1px solid ${T.border}`,
          fontFamily:'monospace',fontSize:12,color:T.accent,fontWeight:700,whiteSpace:'nowrap'}}>
          POR {s.number}
        </td>
        <td style={{padding:'4px 8px',borderRight:`1px solid ${T.border}`}}>
          {editing===s.id
            ? <input autoFocus defaultValue={s.officer||''}
                onChange={()=>{}}
                onBlur={e=>{updateOfficer(s.id,e.target.value);setEditing(null);}}
                onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditing(null);}}
                style={{...BASE_INP,fontSize:12,background:'transparent'}}/>
            : <div onClick={()=>setEditing(s.id)}
                style={{cursor:'pointer',fontSize:12,padding:'2px 4px',borderRadius:3,
                  color:isAssigned?T.text:T.muted, fontStyle:isAssigned?'normal':'italic'}}>
                {isAssigned ? s.officer : 'Unassigned — click to assign'}
              </div>
          }
        </td>
        <td style={{padding:'4px 6px',textAlign:'center',width:28}}>
          <button onClick={()=>removeSlot(s.id)}
            style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:12,lineHeight:1,padding:'2px'}}
            onMouseEnter={e=>e.target.style.color=T.danger}
            onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
        </td>
      </tr>
    );
  };

  const SlotTable = ({slots, borderTop=false}) => (
    <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',
      border:`1px solid ${T.border}`,borderTop: borderTop ? `1px solid ${T.border}` : 'none',
      borderRadius:'0 0 6px 6px',overflow:'hidden',display:'block'}}>
      <thead>
        <tr style={{background:'#0a1120'}}>
          <th style={{width:80,padding:'5px 12px',textAlign:'left',fontSize:10,fontWeight:700,
            color:T.hint,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${T.border}`}}>
            Callsign
          </th>
          <th style={{padding:'5px 12px',textAlign:'left',fontSize:10,fontWeight:700,
            color:T.hint,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${T.border}`}}>
            Officer
          </th>
          <th style={{width:28,borderBottom:`1px solid ${T.border}`}}/>
        </tr>
      </thead>
      <tbody>
        {slots.length===0
          ? <tr><td colSpan={3} style={{padding:'10px 14px',color:T.muted,fontSize:12,textAlign:'center',fontStyle:'italic'}}>None</td></tr>
          : slots.map((s,i)=><SlotRow key={s.id} s={s} i={i}/>)
        }
      </tbody>
    </table>
  );

  return (
    <div style={{padding:'10px 14px',overflowY:'auto',maxHeight:'calc(100vh - 102px)'}}>

      <div style={{fontSize:13,color:T.hint,marginBottom:16}}>
        PORT callsigns · {totalAssigned} assigned of {portCS.length} slots · Click officer name to edit
      </div>

      {/* ── RANK-SPECIFIC BANDS (Command, SSgt, Sgt, LSC) ── */}
      {rankBands.map(band => (
        <div key={band.key} style={{marginBottom:14}}>
          <SectionHeader
            sectionKey={band.key} label={band.label} color={band.color}
            count={band.slots.length}
            assignedCount={band.slots.filter(s=>s.officer&&s.officer.trim()).length}
            onAdd={()=>{setAddingTo(addingTo===band.key?null:band.key);setNewSlot({number:'',officer:''}); }}
          />
          {addingTo===band.key && (
            <AddSlotForm
              onSubmit={()=>addSlot(band.key)}
              placeholder={String(band.range[0])}
              hint={`${band.range[0]}–${band.range[1]}`}/>
          )}
          {!isCollapsed(band.key) && (
            band.slots.length===0
              ? <div style={{background:T.card,border:`1px solid ${T.border}`,borderTop:'none',
                  borderRadius:'0 0 6px 6px',padding:'12px 14px',color:T.muted,fontSize:12,textAlign:'center'}}>
                  No slots — use + Add slot to add one
                </div>
              : <SlotTable slots={band.slots}/>
          )}
        </div>
      ))}

      {/* ── AVAILABLE CALLSIGNS (unassigned SC/FC slots) ── */}
      <div style={{marginBottom:14}}>
        <SectionHeader
          sectionKey="available"
          label={`Available Callsigns — ${availableSlots.length} unassigned`}
          color={null}
          onAdd={()=>{setAddingTo(addingTo==='sc'?null:'sc');setNewSlot({number:'',officer:''}); }}
        />
        {addingTo==='sc' && (
          <AddSlotForm onSubmit={addSCSlot} placeholder="400" hint="400–439 or 470–499"/>
        )}
        {!isCollapsed('available') && <SlotTable slots={availableSlots} borderTop={true}/>}
      </div>

      {/* ── ALL OFFICERS (assigned SC/FC slots) ── */}
      <div style={{marginBottom:14}}>
        <SectionHeader
          sectionKey="assigned"
          label={`All Officers — ${assignedSlots.length} assigned`}
          color={null}
        />
        {!isCollapsed('assigned') && <SlotTable slots={assignedSlots} borderTop={true}/>}
      </div>

    </div>
  );
}
