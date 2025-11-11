'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabaseBrowserClient'

export default function HeroesPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [heroes, setHeroes] = useState([])
  const [name, setName] = useState('')
  const [faction, setFaction] = useState('')
  const [rarity, setRarity] = useState('')
  const [level, setLevel] = useState('')

  // 🔹 Pobieranie bohaterów z bazy
  const fetchHeroes = async () => {
    const { data, error } = await supabase.from('heroes').select('*').order('created_at', { ascending: false })
    if (!error) setHeroes(data || [])
  }

  useEffect(() => {
    fetchHeroes()
  }, [])

  // 🔹 Dodawanie bohatera
  const handleAdd = async () => {
    if (!name || !faction || !rarity || !level) return alert('Uzupełnij wszystkie pola.')
    const { error } = await supabase.from('heroes').insert([{ name, faction, rarity, level }])
    if (error) console.error(error)
    else {
      setName('')
      setFaction('')
      setRarity('')
      setLevel('')
      fetchHeroes()
    }
  }

  // 🔹 Usuwanie bohatera
  const handleDelete = async (id) => {
    if (!confirm('Na pewno chcesz usunąć bohatera?')) return
    await supabase.from('heroes').delete().eq('id', id)
    fetchHeroes()
  }

  // 🔹 Edycja bohatera
  const handleEdit = async (hero) => {
    const newName = prompt('Nowa nazwa:', hero.name)
    const newFaction = prompt('Nowa frakcja:', hero.faction)
    const newRarity = prompt('Nowa rzadkość:', hero.rarity)
    const newLevel = prompt('Nowy poziom:', hero.level)
    if (!newName) return

    await supabase
      .from('heroes')
      .update({
        name: newName,
        faction: newFaction,
        rarity: newRarity,
        level: newLevel,
      })
      .eq('id', hero.id)
    fetchHeroes()
  }

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-4xl font-bold mb-4">Bohaterowie</h1>
      <p className="text-slate-300 mb-6">Zarządzaj bohaterami – dodawaj, przeglądaj i usuwaj dane.</p>

      {/* 🔹 Formularz dodawania */}
      <h2 className="text-2xl font-semibold mb-3">Dodaj bohatera</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <input className="p-2 bg-slate-800 border border-slate-600 rounded" placeholder="Nazwa"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="p-2 bg-slate-800 border border-slate-600 rounded" placeholder="Frakcja"
          value={faction} onChange={(e) => setFaction(e.target.value)} />
        <input className="p-2 bg-slate-800 border border-slate-600 rounded" placeholder="Rzadkość"
          value={rarity} onChange={(e) => setRarity(e.target.value)} />
        <input className="p-2 bg-slate-800 border border-slate-600 rounded" placeholder="Poziom"
          value={level} onChange={(e) => setLevel(e.target.value)} />
      </div>
      <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Dodaj</button>

      {/* 🔹 Lista bohaterów */}
      <h2 className="text-2xl font-semibold mt-10 mb-4">Lista bohaterów</h2>
      <table className="w-full border-collapse border border-slate-700 text-left">
        <thead>
          <tr className="bg-slate-800/70">
            <th className="p-2">Nazwa</th>
            <th className="p-2">Frakcja</th>
            <th className="p-2">Rzadkość</th>
            <th className="p-2">Poziom</th>
            <th className="p-2 text-center">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {heroes.map((hero) => (
            <tr key={hero.id} className="border-t border-slate-700 hover:bg-slate-800/50">
              <td className="p-2">{hero.name}</td>
              <td className="p-2">{hero.faction}</td>
              <td className="p-2">{hero.rarity}</td>
              <td className="p-2">{hero.level}</td>
              <td className="p-2 text-center space-x-2">
                <button
                  onClick={() => handleEdit(hero)}
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => handleDelete(hero.id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Usuń
                </button>
                <button
                  onClick={() => router.push(`/heroes/${hero.id}`)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Zarządzaj
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
