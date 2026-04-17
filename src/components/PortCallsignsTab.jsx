// src/components/PortCallsignsTab.jsx
import { useState, useMemo } from 'react';
import { T, Btn, FRow, FINP, BASE_INP } from './ui.jsx';
import { genId } from '../lib/utils.js';

// Props: portCS, onUpsert(s), onRemove(id), search

// Rank band definitions — number ranges map to rank groups
const BANDS = [
  { label:'Senior Command',                  key:'command',  range:[100,149], color:{bg:'#7c2d12',fg:'#fed7aa'} },
  { label:'Senior Sergeant / Acting SS',     key:'ssngt',    range:[460,469], color:{bg:'#78350f',fg:'#fef9c3'} },
  { label:'Sergeant',                        key:'sgt',      range:[450,459], color:{bg:'#1e3a8a',fg:'#bfdbfe'} },
  { label:'Leading Senior Constable',        key:'lsc',      range:[440,449], color:{bg:'#14532d',fg:'#bbf7d0'} },
  { label:'Senior / First Constable (400s)', key:'sc400',    range:[400,439], color:{bg:'#1e3a5f',fg:'#93c5fd'} },
  { label:'Senior / First Constable (470s)', key:'sc470',    range:[470,499], color:{bg:'#1e3a5f',fg:'#bfdbfe'} },
];

function getBand(num) {
  const n = parseInt(num);
  return BANDS.find(b => n >= b.range[0] && n <= b.range[1]);
}

export function PortCallsignsTab({portCS, onUpsert, onRemove, search}){
  const [editing,  setEditing]  = useState(null); // slot id being edited
  const [addingTo, setAddingTo] = useState(null); // band key for new slot form
  const [newSlot,  setNewSlot]  = useState({number:'',officer:''});

  const sq = search.toLowerCase();

  // Group slots into bands, sorted by callsign number
  const bands = useMemo(() => {
    return BANDS.map(band => {
      const slots = portCS
        .filter(s => {
          const n = parseInt(s.number);
          return n >= band.range[0] && n <= band.range[1];
        })
        .filter(s => !sq || [s.number,s.officer].some(v=>(v||'').toLowerCase().includes(sq)))
        .sort((a,b) => parseInt(a.number)-parseInt(b.number));
      return { ...band, slots };
    });
  }, [portCS, sq]);

  const updateOfficer = (id, val) => {
    const s = portCS.find(x=>x.id===id);
    if(s) onUpsert({...s, officer:val});
  };

  const addSlot = (bandKey) => {
    const band = BANDS.find(b=>b.key===bandKey);
    const num  = parseInt(newSlot.number.replace(/\D/g,''));
    if(isNaN(num)) return;
    if(num < band.range[0] || num > band.range[1]) {
      alert(`Number must be between ${band.range[0]} and ${band.range[1]} for this group.`);
      return;
    }
    onUpsert({id:genId(), group:band.label, number:String(num), officer:newSlot.officer.trim()});
    setAddingTo(null);
    setNewSlot({number:'',officer:''});
  };

  const removeSlot = id => { if(window.confirm('Remove this callsign slot?')) onRemove(id); };

  const totalAssigned = portCS.filter(s=>s.officer&&s.officer.trim()).length;
  const totalSlots    = portCS.length;

  return (
    <div style={{padding:'10px 14px',overflowY:'auto',maxHeight:'calc(100vh - 102px)'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:13,color:T.hint}}>
          PORT callsigns · {totalAssigned} assigned of {totalSlots} slots
        </div>
      </div>

      {/* One table per rank band */}
      {bands.map(band => {
        const assigned = band.slots.filter(s=>s.officer&&s.officer.trim()).length;
        return (
          <div key={band.key} style={{marginBottom:20}}>

            {/* Band header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'6px 12px',borderRadius:'6px 6px 0 0',
              background:band.color.bg,marginBottom:0}}>
              <span style={{color:band.color.fg,fontSize:11,fontWeight:700,letterSpacing:'0.06em'}}>
                {band.label.toUpperCase()}
              </span>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{color:band.color.fg,fontSize:10,opacity:0.8}}>
                  {assigned}/{band.slots.length} assigned
                </span>
                <button onClick={()=>{setAddingTo(addingTo===band.key?null:band.key);setNewSlot({number:'',officer:''}); }}
                  style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:3,
                    color:band.color.fg,fontSize:10,padding:'2px 8px',cursor:'pointer',fontWeight:600}}>
                  + Add slot
                </button>
              </div>
            </div>

            {/* Add slot form */}
            {addingTo===band.key && (
              <div style={{background:'#0a1120',border:`1px solid ${T.border}`,borderTop:'none',padding:'10px 14px',
                display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
                <div style={{flex:'0 0 100px'}}>
                  <label style={{display:'block',color:T.hint,fontSize:10,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>
                    Number ({band.range[0]}–{band.range[1]})
                  </label>
                  <input style={{...FINP,fontSize:12}} value={newSlot.number}
                    onChange={e=>setNewSlot(p=>({...p,number:e.target.value}))} placeholder={String(band.range[0])} autoFocus/>
                </div>
                <div style={{flex:'1 1 180px'}}>
                  <label style={{display:'block',color:T.hint,fontSize:10,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Officer (optional)</label>
                  <input style={{...FINP,fontSize:12}} value={newSlot.officer}
                    onChange={e=>setNewSlot(p=>({...p,officer:e.target.value}))} placeholder="Leave blank if unassigned"
                    onKeyDown={e=>e.key==='Enter'&&addSlot(band.key)}/>
                </div>
                <div style={{display:'flex',gap:6,paddingBottom:1}}>
                  <Btn size="sm" variant="ghost" onClick={()=>setAddingTo(null)}>Cancel</Btn>
                  <Btn size="sm" onClick={()=>addSlot(band.key)}>Add</Btn>
                </div>
              </div>
            )}

            {/* Table */}
            {band.slots.length === 0
              ? <div style={{background:T.card,border:`1px solid ${T.border}`,borderTop:'none',
                  borderRadius:'0 0 6px 6px',padding:'12px 14px',color:T.muted,fontSize:12,textAlign:'center'}}>
                  No slots — use + Add slot to add one
                </div>
              : <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',
                  border:`1px solid ${T.border}`,borderTop:'none',borderRadius:'0 0 6px 6px',overflow:'hidden'}}>
                  <thead>
                    <tr style={{background:'#0a1120'}}>
                      <th style={{width:80, padding:'5px 12px',textAlign:'left',fontSize:10,fontWeight:700,
                        color:T.hint,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${T.border}`}}>
                        Callsign
                      </th>
                      <th style={{padding:'5px 12px',textAlign:'left',fontSize:10,fontWeight:700,
                        color:T.hint,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${T.border}`}}>
                        Officer
                      </th>
                      <th style={{width:32,borderBottom:`1px solid ${T.border}`}}/>
                    </tr>
                  </thead>
                  <tbody>
                    {band.slots.map((s,i) => {
                      const isAssigned = s.officer && s.officer.trim();
                      const rowBg = i%2===0 ? '#090f1c' : '#0c1525';
                      return (
                        <tr key={s.id} style={{background:rowBg}}
                          onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.3)'}
                          onMouseLeave={e=>e.currentTarget.style.filter=''}>
                          <td style={{padding:'6px 12px',borderRight:`1px solid ${T.border}`,
                            fontFamily:'monospace',fontSize:12,color:T.accent,fontWeight:700}}>
                            POR {s.number}
                          </td>
                          <td style={{padding:'4px 8px',borderRight:`1px solid ${T.border}`}}>
                            {editing===s.id
                              ? <input autoFocus value={s.officer||''}
                                  onChange={e=>updateOfficer(s.id,e.target.value)}
                                  onBlur={()=>setEditing(null)}
                                  onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setEditing(null);}}
                                  style={{...BASE_INP,fontSize:12,background:'transparent'}}/>
                              : <div onClick={()=>setEditing(s.id)}
                                  style={{cursor:'pointer',fontSize:12,padding:'2px 4px',borderRadius:3,
                                    color:isAssigned?T.text:T.muted,
                                    fontStyle:isAssigned?'normal':'italic'}}>
                                  {isAssigned ? s.officer : 'Unassigned — click to assign'}
                                </div>
                            }
                          </td>
                          <td style={{padding:'4px 6px',textAlign:'center'}}>
                            <button onClick={()=>removeSlot(s.id)}
                              style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:12,lineHeight:1,padding:'2px'}}
                              onMouseEnter={e=>e.target.style.color=T.danger}
                              onMouseLeave={e=>e.target.style.color=T.muted}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            }
          </div>
        );
      })}
    </div>
  );
}
