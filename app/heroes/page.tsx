'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
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
    // supabase z helpera jest stabilne w trakcie życia komponentu – nie daję go w depsach
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
      // wyczyść formularz i odśwież listę
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

  const goToEdit = (id: string) => {
    router.push(`/heroes/edit/${id}`);
  };

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bohaterowie</h1>
        {/* Tu możesz później dodać filtr, sortowanie itd. */}
      </header>

      <section className="border rounded-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">Dodaj bohatera</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Nazwa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Frakcja"
            value={faction}
            onChange={(e) => setFaction(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Rzadkość (np. Rare/Epic/Legendary)"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Poziom (np. 60)"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="border rounded-md px-3 py-1 text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Zapisywanie...' : 'Dodaj'}
          </button>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </section>

      <section className="border rounded-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">Lista bohaterów</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie bohaterów…</p>
        ) : heroes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nie masz jeszcze żadnych bohaterów. Dodaj pierwszego 🙂
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Nazwa</th>
                  <th className="text-left py-2 px-2">Frakcja</th>
                  <th className="text-left py-2 px-2">Rzadkość</th>
                  <th className="text-left py-2 px-2">Poziom</th>
                  <th className="text-left py-2 px-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr key={hero.id} className="border-b last:border-0">
                    <td className="py-2 px-2 font-medium">{hero.name}</td>
                    <td className="py-2 px-2">{hero.faction || '—'}</td>
                    <td className="py-2 px-2">{hero.rarity || '—'}</td>
                    <td className="py-2 px-2">{hero.level ?? '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => goToManage(hero.id)}
                          className="border rounded-md px-2 py-1 text-xs"
                        >
                          Zarządzaj
                        </button>
                        <button
                          type="button"
                          onClick={() => goToEdit(hero.id)}
                          className="border rounded-md px-2 py-1 text-xs"
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(hero.id)}
                          className="border border-red-500 text-red-600 rounded-md px-2 py-1 text-xs"
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
