'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient';

type Hero = {
  id: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  level: number | null;
  created_at: string;
};

export default function EditHeroPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const id = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [faction, setFaction] = useState('');
  const [rarity, setRarity] = useState('');
  const [level, setLevel] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadHero = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .eq('id', id)
        .single<Hero>();

      if (error) {
        console.error('Błąd pobierania bohatera:', error);
        setError('Nie udało się pobrać danych bohatera.');
      } else if (data) {
        setName(data.name || '');
        setFaction(data.faction || '');
        setRarity(data.rarity || '');
        setLevel(
          typeof data.level === 'number' && !Number.isNaN(data.level)
            ? String(data.level)
            : ''
        );
      }

      setLoading(false);
    };

    loadHero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Nazwa bohatera jest wymagana.');
      return;
    }

    const trimmedFaction = faction.trim();
    const trimmedRarity = rarity.trim();

    let parsedLevel: number | null = null;
    if (level.trim()) {
      const lv = parseInt(level.trim(), 10);
      if (Number.isNaN(lv) || lv <= 0) {
        alert('Poziom musi być dodatnią liczbą lub zostać pusty.');
        return;
      }
      parsedLevel = lv;
    }

    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from('heroes')
      .update({
        name: name.trim(),
        faction: trimmedFaction || null,
        rarity: trimmedRarity || null,
        level: parsedLevel,
      })
      .eq('id', id);

    if (error) {
      console.error('Błąd aktualizacji bohatera:', error);
      setError('Nie udało się zapisać zmian.');
      setSaving(false);
      return;
    }

    // Po udanej aktualizacji wracamy do listy bohaterów
    router.push('/heroes');
  };

  const handleCancel = () => {
    router.push('/heroes');
  };

  if (!id) {
    return (
      <main className="max-w-xl mx-auto p-4">
        <p className="text-sm text-red-600">
          Brak poprawnego identyfikatora bohatera w adresie URL.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Edytuj bohatera</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Ładowanie danych bohatera…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Nazwa
            </label>
            <input
              id="name"
              className="border rounded-md px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Kael"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="faction" className="text-sm font-medium">
              Frakcja
            </label>
            <input
              id="faction"
              className="border rounded-md px-2 py-1 text-sm"
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
              placeholder="np. Dark Elves"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="rarity" className="text-sm font-medium">
              Rzadkość
            </label>
            <input
              id="rarity"
              className="border rounded-md px-2 py-1 text-sm"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="np. Rare, Epic, Legendary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="level" className="text-sm font-medium">
              Poziom
            </label>
            <input
              id="level"
              className="border rounded-md px-2 py-1 text-sm"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="np. 60 (lub zostaw puste)"
              inputMode="numeric"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="border rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border rounded-md px-3 py-2 text-sm text-gray-600"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
