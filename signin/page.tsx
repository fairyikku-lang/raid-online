// app/signin/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        shouldCreateUser: false, // tylko istniejący użytkownicy
      },
    });

    setSending(false);

    if (error) setErr(error.message);
    else {
      setMsg(`Wysłaliśmy link logowania na: ${email}`);
      setEmail('');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
      <h1>Logowanie bez hasła</h1>
      <p>Podaj e-mail — wyślemy link logowania.</p>

      <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
        <input
          type="email"
          value={email}
          required
          placeholder="twoj@email.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '10px',
            width: '80%',
            borderRadius: 8,
            border: '1px solid #333',
          }}
        />
        <br />
        <button
          type="submit"
          disabled={sending}
          style={{
            marginTop: 15,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#0070f3',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {sending ? 'Wysyłanie...' : 'Wyślij link'}
        </button>
      </form>

      {msg && <p style={{ color: '#22c55e', marginTop: 15 }}>{msg}</p>}
      {err && <p style={{ color: '#ef4444', marginTop: 15 }}>{err}</p>}
    </div>
  );
}
