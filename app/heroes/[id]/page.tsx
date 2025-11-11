'use client';

import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

const KEYS = ['HP', 'ATK', 'DEF', 'SPD', 'CRATE', 'CDMG', 'RES', 'ACC'] as const;

// RAID – aktualne słowniki
const FACTIONS = [
  'Banner Lords',
  'High Elves',
  'The Sacred Order',
  'Barbarians',
  'Ogryn Tribes',
  'Lizardmen',
  'Skinwalkers',
  'Orcs',
  'Demonspawn',
  'Undead Hordes',
  'Dark Elves',
  'Knight Revenant',
  'Dwarves',
  'Shadowkin',
  'Sylvan Watchers',
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'];

const ROLES = ['Attack', 'Defense', 'HP', 'Support'];

const AFFINITIES = ['Magic', 'Spirit', 'Force', 'Void'];

const STARS = [1, 2, 3, 4, 5, 6];

export default function HeroCard() {
  const supa = createBrowserSupabaseClient();
  const { id } = useParams();

  const [h, setH] = useState<any | null>(null);
  const [gear, setGear] = useState<any[]>([]);
  const [subs, setSubs] = useState<Record<string, any[]>>({});
  const [savingAll, setSavingAll] = useState(false);

  const load = async () => {
    if (!id) return;

    const { data: hero } = await supa.from('heroes').select('*').eq('id', id).single();
    setH(hero);

    const { data: gearRows } = await supa.from('gear').select('*').eq('hero_id', id);
    const list = gearRows || [];
    setGear(list);

    const ids = list.map((g) => g.id);
    if (ids.length) {
      const { data: subRows } = await supa
        .from('gear_substats')
        .select('*')
        .in('gear_id', ids);

      const by: Record<string, any[]> = {};
      (subRows || []).forEach((s) => {
        (by[s.gear_id] ||= []).push(s);
      });
      setSubs(by);
    } else {
      setSubs({});
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveHero = async (patch: any) => {
    if (!h) return;
    const next = { ...h, ...patch };
    setH(next);
    await supa.from('heroes').update(patch).eq('id', h.id);
  };

  const saveAllNow = async () => {
    if (!h) return;
    setSavingAll(true);
    const { id: heroId, ...patch } = h;
    await supa.from('heroes').update(patch).eq('id', heroId);
    setSavingAll(false);
  };

  const addGear = async () => {
    if (!h) return;
    const { error } = await supa
      .from('gear')
      .insert({
        hero_id: h.id,
        slot: 'Broń',
        rarity: 'Rare',
        stars: 0,
        main_type: 'ATK',
        main_value: 0,
      })
      .select()
      .single();

    if (!error) load();
  };

  const statTotal = useMemo(() => {
    if (!h) return null;
    const hero: any = h;

    const num = (v: any) => Number(v ?? 0);

    const sum = {
      flat: { HP: 0, ATK: 0, DEF: 0, SPD: 0, RES: 0, ACC: 0 },
      pct: { HP: 0, ATK: 0, DEF: 0, CRATE: 0, CDMG: 0 },
    };

    gear.forEach((g) => {
      const apply = (t: string, v: number) => {
        const T = (t || '').toUpperCase();
        if (T === 'HP') sum.flat.HP += v;
        else if (T === 'ATK') sum.flat.ATK += v;
        else if (T === 'DEF') sum.flat.DEF += v;
        else if (T === 'SPD') sum.flat.SPD += v;
        else if (T === 'RES') sum.flat.RES += v;
        else if (T === 'ACC') sum.flat.ACC += v;
        else if (T === 'HP%') sum.pct.HP += v;
        else if (T === 'ATK%') sum.pct.ATK += v;
        else if (T === 'DEF%') sum.pct.DEF += v;
        else if (T === 'CRATE%' || T === 'C.RATE%') sum.pct.CRATE += v;
        else if (T === 'CDMG%' || T === 'C.DMG%') sum.pct.CDMG += v;
      };

      apply(g.main_type || '', Number(g.main_value || 0));
      (subs[g.id] || []).forEach((s) => apply(s.type || '', Number(s.value || 0)));
    });

    const base_hp = num(hero.base_hp);
    const base_atk = num(hero.base_atk);
    const base_def = num(hero.base_def);
    const base_spd = num(hero.base_spd);
    const base_res = num(hero.base_res);
    const base_acc = num(hero.base_acc);
    const base_crate = num(hero.base_crate);
    const base_cdmg = num(hero.base_cdmg);

    const bonus_hp = num(hero.bonus_hp);
    const bonus_atk = num(hero.bonus_atk);
    const bonus_def = num(hero.bonus_def);
    const bonus_spd = num(hero.bonus_spd);
    const bonus_res = num(hero.bonus_res);
    const bonus_acc = num(hero.bonus_acc);
    const bonus_crate = num(hero.bonus_crate);
    const bonus_cdmg = num(hero.bonus_cdmg);

    const T: any = {};
    T.HP = Math.round(
      base_hp + bonus_hp + sum.flat.HP + base_hp * (sum.pct.HP || 0) / 100,
    );
    T.ATK = Math.round(
      base_atk + bonus_atk + sum.flat.ATK + base_atk * (sum.pct.ATK || 0) / 100,
    );
    T.DEF = Math.round(
      base_def + bonus_def + sum.flat.DEF + base_def * (sum.pct.DEF || 0) / 100,
    );
    T.SPD = base_spd + bonus_spd + sum.flat.SPD;
    T.RES = base_res + bonus_res + sum.flat.RES;
    T.ACC = base_acc + bonus_acc + sum.flat.ACC;
    T.CRATE = Math.min(100, base_crate + bonus_crate + (sum.pct.CRATE || 0));
    T.CDMG = base_cdmg + bonus_cdmg + (sum.pct.CDMG || 0);

    return { sum, T };
  }, [h, gear, subs]);

  if (!h) {
    return (
      <main className="max-w-5xl mx-auto p-4">
        <p className="text-sm text-gray-400">Ładowanie…</p>
      </main>
    );
  }

  const numInput =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value) || 0;
      saveHero({ [key]: v });
    };

  const textInput =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      saveHero({ [key]: e.target.value });
    };

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Główna karta bohatera */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{h.name}</h2>
          <button
            type="button"
            onClick={saveAllNow}
            disabled={savingAll}
            className="border rounded-md px-3 py-1 text-sm font-medium disabled:opacity-60"
          >
            {savingAll ? 'Zapisywanie…' : 'Zapisz zmiany'}
          </button>
        </div>

        <p className="text-xs opacity-70">
          Uwaga: większość pól zapisuje się automatycznie przy zmianie. Przycisk
          „Zapisz zmiany” wysyła całą kartę jeszcze raz do bazy.
        </p>

        {/* Podstawowe pola */}
        <div className="grid md:grid-cols-3 gap-3">
          {/* Frakcja */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Frakcja</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={h.faction || ''}
              onChange={(e) => saveHero({ faction: e.target.value || null })}
            >
              <option value="">—</option>
              {FACTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Rzadkość */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Rzadkość</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={h.rarity || ''}
              onChange={(e) => saveHero({ rarity: e.target.value || null })}
            >
              <option value="">—</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Typ / rola */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Typ (Rola)</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={h.type || ''}
              onChange={(e) => saveHero({ type: e.target.value || null })}
            >
              <option value="">—</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Affinity */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Affinity</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={h.affinity || ''}
              onChange={(e) => saveHero({ affinity: e.target.value || null })}
            >
              <option value="">—</option>
              {AFFINITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Poziom */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Poziom</label>
            <input
              type="number"
              className="border rounded-md px-2 py-1 text-sm"
              value={h.level ?? 0}
              onChange={numInput('level')}
            />
          </div>

          {/* Gwiazdki */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Gwiazdki</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={h.stars ?? ''}
              onChange={(e) =>
                saveHero({ stars: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">—</option>
              {STARS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Asc */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Asc</label>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={h.asc || ''}
              onChange={textInput('asc')}
            />
          </div>

          {/* Blessing */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Blessing</label>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={h.blessing || ''}
              onChange={textInput('blessing')}
            />
          </div>
        </div>
      </div>

      {/* Statystyki – bazowe vs bonusowe obok siebie */}
      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Statystyki</h3>
        <div className="space-y-3">
          {KEYS.map((k) => {
            const key = k.toLowerCase();
            const baseKey = `base_${key}`;
            const bonusKey = `bonus_${key}`;
            const isPct = k === 'CRATE' || k === 'CDMG';

            return (
              <div key={k} className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase opacity-70">
                    Bazowe {k}
                  </label>
                  <input
                    type="number"
                    className="border rounded-md px-2 py-1 text-sm"
                    value={Number((h as any)[baseKey] ?? 0)}
                    onChange={numInput(baseKey)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase opacity-70">
                    Bonus {k}
                    {isPct ? ' (%)' : ''}
                  </label>
                  <input
                    type="number"
                    className="border rounded-md px-2 py-1 text-sm"
                    value={Number((h as any)[bonusKey] ?? 0)}
                    onChange={numInput(bonusKey)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Umiejętności */}
      <div className="card space-y-2">
        <h3 className="text-lg font-semibold">Umiejętności (JSON quick edit)</h3>
        <textarea
          className="border rounded-md px-2 py-1 text-sm w-full min-h-[120px] font-mono"
          value={JSON.stringify(h.skills || [], null, 2)}
          onChange={(e) => {
            try {
              const v = JSON.parse(e.target.value);
              saveHero({ skills: v });
            } catch {
              // ignoruj błędy parsowania – użytkownik może jeszcze pisać
            }
          }}
        />
      </div>

      {/* Ekwipunek */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ekwipunek</h3>
          <button
            type="button"
            onClick={addGear}
            className="border rounded-md px-3 py-1 text-sm"
          >
            + Dodaj item
          </button>
        </div>

        <table className="table w-full text-sm">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Set</th>
              <th>Rarity</th>
              <th>Gw</th>
              <th>Main</th>
              <th>Val</th>
              <th>Suby</th>
            </tr>
          </thead>
          <tbody>
            {gear.map((g) => (
              <tr key={g.id}>
                <td>
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.slot || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { slot: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.set_key || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { set_key: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.rarity || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { rarity: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.stars || 0}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, {
                        stars: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.main_type || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { main_type: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.main_value || 0}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, {
                        main_value: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td>
                  <Substats gearId={g.id} items={subs[g.id] || []} onChange={load} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kalkulator */}
      <div className="card space-y-2">
        <h3 className="text-lg font-semibold">Kalkulator (live)</h3>
        {statTotal ? (
          <div>
            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(statTotal.T).map(([k, v]) => (
                <div key={k}>
                  <b>{k}</b>: {String(v)}
                </div>
              ))}
            </div>
            <div style={{ opacity: 0.8, marginTop: 8 }}>
              <small>
                z gearu — flat: HP {statTotal.sum.flat.HP}, ATK{' '}
                {statTotal.sum.flat.ATK}, DEF {statTotal.sum.flat.DEF}, SPD{' '}
                {statTotal.sum.flat.SPD}, RES {statTotal.sum.flat.RES}, ACC{' '}
                {statTotal.sum.flat.ACC} | %: HP {statTotal.sum.pct.HP}, ATK{' '}
                {statTotal.sum.pct.ATK}, DEF {statTotal.sum.pct.DEF}, C.RATE{' '}
                {statTotal.sum.pct.CRATE}, C.DMG {statTotal.sum.pct.CDMG}
              </small>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Uzupełnij statystyki bohatera, aby zobaczyć wynik.
          </p>
        )}
      </div>
    </main>
  );
}

function Substats({
  gearId,
  items,
  onChange,
}: {
  gearId: string;
  items: any[];
  onChange: () => void;
}) {
  const supa = createBrowserSupabaseClient();
  const [rows, setRows] = useState<any[]>(items);

  useEffect(() => setRows(items), [items]);

  const add = async () => {
    await supa.from('gear_substats').insert({
      gear_id: gearId,
      type: 'SPD',
      value: 0,
    });
    onChange();
  };

  const save = async (id: string, patch: any) => {
    await supa.from('gear_substats').update(patch).eq('id', id);
    onChange();
  };

  const remove = async (id: string) => {
    await supa.from('gear_substats').delete().eq('id', id);
    onChange();
  };

  return (
    <div>
      {rows.map((r) => (
        <div key={r.id} className="flex gap-1 mb-1">
          <input
            className="border rounded-md px-1 py-0.5 text-xs"
            value={r.type || ''}
            onChange={(e) => save(r.id, { type: e.target.value })}
          />
          <input
            type="number"
            className="border rounded-md px-1 py-0.5 text-xs"
            value={r.value || 0}
            onChange={(e) => save(r.id, { value: Number(e.target.value) || 0 })}
          />
          <button
            type="button"
            className="border rounded-md px-2 py-0.5 text-xs"
            onClick={() => remove(r.id)}
          >
            x
          </button>
        </div>
      ))}
      <button
        type="button"
        className="border rounded-md px-2 py-0.5 text-xs"
        onClick={add}
      >
        + substat
      </button>
    </div>
  );
}

async function supabaseUpdate(table: string, id: string, patch: any) {
  const supa = createBrowserSupabaseClient();
  await supa.from(table).update(patch).eq('id', id);
}
