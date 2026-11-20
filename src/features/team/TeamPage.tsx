import { useEffect, useState } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import data from './team.json'

function Photo({ name, src }: { name: string; src: string }) {
  const [missing, setMissing] = useState(false)
  if (missing)
    return (
      <span
        aria-hidden
        className="grid size-40 shrink-0 place-items-center rounded-2xl border border-gray-800 bg-neutral-950 text-6xl font-bold text-white"
      >
        {name.replace(/^Dr\s+/, '').charAt(0)}
      </span>
    )
  return (
    <img
      src={src}
      alt={name}
      onError={() => setMissing(true)}
      className="size-40 shrink-0 rounded-2xl border border-gray-800 object-cover"
    />
  )
}

export function TeamPage() {
  useEffect(() => {
    document.title = 'Our team | Farm Platform'
  }, [])
  const { guide, teams } = data
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <section aria-labelledby="thanks" className="flex flex-col gap-10 sm:flex-row sm:items-center">
            <Photo name={guide.name} src={guide.photo} />
            <div className="max-w-3xl">
              <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">{guide.role}</p>
              <h1 id="thanks" className="mt-4 text-5xl font-bold md:text-6xl">
                With thanks to {guide.name}
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-400">{guide.thanks}</p>
            </div>
          </section>

          {teams.map((team) => (
            <section key={team.name} aria-label={team.name} className="mt-24">
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <p className="mt-2 text-gray-400">{team.about}</p>
              <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {team.members.map((m, i) => (
                  <li key={m.github} className="rounded-2xl border border-gray-800 p-6">
                    <span className="text-sm font-medium text-gray-500">{String(i + 1).padStart(2, '0')}</span>
                    <p className="mt-3 text-lg font-semibold">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.role}</p>
                    <p className="mt-3 leading-7 text-gray-400">{m.built}</p>
                    <a href={`https://github.com/${m.github}`} className="mt-4 inline-block text-sm font-medium text-gray-300 hover:text-white">
                      @{m.github}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
