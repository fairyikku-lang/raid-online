// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signin');
        return;
      }
      setEmail(user.email ?? null);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div style={{ padding: 24 }}>Ładowanie…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Witaj {email ?? ''} 👋</h1>
      <p>Jesteś zalogowany. To jest bezpieczny widok po stronie klienta.</p>
      <button
        onClick={async () => { await supabase.auth.signOut(); router.replace('/signin'); }}
        style={{ marginTop: 12 }}
      >
        Wyloguj
      </button>
    </div>
  );
}
