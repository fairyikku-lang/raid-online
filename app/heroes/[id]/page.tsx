
'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';

const KEYS = ['HP', 'ATK', 'DEF', 'SPD', 'CRATE', 'CDMG', 'RES', 'ACC'] as const;

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

const BLESSINGS = [
  'Brimstone',
  'Cruelty',
  'Crushing Rend',
  'Faultless Defense',
  'Heavenly Equal',
  'Hero’s Soul',
  'Intimidating Presence',
  'Iron Will',
  'Lightning Cage',
  'Life Harvest',
  'Miracle Heal',
  'Phantom Touch',
  'Polymorph',
  'Smite',
  'Soul Reap',
  'Temporal Chains',
  'Ward of the Fallen',
  'Commanding Presence',
  'Incinerate',
  'Overwhelming Strength',
  'Hero’s Heart',
  'Carapace',
  'Chainbreaker',
];

type Hero = {
  id: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  type: string | null;
  affinity: string | null;
  level: number | null;
  stars: number | null;
  asc: number | null;
  blessing: string | null;
  blessing_level: number | null;
  skills: unknown;
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

export default function HeroEditPage() {
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
      <main className="hero-page max-w-5xl mx-auto p-4">
        Brak ID bohatera w adresie.
      </main>
    );
  }

  if (loading || !hero) {
    return (
      <main className="hero-page max-w-5xl mx-auto p-4">
        <p className="text-sm text-slate-200/70">Ładowanie…</p>
      </main>
    );
  }

  return (
    <main className="hero-page max-w-6xl mx-auto p-6 space-y-6">
      <div className="hero-grid">
        {/* Portret */}
        <aside className="hero-portrait">
          <div className="hero-portrait-inner">
            <div className="hero-portrait-frame">
              <div className="hero-portrait-placeholder">
                {hero.name?.slice(0, 2) || '?'}
              </div>
            </div>
          </div>
        </aside>

        {/* Dane główne */}
        <section className="hero-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="hero-name">{hero.name}</h1>
            <button
              type="button"
              onClick={saveAllNow}
              disabled={savingAll}
              className="btn-forge"
            >
              {savingAll ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
          </div>
          <p className="hero-subtitle">
            {hero.faction || 'Brak frakcji'} • {hero.rarity || 'Brak rzadkości'}
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Frakcja */}
            <div className="field-group">
              <label className="field-label">Frakcja</label>
              <select
                className="field-input bg-transparent"
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
            <div className="field-group">
              <label className="field-label">Rzadkość</label>
              <select
                className="field-input bg-transparent"
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
            <div className="field-group">
              <label className="field-label">Typ (Rola)</label>
              <select
                className="field-input bg-transparent"
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
            <div className="field-group">
              <label className="field-label">Affinity</label>
              <select
                className="field-input bg-transparent"
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
            <div className="field-group">
              <label className="field-label">Poziom</label>
              <input
                type="number"
                className="field-input"
                value={hero.level ?? 0}
                onChange={numInput('level')}
              />
            </div>

            {/* Gwiazdki */}
            <div className="field-group">
              <label className="field-label">Gwiazdki</label>
              <select
                className="field-input bg-transparent"
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
            <div className="field-group">
              <label className="field-label">Asc (Awans)</label>
              <select
                className="field-input bg-transparent"
                value={hero.asc ?? ''}
                onChange={(e) =>
                  saveHero({
                    asc: e.target.value ? Number(e.target.value) : null,
                  } as Partial<Hero>)
                }
              >
                <option value="">—</option>
                {STARS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Blessing */}
      <section className="hero-card space-y-3">
        <h2 className="section-title">Blessing</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="field-group">
            <label className="field-label">Rodzaj Blessingu</label>
            <select
              className="field-input bg-transparent"
              value={hero.blessing || ''}
              onChange={(e) =>
                saveHero({ blessing: e.target.value || null } as Partial<Hero>)
              }
            >
              <option value="">—</option>
              {BLESSINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Poziom Blessingu</label>
            <select
              className="field-input bg-transparent"
              value={hero.blessing_level ?? ''}
              onChange={(e) =>
                saveHero({
                  blessing_level: e.target.value ? Number(e.target.value) : null,
                } as Partial<Hero>)
              }
            >
              <option value="">—</option>
              {STARS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Statystyki */}
      <section className="hero-card space-y-3">
        <h2 className="section-title">Statystyki</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {KEYS.map((k) => {
            const key = k.toLowerCase();
            const baseKey = `base_${key}`;
            const bonusKey = `bonus_${key}`;
            const isPct = k === 'CRATE' || k === 'CDMG';

            return (
              <div key={k} className="flex flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <label className="field-label">Bazowe {k}</label>
                    <input
                      type="number"
                      className="field-input w-full"
                      value={Number(hero[baseKey] ?? 0)}
                      onChange={numInput(baseKey)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="field-label">
                      Bonus {k}
                      {isPct ? ' (%)' : ''}
                    </label>
                    <input
                      type="number"
                      className="field-input w-full"
                      value={Number(hero[bonusKey] ?? 0)}
                      onChange={numInput(bonusKey)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blessing + Umiejętności */}
      <section className="hero-card space-y-3">
        <h2 className="section-title">Umiejętności (JSON quick edit)</h2>
        <textarea
          className="field-input font-mono min-h-[140px]"
          value={JSON.stringify(hero.skills || [], null, 2)}
          onChange={(e) => {
            try {
              const v = JSON.parse(e.target.value);
              saveHero({ skills: v } as Partial<Hero>);
            } catch {
              // ignorujemy błędy parsowania
            }
          }}
        />
      </section>

      {/* Ekwipunek */}
      <section className="hero-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Ekwipunek</h2>
          <button
            type="button"
            onClick={addGear}
            className="btn-forge"
          >
            + Dodaj item
          </button>
        </div>

        {gear.length === 0 ? (
          <p className="text-sm text-slate-200/70">
            Ten bohater nie ma jeszcze żadnego ekwipunku.
          </p>
        ) : (
          <table className="w-full text-sm border-collapse hero-table">
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
                      className="field-input text-xs"
                      value={g.slot || ''}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, { slot: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="field-input text-xs"
                      value={g.set_key || ''}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, { set_key: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="field-input text-xs"
                      value={g.rarity || ''}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, { rarity: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="field-input text-xs"
                      value={g.stars ?? 0}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, {
                          stars: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="field-input text-xs"
                      value={g.main_type || ''}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, { main_type: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="field-input text-xs"
                      value={g.main_value ?? 0}
                      onChange={(e) =>
                        supabaseUpdate('gear', g.id, {
                          main_value: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td>
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
        )}
      </section>

      {/* Kalkulator */}
      <section className="hero-card space-y-3">
        <h2 className="section-title">Kalkulator (live)</h2>
        {statTotal ? (
          <div>
            <div className="grid md:grid-cols-3 gap-2 mb-2">
              {Object.entries(statTotal.T).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="font-semibold text-amber-200">{k}:</span>
                  <span>{v}</span>
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
          <p className="text-sm text-slate-200/70">
            Uzupełnij statystyki bohatera, aby zobaczyć wynik.
          </p>
        )}
      </section>
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
            className="field-input text-xs"
            value={r.type || ''}
            onChange={(e) => save(r.id, { type: e.target.value })}
          />
          <input
            type="number"
            className="field-input text-xs"
            value={r.value ?? 0}
            onChange={(e) =>
              save(r.id, { value: Number(e.target.value) || 0 })
            }
          />
          <button
            type="button"
            className="btn-danger text-[10px] px-2"
            onClick={() => remove(r.id)}
          >
            x
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost text-[11px] px-2"
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
