'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';
import Image from 'next/image';

const KEYS = ['HP', 'ATK', 'DEF', 'SPD', 'CRATE', 'CDMG', 'RES', 'ACC'] as const;
const CALC_ORDER = ['HP', 'ATK', 'DEF', 'SPD', 'RES', 'ACC', 'CRATE', 'CDMG'] as const;

const STAT_ICONS: Record<string, { src: string; alt: string }> = {
  HP: { src: '/icons/stat-hp.png', alt: 'HP' },
  ATK: { src: '/icons/stat-atk.png', alt: 'Atak' },
  DEF: { src: '/icons/stat-def.png', alt: 'Obrona' },
  SPD: { src: '/icons/stat-spd.png', alt: 'Prędkość' },
  RES: { src: '/icons/stat-res.png', alt: 'Resist' },
  ACC: { src: '/icons/stat-acc.png', alt: 'Accuracy' },
  CRATE: { src: '/icons/stat-crate.png', alt: 'Crit Rate' },
  CDMG: { src: '/icons/stat-cdmg.png', alt: 'Crit Damage' },
};

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
  skills?: unknown;
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

export default function HeroViewPage() {
  const supa = createBrowserSupabaseClient();
  const params = useParams();
  const router = useRouter();
  const heroId = params?.id as string | undefined;

  const [hero, setHero] = useState<Hero | null>(null);
  const [gear, setGear] = useState<Gear[]>([]);
  const [subs, setSubs] = useState<Record<string, Substat[]>>({});
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

  const skillsEmpty =
    !hero.skills ||
    (Array.isArray(hero.skills) && hero.skills.length === 0) ||
    (typeof hero.skills === 'string' && hero.skills.trim() === '');

  return (
    <main className="hero-page max-w-6xl mx-auto p-6 space-y-6">
      <button
        type="button"
        onClick={() => router.push('/heroes')}
        className="btn-ghost mb-2"
      >
        ← Powrót
      </button>

      {/* GÓRNY PANEL: portret + [dane bohatera + umiejętności] */}
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

        {/* Karta bohatera: lewa część dane, prawa umiejętności */}
        <section className="hero-card">
          <div className="flex gap-10 items-start">
            {/* Dane bohatera – kolumna lewa */}
            <div className="flex-1 min-w-[320px] space-y-3">
              <h1 className="hero-name">{hero.name}</h1>
              <p className="hero-subtitle">
                {hero.faction || 'Brak frakcji'} • {hero.rarity || 'Brak rzadkości'}
              </p>
              <div className="grid md:grid-cols-2 gap-2 text-sm mt-2">
                <div>
                  Affinity:{' '}
                  <span className="text-amber-200">{hero.affinity || '—'}</span>
                </div>
                <div>
                  Typ:{' '}
                  <span className="text-amber-200">{hero.type || '—'}</span>
                </div>
                <div>
                  Poziom:{' '}
                  <span className="text-amber-200">{hero.level ?? '—'}</span>
                </div>
                <div>
                  Gwiazdki:{' '}
                  <span className="text-amber-200">{hero.stars ?? '—'}</span>
                </div>
                <div>
                  Asc:{' '}
                  <span className="text-amber-200">{hero.asc ?? '—'}</span>
                </div>
                <div>
                  Blessing:{' '}
                  <span className="text-amber-200">
                    {hero.blessing || '—'}{' '}
                    {hero.blessing_level ? `(lvl ${hero.blessing_level})` : ''}
                  </span>
                </div>
              </div>
            </div>

             {/* Umiejętności – kolumna prawa */}
            <div className="w-[42%] min-w-[280px]">
              <div className="border border-slate-700/60 rounded-xl px-4 py-3 bg-slate-900/40 shadow-[0_0_18px_rgba(0,0,0,0.45)]">
                <h2 className="text-[0.75rem] font-semibold tracking-[0.18em] uppercase text-amber-200 mb-3">
                  Umiejętności
                </h2>

                {skillsEmpty ? (
                  <p className="text-xs text-slate-200/70 italic leading-relaxed">
                    Brak zdefiniowanych umiejętności dla tego bohatera.
                  </p>
                ) : (
                  <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-100 max-h-56 overflow-y-auto">
                    {JSON.stringify(hero.skills, null, 2)}
                  </pre>
                )}
              </div>
            </div>
        </section>
      </div>

      {/* STATYSTYKI + KALKULATOR + EKWIPUNEK */}
      <section className="hero-card space-y-3 mt-2">
        <h2 className="section-title">Statystyki</h2>

        <div className="hero-stats-columns mt-3 text-sm">
          {/* BAZOWE */}
          <div>
            <h3 className="font-semibold text-amber-200 tracking-[0.18em] uppercase text-xs mb-3">
              Bazowe statystyki
            </h3>

            <div className="space-y-2.5">
              {KEYS.map((k) => {
                const key = k.toLowerCase();
                const baseKey = `base_${key}`;
                const isPct = k === 'CRATE' || k === 'CDMG';
                const val = Number(hero[baseKey] ?? 0);
                const iconInfo = STAT_ICONS[k];

                return (
                  <div
                    key={`base-${k}`}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2 text-[0.85rem]">
                      {iconInfo && (
                        <Image
                          src={iconInfo.src}
                          alt={iconInfo.alt}
                          width={18}
                          height={18}
                          className="opacity-90"
                        />
                      )}
                      <span>Bazowe {k}</span>
                    </div>
                    <span className="font-semibold text-[0.9rem]">
                      {val}
                      {isPct ? ' %' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BONUSOWE */}
          <div>
            <h3 className="font-semibold text-amber-200 tracking-[0.18em] uppercase text-xs mb-3">
              Bonusowe statystyki
            </h3>

            <div className="space-y-2.5">
              {KEYS.map((k) => {
                const key = k.toLowerCase();
                const bonusKey = `bonus_${key}`;
                const isPct = k === 'CRATE' || k === 'CDMG';
                const val = Number(hero[bonusKey] ?? 0);
                const iconInfo = STAT_ICONS[k];

                return (
                  <div
                    key={`bonus-${k}`}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2 text-[0.85rem]">
                      {iconInfo && (
                        <Image
                          src={iconInfo.src}
                          alt={iconInfo.alt}
                          width={18}
                          height={18}
                          className="opacity-90"
                        />
                      )}
                      <span>
                        Bonus {k}
                        {isPct ? ' (%)' : ''}
                      </span>
                    </div>
                    <span className="font-semibold text-[0.9rem]">
                      {val}
                      {isPct ? ' %' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KALKULATOR (LIVE) */}
          <div>
            <h3 className="font-semibold text-amber-200 tracking-[0.18em] uppercase text-xs mb-3">
              Kalkulator (live)
            </h3>

            {statTotal ? (
              <div className="space-y-2 text-[0.85rem]">
                {CALC_ORDER.map((k) => {
                  const value = statTotal.T[k];
                  const isPct = k === 'CRATE' || k === 'CDMG';
                  return (
                    <div
                      key={`calc-${k}`}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-200/90">{k}</span>
                      <span className="font-semibold">
                        {value}
                        {isPct ? ' %' : ''}
                      </span>
                    </div>
                  );
                })}
                <div className="text-[0.7rem] text-slate-200/70 pt-2">
                  z gearu — flat: HP {statTotal.sum.flat.HP}, ATK{' '}
                  {statTotal.sum.flat.ATK}, DEF {statTotal.sum.flat.DEF}, SPD{' '}
                  {statTotal.sum.flat.SPD}, RES {statTotal.sum.flat.RES}, ACC{' '}
                  {statTotal.sum.flat.ACC} | %: HP {statTotal.sum.pct.HP}, ATK{' '}
                  {statTotal.sum.pct.ATK}, DEF {statTotal.sum.pct.DEF}, C.RATE{' '}
                  {statTotal.sum.pct.CRATE}, C.DMG {statTotal.sum.pct.CDMG}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-200/70">
                Uzupełnij statystyki bohatera, aby zobaczyć wynik.
              </p>
            )}
          </div>

          {/* EKWIPUNEK */}
          <div>
            <h3 className="font-semibold text-amber-200 tracking-[0.18em] uppercase text-xs mb-3">
              Ekwipunek
            </h3>

            {gear.length === 0 ? (
              <p className="text-xs text-slate-200/70">
                Ten bohater nie ma jeszcze żadnego ekwipunku.
              </p>
            ) : (
              <div className="space-y-2 text-[0.8rem]">
                {gear.map((g) => {
                  const subList = (subs[g.id] || [])
                    .map((s) => `${s.type || '—'} ${s.value ?? ''}`)
                    .join(', ');

                  return (
                    <div
                      key={g.id}
                      className="border border-slate-700/40 rounded-lg px-2 py-1.5 bg-slate-900/40"
                    >
                      <div className="font-semibold text-amber-100 text-xs">
                        {g.slot || 'Slot'} • {g.set_key || 'Set'}{' '}
                        {g.stars ? `• ${g.stars}★` : ''}{' '}
                        {g.rarity ? `• ${g.rarity}` : ''}
                      </div>
                      <div className="text-[0.75rem]">
                        Main: {g.main_type || '—'} {g.main_value ?? ''}
                      </div>
                      {subList && (
                        <div className="text-[0.7rem] text-slate-200/70">
                          Suby: {subList}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
