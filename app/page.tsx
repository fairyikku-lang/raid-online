// app/page.tsx
import Link from 'next/link'

const tiles = [
  {
    href: '/heroes',
    title: 'Bohaterowie',
    description: 'Lista bohaterów, statystyki i ekwipunek.',
  },
  {
    href: '/items',
    title: 'Ekwipunek',
    description: 'Przedmioty, sety i ich statystyki.',
  },
  {
    href: '/sets',
    title: 'Sety',
    description: 'Opis efektów setów i wymagane części.',
  },
  {
    href: '/notes',
    title: 'Taktyki / Notatki',
    description: 'Notatki o teamach, taktykach i planach rozwoju.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">
          RAID Online v1 – Panel
        </h1>
        <p className="text-slate-300 mb-10">
          Wybierz sekcję, którą chcesz edytować.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="block rounded-lg border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 transition-colors p-5"
            >
              <h2 className="text-xl font-semibold mb-2">
                {tile.title}
              </h2>
              <p className="text-sm text-slate-300">
                {tile.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}