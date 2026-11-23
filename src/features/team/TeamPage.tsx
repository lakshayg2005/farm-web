import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import data from './team.json'

function Photo({ name, src }: { name: string; src: string }) {
  const [missing, setMissing] = useState(false)
  if (missing)
    return (
      <span aria-hidden className="grid size-32 place-items-center rounded-2xl bg-paper-deep font-display text-4xl text-ink-soft">
        {name.replace(/^Dr\s+/, '').charAt(0)}
      </span>
    )
  return <img src={src} alt={name} onError={() => setMissing(true)} className="size-32 rounded-2xl object-cover" />
}

export function TeamPage() {
  useEffect(() => {
    document.title = 'Our team · Farm Platform'
  }, [])
  const { guide, teams } = data
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pt-6 pb-12 sm:px-8 lg:pt-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <Link to="/" className="font-semibold text-primary underline">
          Back to home
        </Link>
      </div>

      <section aria-labelledby="thanks" className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center">
        <Photo name={guide.name} src={guide.photo} />
        <div className="max-w-xl">
          <h1 id="thanks" className="font-display text-[2rem] leading-tight sm:text-[2.5rem]">
            With thanks to {guide.name}
          </h1>
          <p className="mt-1 font-semibold text-ink-soft">{guide.role}</p>
          <p className="mt-3 text-lg">{guide.thanks}</p>
        </div>
      </section>

      {teams.map((team) => (
        <section key={team.name} aria-label={team.name} className="mt-14">
          <h2 className="font-display text-2xl">{team.name}</h2>
          <p className="text-ink-soft">{team.about}</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {team.members.map((m) => (
              <li key={m.github} className="card p-5">
                <p className="text-lg font-semibold">{m.name}</p>
                <p className="text-sm text-ink-soft">{m.role}</p>
                <p className="mt-2">{m.built}</p>
                <a href={`https://github.com/${m.github}`} className="mt-2 inline-block text-sm font-semibold text-primary underline">
                  @{m.github}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
