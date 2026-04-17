// src/components/modals/AddOfficerModal.jsx
import { useState } from 'react';
import { Modal, FRow, Btn, FINP, FSEL } from '../ui.jsx';
import { RANKS, genId, melbToday } from '../../lib/utils.js';

export function AddOfficerModal({ onClose, onAdd, certs }) {
  const today = melbToday();
  const [f, setF] = useState({
    steamName:'', fullName:'', callsign:'-', rank:'Recruit',
    licenseClass:'Bronze', divisionJoinDate:today, lastPromotionDate:today,
    rankRestriction:'', onLeave:'FALSE',
  });
  const [err, setErr] = useState('');
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    // Steam name is now optional
    const cv = {};
    certs.forEach(c => { cv[c.id] = ''; });
    onAdd({
      ...f,
      id: genId(),
      steamName: f.steamName.trim(),
      fullName: f.fullName.trim(),
      callsign: f.callsign || '-',
      certValues: cv,
      hoursWarning: '',
      date30Hours: '',
      lastRpMisconduct: '',
      expectedReturn: '',
      daysOnLeave: 'FALSE',
    });
  };

  return (
    <Modal title="Add New Officer" onClose={onClose} width={500}>
      {err && <p style={{ color:'#ef4444', fontSize:12, marginBottom:8 }}>{err}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FRow label="Steam Name (optional)">
          <input style={FINP} value={f.steamName} onChange={upd('steamName')} autoFocus/>
        </FRow>
        <FRow label="Full Name (RP)">
          <input style={FINP} value={f.fullName} onChange={upd('fullName')}/>
        </FRow>
        <FRow label="Callsign">
          <input style={FINP} value={f.callsign} onChange={upd('callsign')}/>
        </FRow>
        <FRow label="License Class">
          <select style={FSEL} value={f.licenseClass} onChange={upd('licenseClass')}>
            {['Gold','Silver','Bronze'].map(v => <option key={v}>{v}</option>)}
          </select>
        </FRow>
        <FRow label="Rank">
          <select style={FSEL} value={f.rank} onChange={upd('rank')}>
            {RANKS.map(r => <option key={r}>{r}</option>)}
          </select>
        </FRow>
        <FRow label="Division Join Date">
          <input style={FINP} type="date" value={f.divisionJoinDate} onChange={upd('divisionJoinDate')}/>
        </FRow>
        <FRow label="Last Promotion Date">
          <input style={FINP} type="date" value={f.lastPromotionDate} onChange={upd('lastPromotionDate')}/>
        </FRow>
        <FRow label="Rank Restriction">
          <input style={FINP} value={f.rankRestriction} onChange={upd('rankRestriction')}/>
        </FRow>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={submit}>Add Officer</Btn>
      </div>
    </Modal>
  );
}
