'use client';
import { createClient } from '@/lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn(){
  const supa = createClient();
  const [email,setEmail] = useState('');
  const [pass,setPass] = useState('');
  const [status,setStatus] = useState('');
  const router = useRouter();

  const signIn = async ()=>{
    setStatus('...');
    const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
    if (error){ setStatus(error.message); } else { router.push('/heroes'); }
  };
  const signUp = async ()=>{
    setStatus('...');
    const { data, error } = await supa.auth.signUp({ email, password: pass });
    if (error){ setStatus(error.message); } else { setStatus('Sprawdź e-mail (link aktywacyjny)'); }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Logowanie</h2>
        <div className="grid grid-2">
          <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><label>Hasło</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} /></div>
        </div>
        <div className="flex" style={{marginTop:8}}>
          <button onClick={signIn}>Wejście</button>
          <button onClick={signUp}>Rejestracja</button>
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
