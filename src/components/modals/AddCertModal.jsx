// src/components/modals/AddCertModal.jsx
import { useState } from 'react';
import { Modal, FRow, Btn, FINP } from '../ui.jsx';
import { genId } from '../../lib/utils.js';

export function AddCertModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [full, setFull] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ id: genId(), name: name.trim(), fullName: full.trim() || name.trim(), order: 9999 });
    onClose();
  };

  return (
    <Modal title="Add Certification Column" onClose={onClose} width={340}>
      <FRow label="Short Name (header)">
        <input style={FINP} value={name} onChange={e => setName(e.target.value)}
          autoFocus onKeyDown={e => e.key === 'Enter' && submit()}/>
      </FRow>
      <FRow label="Full Name (tooltip)">
        <input style={FINP} value={full} onChange={e => setFull(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}/>
      </FRow>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={submit}>Add</Btn>
      </div>
    </Modal>
  );
}
