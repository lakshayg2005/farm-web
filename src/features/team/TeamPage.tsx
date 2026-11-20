import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import data from './team.json'

const GRADIENTS = [
  'from-[#1f6b45] to-[#3f9d5c]',
  'from-[#e9a419] to-[#e4572e]',
  'from-[#3f7cc4] to-[#1f6b45]',
  'from-[#8a5a33] to-[#e9a419]',
]

function Photo({ name, src }: { name: string; src: string }) {
  const [missing, setMissing] = useState(false)
  if (missing)
    return (
      <span
        aria-hidden
        className="grid size-40 place-items-center rounded-[2rem] bg-gradient-to-br from-lime to-mustard font-display text-6xl text-forest-deep shadow-xl"
      >
        {name.replace(/^Dr\s+/, '').charAt(0)}
      </span>
    )
  return (
    <img
      src={src}
      alt={name}
      onError={() => setMissing(true)}
      className="size-40 rounded-[2rem] object-cover shadow-xl ring-4 ring-white/20"
    />
  )
}

export function TeamPage() {
  useEffect(() => {
    document.title = 'Our team · Farm Platform'
  }, [])
  const { guide, teams } = data
  return (
    <div className="min-h-dvh">
      <div className="mesh relative overflow-hidden text-white">
        <SiteHeader tone="light" />
        <section
          aria-labelledby="thanks"
          className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-12 pb-20 sm:flex-row sm:items-center sm:px-8 lg:pt-16"
        >
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Photo name={guide.name} src={guide.photo} />
          </motion.div>
          <div className="max-w-2xl">
            <p className="font-semibold text-lime">{guide.role}</p>
            <h1 id="thanks" className="mt-2 font-display text-[2.4rem] leading-tight sm:text-5xl">
              With thanks to {guide.name}
            </h1>
            <p className="mt-4 text-lg text-white/80">{guide.thanks}</p>
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {teams.map((team, t) => (
          <section key={team.name} aria-label={team.name} className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-3xl">{team.name}</h2>
              <p className="text-ink-soft">{team.about}</p>
            </div>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.members.map((m, i) => (
                <motion.li
                  key={m.github}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="card flex flex-col p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br font-display text-xl text-white ${GRADIENTS[(i + t) % GRADIENTS.length]}`}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-lg leading-tight font-semibold">{m.name}</p>
                      <p className="text-sm text-ink-soft">{m.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-[0.95rem]">{m.built}</p>
                  <a
                    href={`https://github.com/${m.github}`}
                    className="mt-4 inline-block text-sm font-semibold text-indigo hover:underline"
                  >
                    @{m.github}
                  </a>
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <SiteFooter />
    </div>
  )
}
