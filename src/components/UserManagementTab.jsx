// src/components/UserManagementTab.jsx
import { useState } from 'react';
import { T, Btn, FRow, FINP, FSEL } from './ui.jsx';

export function UserManagementTab({ auth }) {
  const { users, createUser, updateUser, setActive, session } = auth;
  const [showAdd,   setShowAdd]   = useState(false);
  const [editUser,  setEditUser]  = useState(null); // user being edited
  const [form,      setForm]      = useState({ username:'', pin:'', displayName:'', role:'user' });
  const [editForm,  setEditForm]  = useState({});
  const [err,       setErr]       = useState('');
  const [msg,       setMsg]       = useState('');

  const flash = (m, isErr=false) => {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setErr(''); setMsg(''); }, 3000);
  };

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const updE = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.username.trim()) { flash('Username required.', true); return; }
    if (!form.pin.trim() || form.pin.length < 4) { flash('PIN must be at least 4 digits.', true); return; }
    if (!form.displayName.trim()) { flash('Display name required.', true); return; }
    const result = await createUser(form);
    if (!result.ok) { flash(result.error, true); return; }
    flash(`User "${form.displayName}" created.`);
    setForm({ username:'', pin:'', displayName:'', role:'user' });
    setShowAdd(false);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    const changes = {};
    if (editForm.displayName?.trim()) changes.display_name = editForm.displayName.trim();
    if (editForm.role)                changes.role         = editForm.role;
    if (editForm.pin?.trim())         changes.pin          = editForm.pin.trim();
    const result = await updateUser(editUser.id, changes);
    if (!result.ok) { flash(result.error, true); return; }
    flash('User updated.');
    setEditUser(null);
  };

  const handleRevoke = async (u) => {
    if (!window.confirm(`Revoke access for "${u.display_name}"?\n\nThey will not be able to log in, but their audit trail will be preserved.`)) return;
    await setActive(u.id, false);
    flash(`Access revoked for ${u.display_name}.`);
  };

  const handleRestore = async (u) => {
    await setActive(u.id, true);
    flash(`Access restored for ${u.display_name}.`);
  };

  return (
    <div style={{padding:'10px 14px',overflowY:'auto',maxHeight:'calc(100vh - 102px)'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:13,color:T.hint}}>
          User Management · {users.filter(u=>u.is_active).length} active of {users.length} users
        </div>
        <Btn size="sm" variant="success" onClick={()=>{setShowAdd(p=>!p);setErr('');}}>
          + Add User
        </Btn>
      </div>

      {/* Feedback */}
      {msg && <div style={{background:'#14532d',border:'1px solid #166534',borderRadius:5,
        padding:'7px 12px',fontSize:12,color:'#bbf7d0',marginBottom:10}}>{msg}</div>}
      {err && <div style={{background:'#7f1d1d',border:'1px solid #991b1b',borderRadius:5,
        padding:'7px 12px',fontSize:12,color:'#fca5a5',marginBottom:10}}>{err}</div>}

      {/* Add user form */}
      {showAdd && (
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,
          padding:16,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.hint,marginBottom:12,
            textTransform:'uppercase',letterSpacing:'0.06em'}}>New User</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <FRow label="Username">
              <input style={FINP} value={form.username} onChange={upd('username')}
                placeholder="lowercase, no spaces" autoFocus/>
            </FRow>
            <FRow label="Display Name">
              <input style={FINP} value={form.displayName} onChange={upd('displayName')}
                placeholder="Mike Simple"/>
            </FRow>
            <FRow label="PIN (min 4 digits)">
              <input type="password" style={FINP} value={form.pin} onChange={upd('pin')}
                placeholder="••••"/>
            </FRow>
            <FRow label="Role">
              <select style={FSEL} value={form.role} onChange={upd('role')}>
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </FRow>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <Btn size="sm" variant="ghost" onClick={()=>{setShowAdd(false);setErr('');}}>Cancel</Btn>
            <Btn size="sm" onClick={handleCreate}>Create User</Btn>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:10000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={()=>setEditUser(null)}>
          <div style={{background:'#0f1a2e',border:`1px solid ${T.borderMid}`,borderRadius:10,
            width:'100%',maxWidth:400,overflow:'hidden'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border}`,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{color:T.text,fontWeight:700}}>Edit — {editUser.display_name}</div>
              <button onClick={()=>setEditUser(null)}
                style={{background:'none',border:'none',color:T.muted,fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{padding:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <FRow label="Display Name">
                  <input style={FINP} defaultValue={editUser.display_name}
                    onChange={updE('displayName')} placeholder={editUser.display_name}/>
                </FRow>
                <FRow label="Role">
                  <select style={FSEL} defaultValue={editUser.role} onChange={updE('role')}>
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </FRow>
                <FRow label="New PIN (leave blank to keep)">
                  <input type="password" style={FINP} onChange={updE('pin')} placeholder="••••"/>
                </FRow>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <Btn size="sm" variant="ghost" onClick={()=>setEditUser(null)}>Cancel</Btn>
                <Btn size="sm" onClick={handleUpdate}>Save Changes</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User list */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {users.map(u => (
          <div key={u.id} style={{background:u.is_active?'#090f1c':'#0a0a0a',
            border:`1px solid ${u.is_active?T.border:'#1f2937'}`,
            borderRadius:7,padding:'10px 14px',
            display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',
            opacity:u.is_active?1:0.6}}>

            {/* Avatar */}
            <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,
              background:u.role==='admin'?'#1e3a8a':'#1e3050',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:u.role==='admin'?'#bfdbfe':'#93c5fd',
                fontSize:11,fontWeight:800}}>
                {(u.display_name||u.username).slice(0,2).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{color:T.text,fontWeight:700,fontSize:13}}>
                  {u.display_name}
                </span>
                <span style={{color:T.muted,fontSize:11}}>@{u.username}</span>
                <span style={{
                  background:u.role==='admin'?'#1e3a8a':'#1e3050',
                  color:u.role==='admin'?'#bfdbfe':'#93c5fd',
                  borderRadius:3,padding:'1px 6px',fontSize:9,fontWeight:700}}>
                  {u.role.toUpperCase()}
                </span>
                {!u.is_active && (
                  <span style={{background:'#7f1d1d',color:'#fca5a5',
                    borderRadius:3,padding:'1px 6px',fontSize:9,fontWeight:700}}>
                    REVOKED
                  </span>
                )}
                {u.id === session?.userId && (
                  <span style={{background:'#14532d',color:'#bbf7d0',
                    borderRadius:3,padding:'1px 6px',fontSize:9,fontWeight:700}}>
                    YOU
                  </span>
                )}
              </div>
              <div style={{color:T.muted,fontSize:10,marginTop:2}}>
                Created {new Date(u.created_at).toLocaleDateString('en-AU')}
                {u.created_by && ` by ${u.created_by}`}
              </div>
            </div>

            {/* Edit always available; Revoke/Restore blocked for own account */}
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>{ setEditUser(u); setEditForm({}); }}
                style={{background:'none',border:`1px solid ${T.border}`,borderRadius:4,
                  color:T.hint,fontSize:11,padding:'4px 10px',cursor:'pointer'}}>
                Edit
              </button>
              {u.id !== session?.userId && (u.is_active
                ? <button onClick={()=>handleRevoke(u)}
                    style={{background:'none',border:'1px solid #7f1d1d',borderRadius:4,
                      color:'#ef4444',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>
                    Revoke
                  </button>
                : <button onClick={()=>handleRestore(u)}
                    style={{background:'none',border:'1px solid #14532d',borderRadius:4,
                      color:'#22c55e',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>
                    Restore
                  </button>
              )}
            </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
