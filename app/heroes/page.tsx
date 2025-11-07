'use client';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Heroes(){
  const supa = createClient();
  const [rows,setRows] = useState<any[]>([]);
  const [name,setName] = useState('');
  const fetchAll = async ()=>{
    const { data } = await supa.from('heroes').select('*').order('created_at', { ascending: false });
    setRows(data||[]);
  };
  useEffect(()=>{fetchAll();},[]);

  const add = async ()=>{
    const { data, error } = await supa.from('heroes').insert({ name: name||'Nowy Bohater', rarity:'Rare', faction:'', type:'', affinity:'Magic' }).select().single();
    if (!error) { setName(''); fetchAll(); }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Bohaterowie</h2>
        <div className="flex">
          <input placeholder="Nazwa..." value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={add}>Dodaj</button>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Nazwa</th><th>Frakcja</th><th>Rzadkość</th><th>Poziom</th><th>Akcje</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.name}</td><td>{r.faction}</td><td>{r.rarity}</td><td>{r.level}</td>
                <td><Link href={`/heroes/${r.id}`}><button>Otwórz</button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
