'use client';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

const KEYS = ['HP','ATK','DEF','SPD','CRATE','CDMG','RES','ACC'] as const;

export default function HeroCard(){
  const supa = createBrowserSupabaseClient()
  const { id } = useParams();
  const [h,setH] = useState<any>(null);
  const [gear,setGear] = useState<any[]>([]);
  const [subs,setSubs] = useState<Record<string,any[]>>({});
  const load = async ()=>{
    const { data: hero } = await supa.from('heroes').select('*').eq('id', id).single();
    setH(hero);
    const { data: gearRows } = await supa.from('gear').select('*').eq('hero_id', id);
    setGear(gearRows||[]);
    const ids = (gearRows||[]).map(g=>g.id);
    if (ids.length){
      const { data: subRows } = await supa.from('gear_substats').select('*').in('gear_id', ids);
      const by: Record<string,any[]> = {};
      (subRows||[]).forEach(s=>{ (by[s.gear_id] ||= []).push(s); });
      setSubs(by);
    } else {
      setSubs({});
    }
  };
  useEffect(()=>{load();},[id]);

  const saveHero = async (patch:any)=>{
    const next = { ...h, ...patch };
    setH(next);
    await supa.from('heroes').update(patch).eq('id', h.id);
  };

  const addGear = async ()=>{
    const { data, error } = await supa.from('gear').insert({ hero_id: h.id, slot: 'Broń', rarity:'Rare', stars:0, main_type:'ATK', main_value:0 }).select().single();
    if (!error) load();
  };

  const statTotal = useMemo(()=>{
    if (!h) return {};
    const sum = {flat:{HP:0,ATK:0,DEF:0,SPD:0,RES:0,ACC:0}, pct:{HP:0,ATK:0,DEF:0,CRATE:0,CDMG:0}};
    gear.forEach(g=>{
      const apply = (t:string, v:number)=>{
        const T = t.toUpperCase();
        if (T==='HP') sum.flat.HP += v;
        else if (T==='ATK') sum.flat.ATK += v;
        else if (T==='DEF') sum.flat.DEF += v;
        else if (T==='SPD') sum.flat.SPD += v;
        else if (T==='RES') sum.flat.RES += v;
        else if (T==='ACC') sum.flat.ACC += v;
        else if (T==='HP%') sum.pct.HP += v;
        else if (T==='ATK%') sum.pct.ATK += v;
        else if (T==='DEF%') sum.pct.DEF += v;
        else if (T==='CRATE%'||T==='C.RATE%') sum.pct.CRATE += v;
        else if (T==='CDMG%'||T==='C.DMG%') sum.pct.CDMG += v;
      };
      apply(g.main_type||'', Number(g.main_value||0));
      (subs[g.id]||[]).forEach(s=> apply(s.type||'', Number(s.value||0)));
    });
    const T:any = {};
    T.HP   = Math.round(h.base_hp + h.bonus_hp + sum.flat.HP + h.base_hp * (sum.pct.HP||0)/100);
    T.ATK  = Math.round(h.base_atk + h.bonus_atk + sum.flat.ATK + h.base_atk * (sum.pct.ATK||0)/100);
    T.DEF  = Math.round(h.base_def + h.bonus_def + sum.flat.DEF + h.base_def * (sum.pct.DEF||0)/100);
    T.SPD  = (h.base_spd + h.bonus_spd + sum.flat.SPD);
    T.RES  = (h.base_res + h.bonus_res + sum.flat.RES);
    T.ACC  = (h.base_acc + h.bonus_acc + sum.flat.ACC);
    T.CRATE = Math.min(100, h.base_crate + h.bonus_crate + (sum.pct.CRATE||0));
    T.CDMG  = (h.base_cdmg + h.bonus_cdmg + (sum.pct.CDMG||0));
    return {sum, T};
  }, [h,gear,subs]);

  if (!h) return <div className="container"><div className="card">Ładowanie…</div></div>;
  return (
    <div className="container">
      <div className="card">
        <h2>{h.name}</h2>
        <div className="grid grid-3">
          <div><label>Frakcja</label><input value={h.faction||''} onChange={e=>saveHero({faction:e.target.value})}/></div>
          <div><label>Rzadkość</label><input value={h.rarity||''} onChange={e=>saveHero({rarity:e.target.value})}/></div>
          <div><label>Typ</label><input value={h.type||''} onChange={e=>saveHero({type:e.target.value})}/></div>
          <div><label>Affinity</label><input value={h.affinity||''} onChange={e=>saveHero({affinity:e.target.value})}/></div>
          <div><label>Poziom</label><input type="number" value={h.level||0} onChange={e=>saveHero({level:Number(e.target.value)||0})}/></div>
          <div><label>Gwiazdki</label><input value={h.stars||''} onChange={e=>saveHero({stars:e.target.value})}/></div>
          <div><label>Asc</label><input value={h.asc||''} onChange={e=>saveHero({asc:e.target.value})}/></div>
          <div><label>Blessing</label><input value={h.blessing||''} onChange={e=>saveHero({blessing:e.target.value})}/></div>
        </div>
      </div>

      <div className="card">
        <h3>Statystyki</h3>
        <div className="grid grid-3">
          {KEYS.map(k=>{
            const key = k.toLowerCase(); const baseKey = 'base_'+key; const bonusKey = 'bonus_'+key;
            return (
              <div key={k} className="grid">
                <div><label>Bazowe {k}</label><input type="number" value={h[baseKey]||0} onChange={e=>saveHero({[baseKey]:Number(e.target.value)||0})}/></div>
                <div><label>Bonus {k}{(k==='CRATE'||k==='CDMG')?' (%)':''}</label><input type="number" value={h[bonusKey]||0} onChange={e=>saveHero({[bonusKey]:Number(e.target.value)||0})}/></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3>Umiejętności (JSON quick edit)</h3>
        <textarea rows={6} value={JSON.stringify(h.skills||[],null,2)} onChange={e=>{
          try{ const v = JSON.parse(e.target.value); saveHero({skills:v}); }catch{}
        }} />
      </div>

      <div className="card">
        <h3>Ekwipunek</h3>
        <button onClick={addGear}>+ Dodaj item</button>
        <table className="table">
          <thead><tr><th>Slot</th><th>Set</th><th>Rarity</th><th>Gw</th><th>Main</th><th>Val</th><th>Suby</th></tr></thead>
          <tbody>
            {gear.map(g=>(
              <tr key={g.id}>
                <td><input value={g.slot||''} onChange={e=>supabaseUpdate('gear', g.id, {slot:e.target.value})}/></td>
                <td><input value={g.set_key||''} onChange={e=>supabaseUpdate('gear', g.id, {set_key:e.target.value})}/></td>
                <td><input value={g.rarity||''} onChange={e=>supabaseUpdate('gear', g.id, {rarity:e.target.value})}/></td>
                <td><input type="number" value={g.stars||0} onChange={e=>supabaseUpdate('gear', g.id, {stars:Number(e.target.value)||0})}/></td>
                <td><input value={g.main_type||''} onChange={e=>supabaseUpdate('gear', g.id, {main_type:e.target.value})}/></td>
                <td><input type="number" value={g.main_value||0} onChange={e=>supabaseUpdate('gear', g.id, {main_value:Number(e.target.value)||0})}/></td>
                <td>
                  <Substats gearId={g.id} items={subs[g.id]||[]} onChange={()=>load()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Kalkulator (live)</h3>
        {statTotal && (
          <div>
            <div className="grid grid-3">
              {Object.entries(statTotal.T).map(([k,v])=>(
                <div key={k}><b>{k}</b>: {String(v)}</div>
              ))}
            </div>
            <div style={{opacity:.8,marginTop:8}}>
              <small>z gearu — flat: HP {statTotal.sum.flat.HP}, ATK {statTotal.sum.flat.ATK}, DEF {statTotal.sum.flat.DEF}, SPD {statTotal.sum.flat.SPD}, RES {statTotal.sum.flat.RES}, ACC {statTotal.sum.flat.ACC} | %: HP {statTotal.sum.pct.HP}, ATK {statTotal.sum.pct.ATK}, DEF {statTotal.sum.pct.DEF}, C.RATE {statTotal.sum.pct.CRATE}, C.DMG {statTotal.sum.pct.CDMG}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Substats({gearId, items, onChange}:{gearId:string, items:any[], onChange:()=>void}){
  const supa = createClient();
  const [rows,setRows] = useState<any[]>(items);
  useEffect(()=>setRows(items),[items]);
  const add = async ()=>{
    await supa.from('gear_substats').insert({ gear_id: gearId, type:'SPD', value:0 });
    onChange();
  };
  const save = async (id:string, patch:any)=>{
    await supa.from('gear_substats').update(patch).eq('id', id);
    onChange();
  };
  const remove = async (id:string)=>{
    await supa.from('gear_substats').delete().eq('id', id);
    onChange();
  };
  return (
    <div>
      {rows.map(r=>(
        <div key={r.id} className="flex" style={{marginBottom:4}}>
          <input value={r.type||''} onChange={e=>save(r.id,{type:e.target.value})}/>
          <input type="number" value={r.value||0} onChange={e=>save(r.id,{value:Number(e.target.value)||0})}/>
          <button onClick={()=>remove(r.id)}>x</button>
        </div>
      ))}
      <button onClick={add}>+ substat</button>
    </div>
  );
}

async function supabaseUpdate(table:string, id:string, patch:any){
  const supa = createClient();
  await supa.from(table).update(patch).eq('id', id);
}
