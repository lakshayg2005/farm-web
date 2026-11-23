import { useEffect, useState } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import data from './team.json'

function Photo({ name, src }: { name: string; src: string }) {
  const [missing, setMissing] = useState(false)
  if (missing)
    return (
      <span aria-hidden className="grid size-32 place-items-center rounded-lg border border-border bg-surface-card font-serif text-4xl text-ink-soft">
        {name.replace(/^Dr\s+/, '').charAt(0)}
      </span>
    )
  return <img src={src} alt={name} onError={() => setMissing(true)} className="size-32 rounded-lg object-cover" />
}

export function TeamPage() {
  useEffect(() => {
    document.title = 'Our team · Farm Platform'
  }, [])
  const { guide, teams } = data
  return (
    <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-16 sm:px-8">
      <section aria-labelledby="thanks" className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Photo name={guide.name} src={guide.photo} />
        <div className="max-w-xl">
          <h1 id="thanks" className="font-serif text-4xl leading-tight sm:text-5xl">
            With thanks to {guide.name}
          </h1>
          <p className="mt-1 font-semibold text-ink-soft">{guide.role}</p>
          <p className="mt-3 text-ink-soft">{guide.thanks}</p>
        </div>
      </section>

      {teams.map((team) => (
        <section key={team.name} aria-label={team.name} className="mt-14">
          <h2 className="font-display text-lg">{team.name}</h2>
          <p className="text-ink-soft">{team.about}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {team.members.map((m) => (
              <li key={m.github} className="card p-5">
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-ink-soft">{m.role}</p>
                <p className="mt-2">{m.built}</p>
                <a href={`https://github.com/${m.github}`} className="mt-2 inline-block text-sm text-primary underline underline-offset-2">
                  @{m.github}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
    <SiteFooter />
    </div>
  )
}
