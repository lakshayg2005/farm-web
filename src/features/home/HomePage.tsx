import { motion } from 'motion/react'
import { useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { CropRows } from '@/components/CropRows'
import { Icon, type IconName } from '@/components/Icon'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { cropLook } from '@/features/catalog/catalog'
import { sections } from '@/routes/sections'
import type { Role } from '@/routes/types'

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
})

const roleIcon: Record<Role, IconName> = { farmer: 'sprout', customer: 'basket', inspector: 'shield', admin: 'grid' }

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'sprout', title: 'Farmers list their harvest', body: 'Verified farmers post produce with the harvest date, price and stock, or open plots for the season.' },
  { icon: 'shield', title: 'Inspectors grade every batch', body: 'The nearest inspector checks moisture, pests and weight, and grades it A, B or C with geo-tagged photos.' },
  { icon: 'route', title: 'Orders share one route', body: 'Every night nearby orders are pooled into shared delivery routes, cutting kilometres, cost and emissions.' },
  { icon: 'truck', title: 'Fresh at your door', body: 'Track the rider live and confirm delivery with a one-time code. Most orders arrive the next morning.' },
]

const MARQUEE = ['tomato', 'mango', 'spinach', 'carrot', 'banana', 'wheat', 'onion', 'watermelon', 'garlic', 'peas', 'maize', 'brinjal', 'guava', 'chana']

export function HomePage() {
  useEffect(() => {
    document.title = 'Farm Platform · Fresh from the field'
  }, [])

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Hero */}
      <section className="mesh relative text-white">
        <FieldLines />
        <SiteHeader tone="light" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-24 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-32">
          <div>
            <motion.p
              {...rise()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-lime"
            >
              <span className="size-2 animate-pulse rounded-full bg-lime" /> Farm to table, without the middlemen
            </motion.p>
            <motion.h1 {...rise(0.05)} className="mt-5 font-display text-[2.8rem] leading-[1.02] sm:text-[4.2rem]">
              From the farmer’s field <span className="text-gradient">to your table</span>
            </motion.h1>
            <motion.p {...rise(0.1)} className="mt-6 max-w-xl text-lg text-white/75 sm:text-xl">
              Buy produce harvested days ago from verified farmers near you, graded by inspectors and delivered on shared
              routes. Or reserve a plot of farmland and follow your own crop until harvest.
            </motion.p>
            <motion.div {...rise(0.15)} className="mt-9 flex flex-wrap gap-3">
              <Link to="/catalog" className="btn-primary !bg-lime !px-6 !py-3 !text-forest-deep hover:!bg-white">
                Browse fresh produce <Icon name="arrow" className="size-4.5" />
              </Link>
              <Link
                to="/customer/plots"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Reserve farmland
              </Link>
            </motion.div>
            <motion.dl {...rise(0.2)} className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                ['8', 'districts served'],
                ['36', 'crops on offer'],
                ['~1 day', 'field to door'],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-3xl text-white">{n}</dd>
                  <dd className="text-sm text-white/60">{label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
          <HeroShowcase />
        </div>
      </section>

      {/* Crop marquee */}
      <div className="border-b border-line bg-surface py-4" aria-hidden>
        <div className="flex w-max animate-marquee gap-10">
          {[...MARQUEE, ...MARQUEE].map((id, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-lg font-medium whitespace-nowrap text-ink-soft">
              <span className="text-2xl">{cropLook(id).emoji}</span>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-8 px-4 pt-24 sm:px-8">
        <motion.div {...rise()} className="max-w-2xl">
          <p className="font-semibold text-indigo">How it works</p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Fresh, fair and traceable at every step</h2>
          <p className="mt-4 text-lg text-ink-soft">
            Every listing shows when it was harvested and when it will arrive, so you always know what you are buying.
          </p>
        </motion.div>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li key={s.title} {...rise(i * 0.08)} className="card relative overflow-hidden p-6">
              <span className="absolute top-2 right-5 font-display text-7xl leading-none text-paper-deep select-none" aria-hidden>
                {i + 1}
              </span>
              <span className="relative grid size-12 place-items-center rounded-2xl bg-indigo text-white">
                <Icon name={s.icon} className="size-6" />
              </span>
              <h3 className="relative mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="relative mt-2 text-ink-soft">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Two ways to buy */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-5 px-4 sm:px-8 lg:grid-cols-2">
        <motion.div {...rise()} className="relative overflow-hidden rounded-[1.75rem] bg-[#fde2dc] p-8 sm:p-10">
          <span className="absolute -right-6 -bottom-8 text-[11rem] leading-none opacity-90" aria-hidden>
            🍅
          </span>
          <p className="font-semibold text-tomato">V1 · Fresh produce</p>
          <h3 className="mt-2 max-w-sm font-display text-3xl leading-tight">Vegetables, fruits and grains from farms near you</h3>
          <ul className="mt-5 max-w-xs space-y-2">
            {['Harvest date on every listing', 'Grade A/B/C from an inspector', 'Next-day pooled delivery'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="size-5 text-tomato" /> {t}
              </li>
            ))}
          </ul>
          <Link to="/catalog" className="btn-primary relative mt-8 !bg-ink hover:!bg-forest-deep">
            Open the catalog <Icon name="arrow" className="size-4" />
          </Link>
        </motion.div>
        <motion.div {...rise(0.08)} className="relative overflow-hidden rounded-[1.75rem] bg-[#e2f0d6] p-8 sm:p-10">
          <span className="absolute -right-4 -bottom-6 text-[10rem] leading-none" aria-hidden>
            🌾
          </span>
          <p className="font-semibold text-indigo">V2 · Farmland reservation</p>
          <h3 className="mt-2 max-w-sm font-display text-3xl leading-tight">Reserve a plot and watch your crop grow</h3>
          <ul className="mt-5 max-w-xs space-y-2">
            {['Pick a plot on the map', 'Photo updates from the farmer', 'Home delivery or buy-back at harvest'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="size-5 text-indigo" /> {t}
              </li>
            ))}
          </ul>
          <Link to="/customer/plots" className="btn-primary relative mt-8">
            Find land near you <Icon name="arrow" className="size-4" />
          </Link>
        </motion.div>
      </section>

      {/* Sections */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-8">
        <motion.div {...rise()} className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="font-semibold text-indigo">One platform, four roles</p>
            <h2 className="mt-2 font-display text-4xl leading-tight">Choose your section to get started</h2>
          </div>
          <Link to="/team" className="font-semibold text-indigo hover:underline">
            Meet the team →
          </Link>
        </motion.div>
        <nav aria-label="Sections" className="mt-10">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section, i) => (
              <motion.li key={section.role} {...rise(i * 0.07)}>
                <Link
                  to={`/${section.role}`}
                  style={{ '--role': section.accent } as CSSProperties}
                  className="card group flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <CropRows delay={0.1 + i * 0.12} className="h-20" />
                  <span className="flex flex-1 flex-col p-5">
                    <span className="-mt-11 grid size-12 place-items-center rounded-2xl border-4 border-surface bg-[color-mix(in_oklab,var(--role)_85%,black)] text-white">
                      <Icon name={roleIcon[section.role]} className="size-5" />
                    </span>
                    <span className="mt-3 block font-display text-xl leading-tight">{section.label}</span>
                    <span className="mt-1 block flex-1 text-[0.95rem] leading-snug text-ink-soft">{section.audience}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-indigo">
                      Open <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </section>

      {/* Thanks */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-8">
        <motion.div {...rise()} className="mesh relative overflow-hidden rounded-[1.75rem] px-8 py-12 text-white sm:px-12">
          <FieldLines />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="font-semibold text-lime">With gratitude</p>
              <p className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                Built by two teams of students, guided by Dr Gagan Sir
              </p>
            </div>
            <Link to="/team" className="btn-primary shrink-0 !bg-white !text-forest-deep hover:!bg-lime">
              Meet the team <Icon name="users" className="size-4.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  )
}

/** Fine contour lines, like ploughed fields seen from a drone, behind dark panels. */
function FieldLines() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-[0.09]" preserveAspectRatio="none" viewBox="0 0 800 600">
      {Array.from({ length: 22 }, (_, i) => (
        <path
          key={i}
          d={`M-50 ${80 + i * 26} C 200 ${20 + i * 26}, 420 ${160 + i * 24}, 850 ${60 + i * 27}`}
          stroke="white"
          strokeWidth="1.2"
          fill="none"
        />
      ))}
    </svg>
  )
}

/** A product card preview with floating badges: shows what the catalog tells you at a glance. */
function HeroShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-lime/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-surface text-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)]">
        <div className="grid h-56 place-items-center bg-[#fde2dc]">
          <span className="animate-float text-[7.5rem] drop-shadow-[0_14px_18px_rgb(0_0_0/0.2)]">🍅</span>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">Desi Tomato</p>
              <p className="text-ink-soft">Hariyali Farms · Kumhari, 6 km</p>
            </div>
            <p className="font-display text-2xl">
              ₹32<span className="font-sans text-base text-ink-soft">/kg</span>
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="rounded-full bg-leaf/12 px-2 py-0.5 text-xs font-semibold text-[#1d6b3a]">Peak fresh</span>
              <span className="text-ink-soft">Harvested today</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-paper-deep">
              <div className="h-full w-[94%] rounded-full bg-leaf" />
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5">
            <Icon name="truck" className="size-5 text-indigo" />
            <span>
              <strong>Tomorrow</strong> <span className="text-ink-soft">· by 11 am</span>
            </span>
          </p>
        </div>
      </div>
      <div className="glass absolute top-10 -left-6 flex animate-float items-center gap-2 rounded-2xl px-4 py-3 text-ink shadow-lg sm:-left-12">
        <span className="grid size-9 place-items-center rounded-xl bg-mustard/20 text-lg">⭐</span>
        <span className="text-sm leading-tight">
          <strong className="block">Grade A</strong>
          <span className="text-ink-soft">Checked by inspector</span>
        </span>
      </div>
      <div
        className="glass absolute -right-4 -bottom-6 flex animate-float items-center gap-2 rounded-2xl px-4 py-3 text-ink shadow-lg [animation-delay:1.5s] sm:-right-10"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-leaf/15 text-lg">🌍</span>
        <span className="text-sm leading-tight">
          <strong className="block">Shared routes</strong>
          <span className="text-ink-soft">fewer km per order</span>
        </span>
      </div>
    </motion.div>
  )
}
