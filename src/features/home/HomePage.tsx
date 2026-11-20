import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
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
        <SiteHeader />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-24 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-32">
          <div>
            <motion.p
              {...rise()}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300"
            >
              ✦ Farm to table, without the middlemen
            </motion.p>
            <motion.h1 {...rise(0.05)} className="mt-8 font-display text-5xl leading-tight sm:text-7xl">
              From the farmer’s field <span className="block text-neutral-400">to your table.</span>
            </motion.h1>
            <motion.p {...rise(0.1)} className="mt-8 max-w-xl text-lg leading-8 text-neutral-400 sm:text-xl">
              Buy produce harvested days ago from verified farmers near you, graded by inspectors and delivered on shared
              routes. Or reserve a plot of farmland and follow your own crop until harvest.
            </motion.p>
            <motion.div {...rise(0.15)} className="mt-9 flex flex-wrap gap-3">
              <Link to="/catalog" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-black transition hover:bg-neutral-200">
                Browse fresh produce <Icon name="arrow" className="size-4.5" />
              </Link>
              <Link
                to="/customer/plots"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 px-7 py-3.5 font-semibold text-white transition hover:bg-neutral-900"
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
                  <dd className="text-sm text-neutral-500">{label}</dd>
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
          <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">How it works</p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Fresh, fair and traceable at every step</h2>
          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Every listing shows when it was harvested and when it will arrive, so you always know what you are buying.
          </p>
        </motion.div>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li key={s.title} {...rise(i * 0.08)} className="rounded-2xl border border-neutral-200 p-8">
              <span className="text-sm font-medium text-neutral-400">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-8 text-2xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-4 leading-7 text-neutral-600">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Two ways to buy */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-5 px-4 sm:px-8 lg:grid-cols-2">
        <motion.div {...rise()} className="relative overflow-hidden rounded-2xl bg-black p-8 text-white sm:p-10">
          <span className="absolute -right-6 -bottom-8 text-[11rem] leading-none opacity-80 grayscale" aria-hidden>
            🍅
          </span>
          <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">V1 · Fresh produce</p>
          <h3 className="mt-4 max-w-sm font-display text-3xl leading-tight">Vegetables, fruits and grains from farms near you</h3>
          <ul className="mt-5 max-w-xs space-y-2">
            {['Harvest date on every listing', 'Grade A/B/C from an inspector', 'Next-day pooled delivery'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="size-5 text-neutral-400" /> <span className="text-neutral-300">{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/catalog" className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-neutral-200">
            Open the catalog <Icon name="arrow" className="size-4" />
          </Link>
        </motion.div>
        <motion.div {...rise(0.08)} className="relative overflow-hidden rounded-2xl border border-neutral-200 p-8 sm:p-10">
          <span className="absolute -right-4 -bottom-6 text-[10rem] leading-none opacity-80 grayscale" aria-hidden>
            🌾
          </span>
          <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">V2 · Farmland reservation</p>
          <h3 className="mt-4 max-w-sm font-display text-3xl leading-tight">Reserve a plot and watch your crop grow</h3>
          <ul className="mt-5 max-w-xs space-y-2">
            {['Pick a plot on the map', 'Photo updates from the farmer', 'Home delivery or buy-back at harvest'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="size-5 text-neutral-400" /> <span className="text-neutral-600">{t}</span>
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
            <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">One platform, four roles</p>
            <h2 className="mt-2 font-display text-4xl leading-tight">Choose your section to get started</h2>
          </div>
          <Link to="/team" className="font-semibold hover:underline">
            Meet the team →
          </Link>
        </motion.div>
        <nav aria-label="Sections" className="mt-10">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section, i) => (
              <motion.li key={section.role} {...rise(i * 0.07)}>
                <Link
                  to={`/${section.role}`}
                  className="group flex h-full flex-col rounded-2xl border border-neutral-200 p-6 transition-colors hover:border-black"
                >
                  <span className="flex items-center justify-between text-sm font-medium text-neutral-400">
                    {String(i + 1).padStart(2, '0')}
                    <Icon name={roleIcon[section.role]} className="size-5 text-neutral-400 group-hover:text-black" />
                  </span>
                  <span className="mt-8 block text-2xl font-bold tracking-tight">{section.label}</span>
                  <span className="mt-2 block flex-1 leading-7 text-neutral-600">{section.audience}</span>
                  <span className="mt-6 inline-flex items-center gap-1.5 font-semibold">
                    Open <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </section>

      {/* Thanks */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-8">
        <motion.div {...rise()} className="relative overflow-hidden rounded-2xl bg-black px-8 py-12 text-white sm:px-12">
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">With gratitude</p>
              <p className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                Built by two teams of students, guided by Dr Gagan Sir
              </p>
            </div>
            <Link to="/team" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-neutral-200">
              Meet the team <Icon name="users" className="size-4.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
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
      
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-surface text-ink">
        <div className="grid h-56 place-items-center bg-neutral-100">
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
