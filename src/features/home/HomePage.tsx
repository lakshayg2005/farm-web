import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useToast } from '@/components/Toast'

const eyebrow = 'block text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant'

function Section({ children, id, className = 'py-16' }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-[1440px] border-t border-border px-6 lg:px-12 ${className}`}>
      {children}
    </section>
  )
}

/** Public landing page, laid out as in the Farm Platform prototype (hero, pillars, spotlight, farmland, roles). */
export function HomePage() {
  const notify = useToast()
  const navigate = useNavigate()
  const [place, setPlace] = useState('Bhilai / Durg')
  const [qty, setQty] = useState(2)

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-background">
        {/* HERO */}
        <section className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pt-16 pb-20 text-center lg:px-12 lg:pt-24 lg:pb-28">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface-card px-3.5 py-1.5 text-xs text-on-surface-variant">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Fresh produce &amp; farmland plots, directly from verified growers</span>
            <span className="material-symbols-outlined text-xs text-primary">verified</span>
          </div>
          <h1 className="mb-6 max-w-4xl font-serif text-5xl leading-[1.08] font-normal tracking-tight text-on-surface sm:text-6xl lg:text-7xl">
            From the farmer’s soil <br className="hidden sm:inline" />
            <span className="font-serif text-primary italic">to your table.</span>
          </h1>
          <p className="mb-12 max-w-2xl text-base leading-relaxed font-light text-on-surface-variant sm:text-lg">
            Farm Platform connects conscious buyers with hyper-local harvests within hours of cutting. Graded by field agronomists, transported via pooled cold routes, with direct fractional farmland leases.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              navigate('/catalog')
            }}
            className="flex w-full max-w-2xl flex-col items-center gap-2 rounded-2xl border border-border bg-surface-card p-2 sm:flex-row sm:p-2.5"
          >
            <div className="flex w-full flex-1 items-center gap-3 rounded-xl border border-border/40 bg-surface px-3.5 py-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                aria-label="Delivery area"
                className="w-full border-0 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:text-sm"
                placeholder="Search crop, variety, or delivery area..."
              />
            </div>
            <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <div className="relative">
                <select aria-label="Distance" defaultValue="Within 50 km" className="h-10 cursor-pointer appearance-none rounded-xl border border-border/40 bg-surface px-3 pr-7 text-xs font-medium text-on-surface-variant focus:outline-none">
                  <option>Within 25 km</option>
                  <option>Within 50 km</option>
                  <option>Statewide</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-on-surface-variant">expand_more</span>
              </div>
              <button type="submit" className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-medium text-on-primary transition-opacity hover:opacity-95">
                <span>Explore</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link to="/catalog" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-container px-4 py-2 font-medium text-on-surface transition-all hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
              <span>Browse Fresh Produce</span>
            </Link>
            <Link to="/reserve-farmland" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-container px-4 py-2 font-medium text-on-surface transition-all hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[16px] text-secondary">potted_plant</span>
              <span>Reserve Farmland Plot</span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant sm:gap-10">
            {['Zero Middlemen Markups', '100% Photo-Verified at Farm', 'Next-Dawn Shared Cold Route'].map((t, i) => (
              <span key={t} className="flex items-center gap-2">
                {i > 0 && <span className="mr-8 hidden text-outline/40 sm:inline">•</span>}
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{t}</span>
              </span>
            ))}
          </div>
        </section>

        {/* 3 PILLARS */}
        <Section>
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className={`${eyebrow} mb-2`}>Direct Agronomy Advantage</span>
              <h2 className="font-serif text-3xl font-normal text-on-surface sm:text-4xl">Fresh food, without the middlemen.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed font-light text-on-surface-variant">
              Every lot is cataloged in the soil, inspected at harvest, and batched into cluster deliveries within 18 hours.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: '01 / TIMESTAMP', icon: 'timer', tone: 'text-primary', title: 'Live Freshness Meter', body: 'Every crate displays the exact harvest timestamp and sugar brix level. Track down to the farm quadrant where it was clipped.', left: 'Field moisture: 89%', right: 'Cut 4h ago', rightTone: 'font-medium text-primary' },
              { n: '02 / LAB QUALITY', icon: 'fact_check', tone: 'text-secondary', title: 'Inspector Certified', body: 'Independent agronomists verify soil inputs, leaf health, and fungal traces before stamping lots with Grade A, B, or C classifications.', left: 'Grade A • 0% Residue', right: 'Verified', rightTone: 'text-on-surface' },
              { n: '03 / LOGISTICS', icon: 'hub', tone: 'text-primary', title: 'Pooled Cold Routes', body: 'Orders from nearby neighbors merge into a singular temperature-regulated morning vehicle, slashing cold-chain emissions by 68%.', left: 'Sub-Cluster #42 (34 Orders)', right: '12kg CO₂ Saved', rightTone: 'font-medium text-primary' },
            ].map((p) => (
              <div key={p.n} className="flex flex-col justify-between rounded-2xl border border-border bg-surface-card p-7 transition-colors hover:border-outline">
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-xs text-on-surface-variant">{p.n}</span>
                    <span className={`material-symbols-outlined text-[20px] ${p.tone}`}>{p.icon}</span>
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-normal text-on-surface">{p.title}</h3>
                  <p className="mb-6 text-xs leading-relaxed font-light text-on-surface-variant sm:text-sm">{p.body}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="text-on-surface-variant">{p.left}</span>
                  <span className={p.rightTone}>{p.right}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SPOTLIGHT */}
        <Section id="catalog">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className={`${eyebrow} mb-1`}>Morning Harvest Roster</span>
              <h2 className="font-serif text-3xl font-normal text-on-surface sm:text-4xl">What farmers near you are offering</h2>
            </div>
            <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-on-surface">
              <span>View all produce items</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          <div className="relative grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface-card lg:grid-cols-12">
            <div className="flex flex-col justify-between p-8 lg:col-span-7 lg:p-10">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-on-surface">Picked Today 5:30 AM</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-on-surface">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Grade A Certified
                  </span>
                  <span className="text-xs text-on-surface-variant">Heirloom Variety</span>
                </div>
                <h3 className="mb-3 font-serif text-3xl font-normal text-on-surface sm:text-4xl">Desi Heirloom Tomatoes</h3>
                <p className="mb-6 max-w-xl text-xs leading-relaxed font-light text-on-surface-variant sm:text-sm">
                  Cultivated in rich red loam at <strong className="font-medium text-on-surface">Hariyali Farms (Plot 3B)</strong>, naturally sun-ripened without artificial ethylene. High acidity and intense aromatic pulp, ideal for slow curries and rustic purées.
                </p>
                <div className="mb-6 grid grid-cols-3 gap-3">
                  {[
                    ['Origin Distance', '6.4 km', 'text-on-surface'],
                    ['Inspector Rating', '9.8 / 10', 'text-secondary'],
                    ['Brix Index', '5.8 °Bx', 'text-primary'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="rounded-xl border border-border bg-surface p-3">
                      <span className="block text-[11px] text-on-surface-variant">{k}</span>
                      <span className={`mt-0.5 block font-serif text-lg ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl text-on-surface">₹38</span>
                    <span className="text-xs font-light text-on-surface-variant">/ kg (Direct Farmer Rate)</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">Delivered tomorrow before 11:00 AM</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border bg-surface p-1">
                    <button type="button" aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="w-10 text-center font-mono text-xs font-semibold text-on-surface">{qty} kg</span>
                    <button type="button" aria-label="More" onClick={() => setQty((q) => q + 1)} className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      notify(`${qty} kg of tomatoes selected. Pick it from the live produce list to order.`)
                      navigate('/catalog')
                    }}
                    className="h-10 rounded-xl bg-primary px-5 text-xs font-medium text-on-primary transition-all hover:opacity-95 active:scale-[0.99]"
                  >
                    Add to Basket
                  </button>
                </div>
              </div>
            </div>
            <div className="relative min-h-[300px] overflow-hidden bg-surface-container lg:col-span-5 lg:min-h-[420px]">
              <img alt="Desi heirloom tomatoes" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]" src="/img/p01.jpg" />
              <div className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs text-on-surface backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Hariyali Quad 3B</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { img: '/img/p02.jpg', tag: 'Cut 2h ago', tone: 'text-primary', name: 'Country Baby Palak', farm: 'Devanahalli Bio-Cluster', price: '₹24', unit: '/ bunch' },
              { img: '/img/p03.jpg', tag: 'Grade A+', tone: 'text-secondary', name: 'Native Ooty Carrots', farm: 'Sholur Terrace Cultivation', price: '₹52', unit: '/ kg' },
              { img: '/img/p04.jpg', tag: 'Raw Unfiltered', tone: 'text-primary', name: 'Wild Jamun Honey', farm: 'Nilgiri Biosphere Apiary', price: '₹340', unit: '/ 500g' },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-4 rounded-2xl border border-border bg-surface-card p-4 transition-colors hover:border-outline">
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                  <img alt={c.name} className="h-full w-full object-cover" src={c.img} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-[10px] font-medium ${c.tone}`}>{c.tag}</span>
                  <h4 className="truncate font-serif text-base text-on-surface">{c.name}</h4>
                  <p className="mb-2 truncate text-xs font-light text-on-surface-variant">{c.farm}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-medium text-on-surface">
                      {c.price} <span className="font-sans text-[11px] font-light text-on-surface-variant">{c.unit}</span>
                    </span>
                    <button type="button" aria-label={`Add ${c.name}`} onClick={() => notify(`${c.name} is a sample. Find real produce under Fresh produce.`)} className="flex size-7 items-center justify-center rounded-lg border border-border text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* FARMLAND */}
        <Section id="farmland">
          <div className="rounded-3xl border border-border bg-surface-card p-8 lg:p-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="flex flex-col gap-5 lg:col-span-7">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs text-secondary">potted_plant</span>
                  <span>Agrarian Micro-Leasing</span>
                </div>
                <h2 className="font-serif text-3xl leading-tight font-normal text-on-surface sm:text-4xl">
                  Reserve a 0.25-Acre Plot.
                  <br />
                  <span className="text-primary italic">Follow your harvest live.</span>
                </h2>
                <p className="max-w-xl text-sm leading-relaxed font-light text-on-surface-variant">
                  Choose what gets sown. An experienced local farmer tends your personal crop with 100% natural composting. Receive weekly video updates, soil sensor graphs, and deliver the seasonal yield to your front door.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/reserve-farmland" className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-medium text-on-primary transition-opacity hover:opacity-95">
                    <span>Explore Available Plots</span>
                    <span className="material-symbols-outlined text-sm">travel_explore</span>
                  </Link>
                  <Link to="/how-it-works" className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-5 text-xs font-medium text-on-surface transition-colors hover:border-outline">
                    How Farmland Leasing Works
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                  <div className="relative h-56 w-full bg-cover bg-center" style={{ backgroundImage: "url('/img/p05.jpg')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-on-surface backdrop-blur-md">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      <span>Channapatna Block #08</span>
                    </div>
                    <div className="absolute right-4 bottom-3 left-4 flex items-end justify-between text-white">
                      <div>
                        <span className="block text-[10px] tracking-wider text-white/70 uppercase">Crop Phase</span>
                        <span className="font-serif text-lg">Germination (Day 18)</span>
                      </div>
                      <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white">2 Plots Left</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 text-xs">
                    <div>
                      <span className="block text-[11px] text-on-surface-variant">Managed by</span>
                      <span className="font-medium text-on-surface">Ramesh Gowda (3rd Gen Farmer)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-serif text-xl text-on-surface">₹4,200</span>
                      <span className="text-[11px] font-light text-on-surface-variant"> / mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ROLES */}
        <Section className="py-20">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className={`${eyebrow} mb-2`}>Designed For The Entire Agrarian Lifecycle</span>
            <h2 className="mb-3 font-serif text-3xl font-normal text-on-surface sm:text-4xl">Choose your role.</h2>
            <p className="text-xs font-light text-on-surface-variant sm:text-sm">From cultivation and quality audits to consumer baskets and cold-pool management.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/farmer', label: 'Open Farmer', icon: 'agriculture', tone: 'text-primary', n: '01 / GROWER', name: 'Farmer', body: 'List harvested lots directly at true value, lease fractional farmland, and broadcast real-time harvest alerts.', cta: 'Farmer Portal' },
              { to: '/customer', label: 'Open Customer', icon: 'shopping_basket', tone: 'text-secondary', n: '02 / BUYER', name: 'Customer', body: 'Source pristine produce harvested within hours, track geo-tagged crop certifications, or subscribe to plots.', cta: 'Start Ordering' },
              { to: '', label: '', icon: 'biotech', tone: 'text-tertiary', n: '03 / AUDITOR', name: 'Inspector', body: 'Conduct on-site soil and produce checks. Log refractometer readings, pesticide strip scans, and batch seals.', cta: 'Audit Console' },
              { to: '/admin', label: 'Open Admin', icon: 'query_stats', tone: 'text-primary', n: '04 / OPERATIONS', name: 'Admin', body: 'Approve farmer credentials, calculate cold-route pooling density, analyze cluster demand surges, and manage dispute resolutions.', cta: 'Operations Hub' },
            ].map((r) => {
              const inner = (
                <>
                  <div>
                    <div className={`mb-5 flex size-10 items-center justify-center rounded-xl border border-border bg-surface transition-transform group-hover:scale-105 ${r.tone}`}>
                      <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                    </div>
                    <span className="mb-1 block font-mono text-[11px] text-on-surface-variant">{r.n}</span>
                    <h3 className="mb-2 font-serif text-xl font-normal text-on-surface">{r.name}</h3>
                    <p className="mb-6 text-xs leading-relaxed font-light text-on-surface-variant">{r.body}</p>
                  </div>
                  <div className={`flex items-center justify-between border-t border-border pt-4 text-xs font-medium ${r.tone === 'text-tertiary' ? 'text-on-surface' : r.tone}`}>
                    <span>{r.cta}</span>
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </div>
                </>
              )
              const cls = 'group flex flex-col justify-between rounded-2xl border border-border bg-surface-card p-6 text-left transition-all hover:border-outline'
              return r.to ? (
                <Link key={r.name} to={r.to} aria-label={r.label} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={r.name} type="button" onClick={() => notify('Inspectors use the Farm field app on their phone.')} className={cls}>
                  {inner}
                </button>
              )
            })}
          </div>
        </Section>

        {/* CAPSTONE */}
        <Section>
          <div className="flex flex-col items-center justify-between gap-8 rounded-3xl border border-border bg-surface-card p-8 sm:p-10 lg:flex-row">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Course Capstone Initiative</span>
              </div>
              <h3 className="mb-2 font-serif text-2xl font-normal text-on-surface sm:text-3xl">Guided by Dr. Gagan Sir &amp; Student Research Team</h3>
              <p className="text-xs leading-relaxed font-light text-on-surface-variant sm:text-sm">
                Pioneering computational supply-chain optimization for localized Indian agriculture. Built with micro-route consolidation, decentralized batch verification, and fair price discovery.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link to="/how-it-works" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-medium text-on-primary transition-opacity hover:opacity-95 sm:w-auto">
                <span>View Technical Whitepaper</span>
                <span className="material-symbols-outlined text-sm">menu_book</span>
              </Link>
              <Link to="/team" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-5 text-xs font-medium text-on-surface transition-colors hover:border-outline sm:w-auto">
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Meet the Collective</span>
              </Link>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  )
}
