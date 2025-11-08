'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-16 px-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Nagłówek */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              RAID Online v1
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Wspólna baza: bohaterowie, przedmioty, sety.
            </p>
          </div>
        </header>

        {/* Menu–kafelki */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Bohaterowie */}
          <Link
            href="/heroes"
            className="group rounded-xl border border-slate-700 bg-slate-900/60 p-5 shadow-sm hover:border-sky-400 hover:bg-slate-900 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-1 group-hover:text-sky-300">
              Bohaterowie
            </h2>
            <p className="text-sm text-slate-400">
              Lista bohaterów, statystyki, ekwipunek, notatki.
            </p>
          </Link>

          {/* Przedmioty – na razie placeholder */}
          <Link
            href="/items"
            className="group rounded-xl border border-slate-700 bg-slate-900/40 p-5 shadow-sm hover:border-emerald-400 hover:bg-slate-900 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-1 group-hover:text-emerald-300">
              Przedmioty
            </h2>
            <p className="text-sm text-slate-400">
              Baza ekwipunku: statystyki, sety, status (wolny / założony).
            </p>
          </Link>

          {/* Sety – też placeholder */}
          <Link
            href="/sets"
            className="group rounded-xl border border-slate-700 bg-slate-900/40 p-5 shadow-sm hover:border-violet-400 hover:bg-slate-900 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-1 group-hover:text-violet-300">
              Sety
            </h2>
            <p className="text-sm text-slate-400">
              Opisy bonusów setów i planowanie buildów.
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}
