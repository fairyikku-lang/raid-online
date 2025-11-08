// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) setErr(error.message);
      else router.replace('/');
    };
    run();
  }, [router]);

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
      <h1>Logowanie...</h1>
      {err ? (
        <p style={{ color: '#ef4444' }}>Błąd logowania: {err}</p>
      ) : (
        <p>Trwa potwierdzanie sesji. Chwilka...</p>
      )}
    </div>
  );
}
