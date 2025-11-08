// app/heroes/page.tsx
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

const factions = ['Dark Elves', 'Banner Lords', 'Knight Revenant', 'Inne']
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

export default function HeroesPage() {
  const supabase = createBrowserSupabaseClient()

  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // formularz nowego bohatera
  const [name, setName] = useState('')
  const [faction, setFaction] = useState(factions[0])
  const [rarity, setRarity] = useState(rarities[2])
  const [level, setLevel] = useState(60)

  useEffect(() => {
    void loadHeroes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHeroes() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('heroes')
      .select('id, name, faction, rarity, level')
      .order('name', { ascending: true })

    if (error) {
      console.error(error)
      setError('Nie udało się wczytać bohaterów.')
    } else if (data) {
      setHeroes(data as Hero[])
    }
    setLoading(false)
  }

  async function handleAddHero(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Podaj nazwę bohatera.')
      return
    }

    const { error } = await supabase.from('heroes').insert({
      name: name.trim(),
      faction,
      rarity,
      level,
    })

    if (error) {
      console.error(error)
      setError('Nie udało się dodać bohatera.')
      return
    }

    setName('')
    await loadHeroes()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Bohaterowie</h1>

        {/* Formularz dodawania */}
        <section className="mb-10 rounded-lg border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-4">Dodaj bohatera</h2>
          {error && (
            <p className="mb-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <form
            onSubmit={handleAddHero}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="block text-sm mb-1">Nazwa</label>
              <input
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kael, Rector Drath, Michelangelo..."
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Frakcja</label>
              <select
                className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                value={faction}
                onChange={(e) => setFaction(e.target.value)}
              >
                {factions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Rzadkość</label>
              <select
                className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="block text-sm mb-1">Poziom</label>
              <input
                type="number"
                min={1}
                max={60}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) || 1)}
              />
            </div>

            <button
              type="submit"
              className="mt-2 md:mt-0 inline-flex items-center justify-center rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold"
            >
              Dodaj
            </button>
          </form>
        </section>

        {/* Lista bohaterów */}
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden">
          <div className="grid grid-cols-[2fr,1.5fr,1fr,0.8fr] gap-2 bg-slate-900 px-4 py-3 text-sm font-semibold">
            <span>Nazwa</span>
            <span>Frakcja</span>
            <span>Rzadkość</span>
            <span>Poziom</span>
          </div>

          {loading ? (
            <div className="px-4 py-4 text-sm text-slate-300">
              Ładowanie bohaterów...
            </div>
          ) : heroes.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-300">
              Brak bohaterów. Dodaj pierwszego powyżej.
            </div>
          ) : (
            <ul>
              {heroes.map((h) => (
                <li
                  key={h.id}
                  className="grid grid-cols-[2fr,1.5fr,1fr,0.8fr] gap-2 border-t border-slate-800 px-4 py-2 text-sm"
                >
                  <span>{h.name}</span>
                  <span>{h.faction}</span>
                  <span>{h.rarity}</span>
                  <span>{h.level}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}