
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';

type Hero = {
  id: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  level: number | null;
  created_at: string;
};

export default function HeroesPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [name, setName] = useState('');
  const [faction, setFaction] = useState('');
  const [rarity, setRarity] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeroes = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd pobierania bohaterów:', error);
      setError('Nie udało się pobrać listy bohaterów.');
      setHeroes([]);
    } else {
      setHeroes((data || []) as Hero[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHeroes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !faction.trim() || !rarity.trim() || !level.trim()) {
      alert('Uzupełnij wszystkie pola przed dodaniem bohatera.');
      return;
    }

    const parsedLevel = parseInt(level, 10);
    if (Number.isNaN(parsedLevel) || parsedLevel <= 0) {
      alert('Poziom musi być dodatnią liczbą.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error } = await supabase.from('heroes').insert({
      name: name.trim(),
      faction: faction.trim(),
      rarity: rarity.trim(),
      level: parsedLevel,
    });

    if (error) {
      console.error('Błąd dodawania bohatera:', error);
      setError('Nie udało się dodać bohatera.');
    } else {
      setName('');
      setFaction('');
      setRarity('');
      setLevel('');
      await fetchHeroes();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno chcesz usunąć tego bohatera?')) return;

    setError(null);

    const { error } = await supabase.from('heroes').delete().eq('id', id);

    if (error) {
      console.error('Błąd usuwania bohatera:', error);
      setError('Nie udało się usunąć bohatera.');
    } else {
      setHeroes((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const goToManage = (id: string) => {
    router.push(`/heroes/${id}`);
  };

  const goToView = (id: string) => {
    router.push(`/heroes/${id}/view`);
  };

  return (
    <main className="hero-page max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-amber-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
            Bohaterowie
          </h1>
          <p className="text-sm text-slate-200/70">
            Zarządzaj bohaterami – dodawaj, przeglądaj i usuwaj dane.
          </p>
        </div>
      </header>

      <section className="hero-card space-y-3">
        <h2 className="section-title">Dodaj bohatera</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="field-label">Nazwa</label>
            <input
              className="field-input"
              placeholder="Kael, Trunda..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="field-label">Frakcja</label>
            <input
              className="field-input"
              placeholder="Dark Elves"
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="field-label">Rzadkość</label>
            <input
              className="field-input"
              placeholder="Rare, Epic, Legendary"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="field-label">Poziom</label>
            <input
              className="field-input"
              placeholder="60"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-forge w-full"
            >
              {saving ? 'Zapisywanie…' : 'Dodaj'}
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </section>

      <section className="hero-card space-y-3">
        <h2 className="section-title">Lista bohaterów</h2>

        {loading ? (
          <p className="text-sm text-slate-200/70">Ładowanie bohaterów…</p>
        ) : heroes.length === 0 ? (
          <p className="text-sm text-slate-200/70">
            Nie masz jeszcze żadnych bohaterów. Dodaj pierwszego 🙂
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse hero-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Frakcja</th>
                  <th>Rzadkość</th>
                  <th>Poziom</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr key={hero.id}>
                    <td>{hero.name}</td>
                    <td>{hero.faction || '—'}</td>
                    <td>{hero.rarity || '—'}</td>
                    <td>{hero.level ?? '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => goToView(hero.id)}
                          className="btn-ghost"
                        >
                          Podgląd
                        </button>
                        <button
                          type="button"
                          onClick={() => goToManage(hero.id)}
                          className="btn-ghost"
                        >
                          Zarządzaj
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(hero.id)}
                          className="btn-danger"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
