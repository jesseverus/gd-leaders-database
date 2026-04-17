// src/components/LoginScreen.jsx
import { useState } from 'react';
import { T, FINP, Btn, FRow } from './ui.jsx';

export function LoginScreen({ onLogin, authPw, appName }) {
  const [pw,  setPw]  = useState('');
  const [err, setErr] = useState('');
  const go = () => { if (pw === authPw) onLogin(); else setErr('Incorrect access code.'); };
  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:36,width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{width:50,height:50,background:'#1e3a8a',borderRadius:'50%',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div style={{fontWeight:800,fontSize:16,letterSpacing:'0.08em',color:T.text}}>{appName}</div>
        <div style={{color:T.muted,fontSize:11,marginBottom:22}}>RESTRICTED ACCESS</div>
        <FRow label="Access Code">
          <input type="password" value={pw} placeholder="••••••••" style={FINP}
            onChange={e => { setPw(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && go()}/>
        </FRow>
        {err && <p style={{color:T.danger,fontSize:12,margin:'0 0 10px',textAlign:'left'}}>{err}</p>}
        <Btn onClick={go} style={{width:'100%',marginTop:4}}>AUTHENTICATE</Btn>
      </div>
    </div>
  );
}
