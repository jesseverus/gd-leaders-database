// src/components/ui.jsx
// Reusable UI atoms used across all tab components.

import { useRef, useEffect, useState } from 'react';
import { T, BASE_INP, FINP, FSEL, CV_META, fmtShort } from '../lib/utils.js';

export function Btn({ children, variant='primary', size='md', onClick, style:s={}, disabled=false, title='' }) {
  const vs = {
    primary:{ background:T.accent,    color:'#fff',    border:'none' },
    danger: { background:T.danger,    color:'#fff',    border:'none' },
    ghost:  { background:'transparent', color:T.hint,  border:`1px solid ${T.border}` },
    success:{ background:'#15803d',   color:'#fff',    border:'none' },
    warn:   { background:'#92400e',   color:'#fef3c7', border:'none' },
  };
  const ss = { sm:{ padding:'3px 9px', fontSize:11 }, md:{ padding:'5px 13px', fontSize:12 } };
  return <button title={title} onClick={onClick} disabled={disabled}
    style={{borderRadius:5,cursor:disabled?'not-allowed':'pointer',fontWeight:600,opacity:disabled?0.5:1,whiteSpace:'nowrap',...vs[variant],...ss[size],...s}}>{children}</button>;
}

export function Modal({ title, onClose, children, width=480 }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:16,overflowY:'auto'}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,width:'100%',maxWidth:width,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 16px',borderBottom:`1px solid ${T.border}`,position:'sticky',top:0,background:T.card,zIndex:1}}>
          <span style={{color:T.text,fontSize:13,fontWeight:700}}>{title}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:T.hint,fontSize:20,cursor:'pointer',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:16}}>{children}</div>
      </div>
    </div>
  );
}

export function FRow({ label, children }) {
  return (
    <div style={{marginBottom:10}}>
      <label style={{display:'block',color:T.hint,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{label}</label>
      {children}
    </div>
  );
}

export function TxtCell({ value, isActive, onActivate, onChange, onDone, align='left', mono=false, placeholder='' }) {
  const ref = useRef(null);
  // Buffer the typed value locally — only save (onChange) when user blurs or presses Enter/Tab
  const [local, setLocal] = useState(value || '');
  useEffect(() => { if (isActive) { setLocal(value || ''); if (ref.current) { ref.current.focus(); ref.current.select(); } } }, [isActive]);
  const commit = () => { onChange(local); onDone(); };
  if (isActive) return <input ref={ref} value={local} placeholder={placeholder}
    onChange={e => setLocal(e.target.value)}
    onBlur={commit}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(); } e.stopPropagation(); }}
    style={{...BASE_INP, fontFamily:mono?'monospace':'inherit', textAlign:align}}/>;
  return <div onClick={onActivate} style={{cursor:'pointer',height:'100%',display:'flex',alignItems:'center',padding:'2px 5px',justifyContent:align==='center'?'center':'flex-start',minHeight:26}}>
    <span style={{fontSize:mono?12:13,fontFamily:mono?'monospace':'inherit',color:value?T.text:T.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value || ''}</span>
  </div>;
}

export function DropCell({ value, options, isActive, onActivate, onDone, children }) {
  const ref = useRef(null);
  useEffect(() => { if (isActive && ref.current) ref.current.focus(); }, [isActive]);
  if (isActive) return <select ref={ref} value={value} autoFocus onChange={e => onDone(e.target.value)} onBlur={() => onDone(value)} style={{...BASE_INP,padding:'1px 2px',fontSize:12}}>
    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>;
  return <div onClick={onActivate} style={{cursor:'pointer',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'1px 3px',minHeight:26}}>{children}</div>;
}

export function DateCell({ value, isActive, onActivate, onDone, display }) {
  const ref = useRef(null);
  const [local, setLocal] = useState(value || '');
  useEffect(() => {
    if (isActive) {
      setLocal(value || '');
      if (ref.current) ref.current.focus();
    }
  }, [isActive]);
  const commit = () => { onDone(local || value || ''); };
  const cancel = () => { onDone(value || ''); }; // dismiss without saving
  if (isActive) return (
    <div style={{display:'flex',alignItems:'center',gap:3,padding:'1px 2px'}}>
      <input ref={ref} type="date" value={local}
        onChange={e => setLocal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          e.stopPropagation();
        }}
        style={{...BASE_INP,padding:'1px 2px',fontSize:11,flex:1}}/>
      <button onClick={commit}
        style={{background:'#14532d',border:'none',borderRadius:3,color:'#bbf7d0',
          fontSize:9,padding:'2px 5px',cursor:'pointer',fontWeight:700,flexShrink:0,lineHeight:1.4}}>
        OK
      </button>
      <button onClick={cancel}
        style={{background:'none',border:'none',color:'#3d526e',fontSize:12,
          cursor:'pointer',lineHeight:1,flexShrink:0,padding:'1px'}}>×</button>
    </div>
  );
  return <div onClick={onActivate} style={{cursor:'pointer',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'1px 3px',minHeight:26}}>
    {display ?? <span style={{fontSize:12,color:value?T.hint:T.muted}}>{fmtShort(value)||'—'}</span>}
  </div>;
}

export function CvBadge({ val }) {
  const m = CV_META[val] || CV_META[''];
  if (!val || val === 'N') return <span style={{color:T.muted,fontSize:10}}>N</span>;
  return <span style={{background:m.bg,color:m.fg,borderRadius:2,padding:'0 4px',fontSize:10,fontWeight:700}}>{m.label}</span>;
}

export function RankBadge({ rank, small=false }) {
  const m = { Superintendent:{bg:'#7c2d12',fg:'#fed7aa'}, 'Onions Burger':{bg:'#7c2d12',fg:'#fed7aa'}, 'Acting Inspector':{bg:'#92400e',fg:'#fef3c7'}, 'Senior Sergeant':{bg:'#78350f',fg:'#fef9c3'}, 'Acting Senior Sergeant':{bg:'#92400e',fg:'#fde68a'}, Sergeant:{bg:'#1e3a8a',fg:'#bfdbfe'}, 'Acting Sergeant':{bg:'#1e40af',fg:'#dbeafe'}, 'Leading Senior Constable':{bg:'#14532d',fg:'#bbf7d0'}, 'Acting LSC':{bg:'#166534',fg:'#d1fae5'}, 'Special Constable':{bg:'#4c1d95',fg:'#f5d0fe'}, 'Senior Constable':{bg:'#1e3a5f',fg:'#bfdbfe'}, 'First Constable':{bg:'#1e3a5f',fg:'#93c5fd'}, Constable:{bg:'#44403c',fg:'#d6d3d1'}, 'Probationary Constable':{bg:'#57534e',fg:'#fbbf24'}, Recruit:{bg:'#292524',fg:'#a8a29e'} }[rank] || {bg:'#374151',fg:'#d1d5db'};
  return <span style={{background:m.bg,color:m.fg,borderRadius:3,padding:small?'1px 5px':'2px 8px',fontSize:small?9:10,fontWeight:700,whiteSpace:'nowrap',letterSpacing:'0.05em'}}>{rank}</span>;
}

// Re-export these so components can import from one place
export { T, FINP, FSEL, BASE_INP };
