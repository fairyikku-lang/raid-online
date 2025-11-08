'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'

type Hero = {
  id: string
  name: string
  faction: string
  rarity: string
  level: number
}

const FACTIONS = [
  'Dark Elves',
  'High Elves',
  'Banner Lords',
  'Sacred Order',
  'Barbarians',
  'Ogryn Tribes',
  'Lizardmen',
  'Skinwalkers',
  'Orcs',
  'Demonspawn',
  'Undead Hordes',
  'Knight Revenant',
  'Dwarves',
  'Shadowkin',
  'Sylvan Watchers'
]

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical']

export default function HeroesPage() {
  const supabase = createBrowserSupabaseClient()

  const [heroes, setHeroes] = useState<Hero[]>([])
  const [name, setName] = useState('')
  const [faction, setFaction] = useState('Dark Elves')
  const [rarity, setRarity] = useState('Rare')
  const [level, setLevel] = useState<number | ''>(60)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadHeroes() {
    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setError('Nie udało się pobrać bohaterów.')
      return
    }

    setHeroes((data || []) as Hero[])
  }

  useEffect(() => {
    loadHeroes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAddHero(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Podaj nazwę bohatera.')
      return
    }
    if (!level || level <= 0) {
      setError('Poziom musi być większy od 0.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('heroes').insert([
      {
        name: name.trim(),
        faction,
        rarity,
        level: Number(level)
      }
    ])

    if (error) {
      console.error(error)
      setError('Nie udało się dodać bohatera.')
      setLoading(false)
      return
    }

    // wyczyść formularz
    setName('')
    setLevel(60)

    // odśwież listę
    await loadHeroes()
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-100">
      <h1 className="mb-2 text-3xl font-bold">Bohaterowie</h1>
      <p className="mb-6 text-sm text-slate-300">
        Dodawaj bohaterów i trzymaj ich listę w jednej wspólnej bazie.
      </p>

      {/* KARTA – formularz */}
      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/40">
        <h2 className="mb-3 text-lg font-semibold">Dodaj bohatera</h2>

        {error && (
          <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleAddHero}
          className="grid gap-3 md:grid-cols-4 md:items-end"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Nazwa
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Kael, Trunda, Rector Drath..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Frakcja
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
            >
              {FACTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Rzadkość
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Poziom
            </label>
            <input
              type="number"
              min={1}
              max={60}
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-900/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Dodawanie…' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA BOHATERÓW */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 shadow-lg shadow-black/40">
        <h2 className="mb-3 text-lg font-semibold">Lista bohaterów</h2>

        {heroes.length === 0 ? (
          <p className="text-sm text-slate-300">
            Brak bohaterów. Dodaj pierwszego powyżej.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/80">
                  <th className="px-3 py-2 text-left font-semibold">Nazwa</th>
                  <th className="px-3 py-2 text-left font-semibold">Frakcja</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Rzadkość
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Poziom</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr
                    key={hero.id}
                    className="border-b border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20"
                  >
                    <td className="px-3 py-2">{hero.name}</td>
                    <td className="px-3 py-2">{hero.faction}</td>
                    <td className="px-3 py-2">{hero.rarity}</td>
                    <td className="px-3 py-2">{hero.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}