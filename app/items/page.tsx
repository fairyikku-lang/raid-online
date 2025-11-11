'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';

type Gear = {
  id: string;
  hero_id: string | null;
  slot: string | null;
  set_key: string | null;
  rarity: string | null;
  stars: number | null;
  main_type: string | null;
  main_value: number | null;
  created_at?: string;
};

export default function ItemsPage() {
  const supa = createBrowserSupabaseClient();
  const router = useRouter();

  const [items, setItems] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formularz dodawania
  const [heroId, setHeroId] = useState('');
  const [slot, setSlot] = useState('');
  const [setKey, setSetKey] = useState('');
  const [rarity, setRarity] = useState('');
  const [stars, setStars] = useState('');
  const [mainType, setMainType] = useState('');
  const [mainValue, setMainValue] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supa
      .from('gear')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd pobierania przedmiotów:', error);
      setError('Nie udało się pobrać listy przedmiotów.');
      setItems([]);
    } else {
      setItems((data || []) as Gear[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();

    if (!slot.trim() || !rarity.trim() || !mainType.trim()) {
      alert('Slot, rzadkość i główna statystyka są wymagane.');
      return;
    }

    const parsedStars = stars.trim() ? parseInt(stars.trim(), 10) : 0;
    if (Number.isNaN(parsedStars) || parsedStars < 0) {
      alert('Gwiazdek nie można ustawić na wartość ujemną.');
      return;
    }

    const parsedMainValue = mainValue.trim()
      ? parseInt(mainValue.trim(), 10)
      : 0;

    setSaving(true);
    setError(null);

    const { error } = await supa.from('gear').insert({
      hero_id: heroId.trim() || null,
      slot: slot.trim(),
      set_key: setKey.trim() || null,
      rarity: rarity.trim(),
      stars: parsedStars,
      main_type: mainType.trim(),
      main_value: parsedMainValue,
    });

    if (error) {
      console.error('Błąd dodawania przedmiotu:', error);
      setError('Nie udało się dodać przedmiotu.');
    } else {
      setHeroId('');
      setSlot('');
      setSetKey('');
      setRarity('');
      setStars('');
      setMainType('');
      setMainValue('');
      await fetchItems();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno chcesz usunąć ten przedmiot?')) return;

    setError(null);

    const { error } = await supa.from('gear').delete().eq('id', id);

    if (error) {
      console.error('Błąd usuwania przedmiotu:', error);
      setError('Nie udało się usunąć przedmiotu.');
    } else {
      setItems((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const goToHero = (heroId: string | null) => {
    if (!heroId) return;
    router.push(`/heroes/${heroId}`);
  };

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Przedmioty</h1>
        <p className="text-sm mb-4">
          Podgląd i zarządzanie wszystkimi przedmiotami (gear) powiązanymi z bohaterami.
        </p>
      </header>

      <section className="border rounded-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">Dodaj przedmiot</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="ID bohatera (opcjonalne)"
            value={heroId}
            onChange={(e) => setHeroId(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Slot (np. Broń, Hełm...)"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Set key (np. Speed, Lifesteal...)"
            value={setKey}
            onChange={(e) => setSetKey(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Rzadkość (Rare, Epic...)"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          />

          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Gw (np. 6)"
            value={stars}
            onChange={(e) => setStars(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Main stat (ATK, HP%, SPD...)"
            value={mainType}
            onChange={(e) => setMainType(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Main value (np. 45)"
            value={mainValue}
            onChange={(e) => setMainValue(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="border rounded-md px-3 py-1 text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Zapisywanie…' : 'Dodaj'}
          </button>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </section>

      <section className="border rounded-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">Lista przedmiotów</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Ładowanie przedmiotów…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nie ma jeszcze żadnych przedmiotów.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Bohater (ID)</th>
                  <th className="text-left py-2 px-2">Slot</th>
                  <th className="text-left py-2 px-2">Set</th>
                  <th className="text-left py-2 px-2">Rzadkość</th>
                  <th className="text-left py-2 px-2">Gw</th>
                  <th className="text-left py-2 px-2">Main</th>
                  <th className="text-left py-2 px-2">Val</th>
                  <th className="text-left py-2 px-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="py-2 px-2">{g.hero_id || '—'}</td>
                    <td className="py-2 px-2">{g.slot || '—'}</td>
                    <td className="py-2 px-2">{g.set_key || '—'}</td>
                    <td className="py-2 px-2">{g.rarity || '—'}</td>
                    <td className="py-2 px-2">{g.stars ?? '—'}</td>
                    <td className="py-2 px-2">{g.main_type || '—'}</td>
                    <td className="py-2 px-2">{g.main_value ?? '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-2">
                        {g.hero_id && (
                          <button
                            type="button"
                            onClick={() => goToHero(g.hero_id)}
                            className="border rounded-md px-2 py-1 text-xs"
                          >
                            Zarządzaj bohaterem
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(g.id)}
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
