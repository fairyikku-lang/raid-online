'use client';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home(){
  const supa = createClient();
  const [user,setUser] = useState<any>(null);
  useEffect(()=>{supa.auth.getUser().then(r=>setUser(r.data.user));},[]);
  return (
    <div className="container">
      <div className="card">
        <h1>RAID Online v1</h1>
        <p>Wspólna baza Raid: logowanie, bohaterowie, gear.</p>
        {!user ? (
          <div className="flex">
            <Link href="/signin"><button>Zaloguj</button></Link>
          </div>
        ) : (
          <div className="flex">
            <Link href="/heroes"><button>Przejdź do bohaterów</button></Link>
            <button onClick={()=>supa.auth.signOut().then(()=>location.reload())}>Wyloguj</button>
          </div>
        )}
      </div>
    </div>
  );
}
