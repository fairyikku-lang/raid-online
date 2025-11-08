'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle')

  const sendLink = async () => {
    setStatus('idle')
    const supabase = createClientBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    setStatus(error ? 'err' : 'ok')
  }

  return (
    <div style={{maxWidth:560,margin:'80px auto',textAlign:'center'}}>
      <h1>Logowanie bez hasła</h1>
      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
        placeholder="twoj@email.com"
        style={{width:'100%',padding:12,margin:'12px 0'}}
      />
      <button onClick={sendLink}>Wyślij link</button>
      {status==='ok' && <p>Sprawdź e-maila – wysłaliśmy link ✉️</p>}
      {status==='err' && <p>Nie udało się wysłać linku.</p>}
    </div>
  )
}
