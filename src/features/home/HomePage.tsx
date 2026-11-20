import { useEffect } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { sections } from '@/routes/sections'

// The page follows AINow's Home exactly: black hero, white "why" section with numbered cards,
// black preview section with one big bordered card, then the footer.

const STEPS = [
  { title: 'Fresh', body: 'Every listing shows the day it was harvested and when it will reach your door, so you always know what you are buying.' },
  { title: 'Graded', body: 'An inspector checks moisture, pests and weight, and grades every batch A, B or C with geo-tagged photos.' },
  { title: 'Pooled', body: 'Nearby orders share one delivery route every night, cutting kilometres, cost and emissions.' },
]

export function HomePage() {
  useEffect(() => {
    document.title = 'Farm Platform'
  }, [])

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-24">
          <div className="max-w-4xl">
            <div className="mb-8 inline-flex rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300">
              ✦ Fresh produce and farmland, straight from the farmer
            </div>

            <h1 className="text-5xl leading-tight font-bold tracking-tight md:text-7xl">
              From the Farmer’s Field
              <span className="block text-gray-400">to Your Table.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400 md:text-xl">
              Farm Platform brings you produce harvested days ago from verified farmers near you, graded by inspectors
              and delivered on shared routes. Or reserve a plot of farmland and follow your crop until harvest.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/catalog"
                className="rounded-xl bg-white px-7 py-3.5 text-center font-semibold text-black transition hover:bg-gray-200"
              >
                Browse Fresh Produce →
              </Link>
              <Link
                to="/customer/plots"
                className="rounded-xl border border-gray-700 px-7 py-3.5 text-center font-semibold text-white transition hover:bg-gray-900"
              >
                Reserve Farmland
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">No middlemen. Just fresh produce from farms you can trace.</p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="how" className="bg-white py-24 text-black">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Why Farm Platform</p>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Fresh food,
              <br />
              without the middlemen.
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-gray-200 p-8">
                <span className="text-sm font-medium text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-8 text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 leading-7 text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured produce, in the shape of AINow's latest-issue card */}
      <section className="bg-black py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">On the catalog today</p>
              <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                What farmers near you
                <br />
                are offering.
              </h2>
            </div>
            <Link to="/catalog" className="w-fit text-gray-400 transition hover:text-white">
              View all produce →
            </Link>
          </div>

          <Link
            to="/catalog"
            className="group mt-14 block overflow-hidden rounded-3xl border border-gray-800 transition hover:border-gray-600"
          >
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col p-8 md:p-12">
                <span className="w-fit rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 uppercase">
                  Peak fresh · Harvested today
                </span>
                <h3 className="mt-8 text-3xl font-bold md:text-4xl">Desi Tomato from Hariyali Farms</h3>
                <p className="mt-6 leading-7 text-gray-400">
                  Grade A, organic, 6 km from you at ₹32 per kg. Packed and quality-checked today, on tomorrow
                  morning’s shared route, at your door by 11 am.
                </p>
                <span className="mt-8 w-fit rounded-xl bg-white px-6 py-3 font-semibold text-black transition group-hover:bg-gray-200">
                  Open the catalog →
                </span>
              </div>
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-neutral-900 to-black md:min-h-[350px]">
                <span className="text-8xl transition duration-500 group-hover:scale-110" aria-hidden>
                  🍅
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Sections */}
      <section className="bg-white py-24 text-black">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">One platform, four roles</p>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">Choose your section.</h2>
          </div>
          <nav aria-label="Sections" className="mt-16">
            <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {sections.map((section, i) => (
                <li key={section.role}>
                  <Link
                    to={`/${section.role}`}
                    className="group flex h-full flex-col rounded-2xl border border-gray-200 p-8 transition hover:border-black"
                  >
                    <span className="text-sm font-medium text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mt-8 text-2xl font-bold">{section.label}</span>
                    <span className="mt-4 flex-1 leading-7 text-gray-600">{section.audience}</span>
                    <span className="mt-6 font-semibold">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
