// src/lib/utils.js
export const genId     = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const melbToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' });
export const daysSince = d  => { if (!d) return null; const v = Math.floor((new Date(melbToday()) - new Date(d)) / 86400000); return isNaN(v) ? null : v; };
export const daysUntil = d  => { if (!d) return null; const v = Math.floor((new Date(d) - new Date(melbToday())) / 86400000); return isNaN(v) ? null : v; };
export const addDays   = (d, n) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
export const fmtShort  = d  => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';

export const RANKS = [
  'Superintendent','Onions Burger','Acting Inspector','Senior Sergeant','Acting Senior Sergeant',
  'Sergeant','Acting Sergeant','Leading Senior Constable','Acting LSC',
  'Special Constable','Senior Constable','First Constable','Constable',
  'Probationary Constable','Recruit',
];
export const RANK_ORDER = Object.fromEntries(RANKS.map((r, i) => [r, i]));

export const RANK_META = {
  'Superintendent':           { tier:'gold',   bg:'#7c2d12', fg:'#fed7aa' },
  'Onions Burger':            { tier:'gold',   bg:'#7c2d12', fg:'#fed7aa' },
  'Acting Inspector':         { tier:'gold',   bg:'#92400e', fg:'#fef3c7' },
  'Senior Sergeant':          { tier:'gold',   bg:'#78350f', fg:'#fef9c3' },
  'Acting Senior Sergeant':   { tier:'gold',   bg:'#92400e', fg:'#fde68a' },
  'Sergeant':                 { tier:'gold',   bg:'#1e3a8a', fg:'#bfdbfe' },
  'Acting Sergeant':          { tier:'gold',   bg:'#1e40af', fg:'#dbeafe' },
  'Leading Senior Constable': { tier:'gold',   bg:'#14532d', fg:'#bbf7d0' },
  'Acting LSC':               { tier:'gold',   bg:'#166534', fg:'#d1fae5' },
  'Special Constable':        { tier:'purple', bg:'#4c1d95', fg:'#f5d0fe' },
  'Senior Constable':         { tier:'silver', bg:'#1e3a5f', fg:'#bfdbfe' },
  'First Constable':          { tier:'silver', bg:'#1e3a5f', fg:'#93c5fd' },
  'Constable':                { tier:'bronze', bg:'#44403c', fg:'#d6d3d1' },
  'Probationary Constable':   { tier:'bronze', bg:'#57534e', fg:'#fbbf24' },
  'Recruit':                  { tier:'bronze', bg:'#292524', fg:'#a8a29e' },
};

export const TIER_ROW = {
  gold:   { even:'#1c1508', odd:'#231c0a' },
  purple: { even:'#180d2e', odd:'#1e1038' },
  silver: { even:'#090f1c', odd:'#0c1525' },
  bronze: { even:'#141210', odd:'#1a1714' },
};

export function promoColor(rank, days) {
  if (days === null) return '#5a7a9a';
  const always = ['Superintendent','Onions Burger','Acting Inspector','Senior Sergeant',
    'Acting Senior Sergeant','Sergeant','Acting Sergeant','Leading Senior Constable',
    'Acting LSC','Special Constable','Senior Constable'];
  if (always.includes(rank))            return '#22c55e';
  if (rank === 'First Constable')        return days <= 30 ? '#22c55e' : '#ef4444';
  if (rank === 'Constable')              return days <= 24 ? '#22c55e' : days <= 30 ? '#fbbf24' : '#ef4444';
  if (rank === 'Probationary Constable') return days <= 13 ? '#22c55e' : days <= 20 ? '#fbbf24' : '#ef4444';
  if (rank === 'Recruit')                return days <= 19 ? '#22c55e' : days <= 30 ? '#fbbf24' : '#ef4444';
  return '#22c55e';
}

export const CV_OPTS  = ['','N','Y','TL','2IC','TO','SFTO','FPO','TP','OPs'];
export const PORT_OPTS= ['','N','Y','TL','2IC','TO','OPs','FPO','TP'];
export const CV_META  = {
  '':    { label:'—',    bg:'transparent', fg:'#475569' },
  'N':   { label:'N',    bg:'transparent', fg:'#475569' },
  'Y':   { label:'Y',    bg:'#14532d',     fg:'#bbf7d0' },
  'TL':  { label:'TL',   bg:'#78350f',     fg:'#fef9c3' },
  '2IC': { label:'2IC',  bg:'#4c1d95',     fg:'#ede9fe' },
  'TO':  { label:'TO',   bg:'#0e4f60',     fg:'#a5f3fc' },
  'SFTO':{ label:'SFTO', bg:'#1e3a8a',     fg:'#bfdbfe' },
  'FPO': { label:'FPO',  bg:'#3b1f6e',     fg:'#d8b4fe' },
  'TP':  { label:'TP',   bg:'#4a2323',     fg:'#fca5a5' },
  'OPs': { label:'OPs',  bg:'#164e63',     fg:'#a5f3fc' },
};
export const HW_OPTS = ['','No','1 month','2 month','Exemption'];
export const HW_META = {
  '':         { label:'—',      color:'#475569' },
  'No':       { label:'No',     color:'#22c55e' },
  '1 month':  { label:'1 mo',   color:'#fbbf24' },
  '2 month':  { label:'2 mo',   color:'#fb923c' },
  'Exemption':{ label:'Exempt', color:'#a78bfa' },
};
export const LIC_META = {
  'Gold':  { bg:'#78350f', fg:'#fef9c3' },
  'Silver':{ bg:'#334155', fg:'#e2e8f0' },
  'Bronze':{ bg:'#431407', fg:'#fdba74' },
};
export const BOOL_OPTS = [
  { value:'',      label:'—'  },
  { value:'TRUE',  label:'Yes'},
  { value:'FALSE', label:'No' },
];
export const FTO_LEVELS = [
  'FTO Senior Leadership/Command','FTO Leader','FTO Supervisor','Senior FTO','FTO'
];
export const FTO_DIV = ['GD','HWY','CIRT','Special'];

export const T = {
  bg:'#07090f', nav:'#0b0f1a', card:'#0f1525',
  border:'#17243a', borderMid:'#1e3050',
  accent:'#3b82f6', text:'#d8e4f0', muted:'#3d526e', hint:'#5a7a9a',
  danger:'#ef4444', success:'#22c55e',
};
export const BASE_INP = {
  background:'#06090f', border:`1px solid ${T.accent}`, borderRadius:3,
  color:T.text, padding:'2px 6px', fontSize:13, width:'100%',
  outline:'none', boxSizing:'border-box',
};
export const FINP = {
  background:'#06090f', border:`1px solid ${T.border}`, borderRadius:4,
  color:T.text, padding:'6px 9px', fontSize:13, width:'100%',
  boxSizing:'border-box', outline:'none',
};
export const FSEL = { ...FINP };
