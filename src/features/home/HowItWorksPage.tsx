import { useEffect } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

const STEPS = [
  { icon: 'agriculture', title: 'Farmer lists the harvest', body: 'A verified farmer adds the crop, quantity, price and a photo taken at the farm gate. The photo location is checked against the farm.' },
  { icon: 'fact_check', title: 'Inspector grades it', body: 'Before dispatch an inspector checks moisture, pests and weight, and grades the batch A, B or C.' },
  { icon: 'hub', title: 'Deliveries are pooled', body: 'Nearby orders are grouped into one shared route every night, assigned to the least-loaded delivery partner.' },
  { icon: 'local_shipping', title: 'Next-day delivery', body: 'Most orders arrive the next morning. Farther farms add a day on the road. You see the estimate before you buy.' },
]
const LAND = [
  { icon: 'pin_drop', title: 'Find a plot', body: 'Search a place and pick an open plot on the map, with its season, size and price per kg.' },
  { icon: 'handshake', title: 'Request and agree', body: 'The farmer has 48 hours to accept. On acceptance a reservation agreement is created.' },
  { icon: 'potted_plant', title: 'Follow the crop', body: 'Photo updates arrive through Sown, Growing and Flowering, until the harvest is ready.' },
  { icon: 'inventory_2', title: 'Take the harvest', body: 'Choose delivery to your door, or let the platform buy it back from you.' },
]

function Steps({ items }: { items: typeof STEPS }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={s.title} className="rounded-2xl border border-border bg-surface-card p-7 transition-colors hover:border-outline">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs text-on-surface-variant">0{i + 1}</span>
            <span className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-primary">
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </span>
          </div>
          <h3 className="mb-2 font-serif text-xl font-normal text-on-surface">{s.title}</h3>
          <p className="text-xs leading-relaxed font-light text-on-surface-variant">{s.body}</p>
        </div>
      ))}
    </div>
  )
}

export function HowItWorksPage() {
  useEffect(() => {
    document.title = 'How it works | Farm Platform'
  }, [])
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-16 lg:px-12">
        <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <span className="mb-3 text-xs font-medium tracking-widest text-primary uppercase">Research Collective &amp; Protocol</span>
          <h1 className="mb-4 font-serif text-4xl font-normal text-on-surface sm:text-5xl">How direct harvesting &amp; farmland leases work.</h1>
          <p className="text-base leading-relaxed font-light text-on-surface-variant">
            Two products on one platform: fresh produce delivered next day, and farmland you can reserve and follow
            from sowing to harvest.
          </p>
        </div>
        <h2 className="mb-6 font-serif text-2xl font-normal text-on-surface">Fresh produce</h2>
        <Steps items={STEPS} />
        <h2 className="mt-16 mb-6 font-serif text-2xl font-normal text-on-surface">Reserve farmland</h2>
        <Steps items={LAND} />
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          <Link to="/catalog" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-on-primary">Explore produce</Link>
          <Link to="/reserve-farmland" className="rounded-xl border border-border px-5 py-2.5 text-xs text-on-surface hover:border-outline">Explore farmland</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
