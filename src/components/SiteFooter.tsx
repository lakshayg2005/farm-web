import { Link } from 'react-router'
import { BrandMark } from './BrandMark'

/** Footer for the public pages. */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-forest-deep text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <BrandMark tone="light" />
          <p className="mt-4 text-[0.95rem]">
            Fresh produce straight from verified farmers, quality-checked and delivered in shared, low-carbon routes.
            Or reserve a plot and follow your own crop to harvest.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={[
            ['/catalog', 'Fresh produce'],
            ['/customer/plots', 'Reserve farmland'],
            ['/customer/reservations', 'My reservations'],
          ]}
        />
        <FooterCol
          title="Work with us"
          links={[
            ['/register', 'Sell as a farmer'],
            ['/inspector', 'Quality inspectors'],
            ['/admin', 'Operations'],
          ]}
        />
        <FooterCol
          title="Project"
          links={[
            ['/team', 'Our team'],
            ['/#how', 'How it works'],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-white/50 sm:px-8">
          A CSD course project · Team 1 (apps) and Team 2 (website) · Guided by Dr Gagan Sir
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold tracking-wide text-white uppercase">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
