'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';

const KEYS = ['HP', 'ATK', 'DEF', 'SPD', 'CRATE', 'CDMG', 'RES', 'ACC'] as const;

// RAID – słowniki
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

type Hero = {
  id: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  type: string | null;
  affinity: string | null;
  level: number | null;
  stars: number | null;
  asc: string | null;
  blessing: string | null;
  skills: unknown;
  // staty (mogą nie istnieć w tabeli – wtedy będą undefined)
  [key: string]: any;
};

type Gear = {
  id: string;
  hero_id: string;
  slot: string | null;
  set_key: string | null;
  rarity: string | null;
  stars: number | null;
  main_type: string | null;
  main_value: number | null;
};

type Substat = {
  id: string;
  gear_id: string;
  type: string | null;
  value: number | null;
};

export default function HeroPage() {
  const supa = createBrowserSupabaseClient();
  const params = useParams();
  const heroId = params?.id as string | undefined;

  const [hero, setHero] = useState<Hero | null>(null);
  const [gear, setGear] = useState<Gear[]>([]);
  const [subs, setSubs] = useState<Record<string, Substat[]>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!heroId) return;
    setLoading(true);

    const { data: heroData } = await supa
      .from('heroes')
      .select('*')
      .eq('id', heroId)
      .single<Hero>();

    setHero(heroData || null);

    const { data: gearRows } = await supa
      .from('gear')
      .select('*')
      .eq('hero_id', heroId);

    const gearList = (gearRows || []) as Gear[];
    setGear(gearList);

    if (gearList.length) {
      const ids = gearList.map((g) => g.id);
      const { data: subRows } = await supa
        .from('gear_substats')
        .select('*')
        .in('gear_id', ids);

      const by: Record<string, Substat[]> = {};
      (subRows || []).forEach((s: any) => {
        if (!by[s.gear_id]) by[s.gear_id] = [];
        by[s.gear_id].push(s as Substat);
      });
      setSubs(by);
    } else {
      setSubs({});
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroId]);

  const saveHero = async (patch: Partial<Hero>) => {
    if (!hero) return;
    const next = { ...hero, ...patch };
    setHero(next);
    await supa.from('heroes').update(patch).eq('id', hero.id);
  };

  const saveAllNow = async () => {
    if (!hero) return;
    setSavingAll(true);
    const { id, ...patch } = hero;
    await supa.from('heroes').update(patch).eq('id', id);
    setSavingAll(false);
  };

  const addGear = async () => {
    if (!hero) return;
    const { error } = await supa
      .from('gear')
      .insert({
        hero_id: hero.id,
        slot: 'Broń',
        rarity: 'Rare',
        stars: 0,
        main_type: 'ATK',
        main_value: 0,
      })
      .select()
      .single();

    if (!error) {
      await load();
    }
  };

  const statTotal = useMemo(() => {
    if (!hero) return null;

    const num = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const sum = {
      flat: { HP: 0, ATK: 0, DEF: 0, SPD: 0, RES: 0, ACC: 0 },
      pct: { HP: 0, ATK: 0, DEF: 0, CRATE: 0, CDMG: 0 },
    };

    const apply = (t: string | null | undefined, v: number | null | undefined) => {
      const T = (t || '').toUpperCase();
      const val = num(v);
      if (!val) return;

      if (T === 'HP') sum.flat.HP += val;
      else if (T === 'ATK') sum.flat.ATK += val;
      else if (T === 'DEF') sum.flat.DEF += val;
      else if (T === 'SPD') sum.flat.SPD += val;
      else if (T === 'RES') sum.flat.RES += val;
      else if (T === 'ACC') sum.flat.ACC += val;
      else if (T === 'HP%') sum.pct.HP += val;
      else if (T === 'ATK%') sum.pct.ATK += val;
      else if (T === 'DEF%') sum.pct.DEF += val;
      else if (T === 'CRATE%' || T === 'C.RATE%') sum.pct.CRATE += val;
      else if (T === 'CDMG%' || T === 'C.DMG%') sum.pct.CDMG += val;
    };

    gear.forEach((g) => {
      apply(g.main_type, g.main_value);
      (subs[g.id] || []).forEach((s) => apply(s.type, s.value));
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

    const T: Record<string, number> = {};
    T.HP = Math.round(
      base_hp + bonus_hp + sum.flat.HP + (base_hp * sum.pct.HP) / 100,
    );
    T.ATK = Math.round(
      base_atk + bonus_atk + sum.flat.ATK + (base_atk * sum.pct.ATK) / 100,
    );
    T.DEF = Math.round(
      base_def + bonus_def + sum.flat.DEF + (base_def * sum.pct.DEF) / 100,
    );
    T.SPD = base_spd + bonus_spd + sum.flat.SPD;
    T.RES = base_res + bonus_res + sum.flat.RES;
    T.ACC = base_acc + bonus_acc + sum.flat.ACC;
    T.CRATE = Math.min(100, base_crate + bonus_crate + sum.pct.CRATE);
    T.CDMG = base_cdmg + bonus_cdmg + sum.pct.CDMG;

    return { sum, T };
  }, [hero, gear, subs]);

  const numInput =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      const safe = Number.isFinite(v) ? v : 0;
      saveHero({ [key]: safe } as any);
    };

  const textInput =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      saveHero({ [key]: e.target.value } as any);
    };

  if (!heroId) {
    return (
      <main className="max-w-5xl mx-auto p-4">
        Brak ID bohatera w adresie.
      </main>
    );
  }

  if (loading || !hero) {
    return (
      <main className="max-w-5xl mx-auto p-4">
        <p className="text-sm text-gray-400">Ładowanie…</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Główna karta */}
      <div className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{hero.name}</h2>
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
          Większość pól zapisuje się automatycznie przy zmianie. Przycisk
          „Zapisz zmiany” wysyła całą kartę jeszcze raz do bazy.
        </p>

        <div className="grid md:grid-cols-3 gap-3">
          {/* Frakcja */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Frakcja</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={hero.faction || ''}
              onChange={(e) =>
                saveHero({ faction: e.target.value || null } as Partial<Hero>)
              }
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
              value={hero.rarity || ''}
              onChange={(e) =>
                saveHero({ rarity: e.target.value || null } as Partial<Hero>)
              }
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
              value={hero.type || ''}
              onChange={(e) =>
                saveHero({ type: e.target.value || null } as Partial<Hero>)
              }
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
              value={hero.affinity || ''}
              onChange={(e) =>
                saveHero({ affinity: e.target.value || null } as Partial<Hero>)
              }
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
              value={hero.level ?? 0}
              onChange={numInput('level')}
            />
          </div>

          {/* Gwiazdki */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Gwiazdki</label>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-transparent"
              value={hero.stars ?? ''}
              onChange={(e) =>
                saveHero({
                  stars: e.target.value ? Number(e.target.value) : null,
                } as Partial<Hero>)
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
              value={hero.asc || ''}
              onChange={textInput('asc')}
            />
          </div>

          {/* Blessing */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">Blessing</label>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={hero.blessing || ''}
              onChange={textInput('blessing')}
            />
          </div>
        </div>
      </div>

      {/* Statystyki */}
      <div className="border rounded-xl p-4 space-y-3">
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
                    value={Number(hero[baseKey] ?? 0)}
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
                    value={Number(hero[bonusKey] ?? 0)}
                    onChange={numInput(bonusKey)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Umiejętności */}
      <div className="border rounded-xl p-4 space-y-2">
        <h3 className="text-lg font-semibold">Umiejętności (JSON quick edit)</h3>
        <textarea
          className="border rounded-md px-2 py-1 text-sm w-full min-h-[120px] font-mono"
          value={JSON.stringify(hero.skills || [], null, 2)}
          onChange={(e) => {
            try {
              const v = JSON.parse(e.target.value);
              saveHero({ skills: v } as Partial<Hero>);
            } catch {
              // ignorujemy błędy – user może nadal pisać
            }
          }}
        />
      </div>

      {/* Ekwipunek */}
      <div className="border rounded-xl p-4 space-y-3">
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

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 px-2">Slot</th>
              <th className="text-left py-1 px-2">Set</th>
              <th className="text-left py-1 px-2">Rarity</th>
              <th className="text-left py-1 px-2">Gw</th>
              <th className="text-left py-1 px-2">Main</th>
              <th className="text-left py-1 px-2">Val</th>
              <th className="text-left py-1 px-2">Suby</th>
            </tr>
          </thead>
          <tbody>
            {gear.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="py-1 px-2">
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.slot || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { slot: e.target.value })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.set_key || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { set_key: e.target.value })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.rarity || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { rarity: e.target.value })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    type="number"
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.stars ?? 0}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, {
                        stars: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.main_type || ''}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, { main_type: e.target.value })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    type="number"
                    className="border rounded-md px-1 py-0.5 text-xs"
                    value={g.main_value ?? 0}
                    onChange={(e) =>
                      supabaseUpdate('gear', g.id, {
                        main_value: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td className="py-1 px-2">
                  <Substats
                    gearId={g.id}
                    items={subs[g.id] || []}
                    onChange={load}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kalkulator */}
      <div className="border rounded-xl p-4 space-y-2">
        <h3 className="text-lg font-semibold">Kalkulator (live)</h3>
        {statTotal ? (
          <div>
            <div className="grid md:grid-cols-3 gap-2 mb-2">
              {Object.entries(statTotal.T).map(([k, v]) => (
                <div key={k}>
                  <b>{k}</b>: {v}
                </div>
              ))}
            </div>
            <div className="text-xs opacity-80">
              z gearu — flat: HP {statTotal.sum.flat.HP}, ATK{' '}
              {statTotal.sum.flat.ATK}, DEF {statTotal.sum.flat.DEF}, SPD{' '}
              {statTotal.sum.flat.SPD}, RES {statTotal.sum.flat.RES}, ACC{' '}
              {statTotal.sum.flat.ACC} | %: HP {statTotal.sum.pct.HP}, ATK{' '}
              {statTotal.sum.pct.ATK}, DEF {statTotal.sum.pct.DEF}, C.RATE{' '}
              {statTotal.sum.pct.CRATE}, C.DMG {statTotal.sum.pct.CDMG}
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
  items: Substat[];
  onChange: () => void;
}) {
  const supa = createBrowserSupabaseClient();
  const [rows, setRows] = useState<Substat[]>(items);

  useEffect(() => setRows(items), [items]);

  const add = async () => {
    await supa.from('gear_substats').insert({
      gear_id: gearId,
      type: 'SPD',
      value: 0,
    });
    onChange();
  };

  const save = async (id: string, patch: Partial<Substat>) => {
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
            value={r.value ?? 0}
            onChange={(e) =>
              save(r.id, { value: Number(e.target.value) || 0 })
            }
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
