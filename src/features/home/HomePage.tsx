import { useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { CropRows } from '@/components/CropRows'
import { sections } from '@/routes/sections'
import type { Role } from '@/routes/types'

/** Each section is drawn as a field in an aerial patchwork: its own size and furrow angle. */
const fieldShape: Record<Role, { area: string; angle: string }> = {
  farmer: { area: 'lg:col-span-4 lg:row-span-2', angle: '-58deg' },
  customer: { area: 'lg:col-span-2 lg:row-span-2', angle: '24deg' },
  inspector: { area: 'lg:col-span-3', angle: '90deg' },
  admin: { area: 'lg:col-span-3', angle: '-24deg' },
}

export function HomePage() {
  useEffect(() => {
    document.title = 'Farm Platform'
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 pb-12 sm:px-8 lg:pt-10">
      <BrandMark />

      <div className="mt-12 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <header className="max-w-md lg:pt-4">
          <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-[3.4rem]">
            From the farmer’s field to your table
          </h1>
          <p className="mt-5 text-lg text-ink-soft">
            Farmers sell fresh produce and rent out plots of their land. Customers buy produce, or reserve a plot and
            follow their crop until harvest.
          </p>
          <p className="mt-8 font-semibold">Choose your section to get started.</p>
        </header>

        <nav aria-label="Sections">
          <ul className="grid gap-3 lg:auto-rows-[11rem] lg:grid-cols-6">
            {sections.map((section, i) => {
              const shape = fieldShape[section.role]
              return (
                <li key={section.role} className={shape.area}>
                  <Link
                    to={`/${section.role}`}
                    style={{ '--role': section.accent, '--rows-angle': shape.angle } as CSSProperties}
                    className="group relative flex h-full min-h-36 flex-col justify-end overflow-hidden rounded-xl bg-paper-deep p-3"
                  >
                    <CropRows delay={0.1 + i * 0.12} className="absolute inset-0" />
                    <span className="relative block max-w-xs rounded-lg bg-paper/95 px-4 py-3 shadow-[0_1px_0_var(--color-line)] transition-transform duration-200 group-hover:-translate-y-0.5">
                      <span className="block font-display text-xl leading-tight">{section.label}</span>
                      <span className="mt-0.5 block text-[0.94rem] leading-snug text-ink-soft">{section.audience}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
