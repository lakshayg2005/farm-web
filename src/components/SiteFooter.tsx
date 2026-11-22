import { Link } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'

/** Footer: the same layout as AINow's (brand on the left, link columns on the right). */
export function SiteFooter() {
  const { user } = useAuth()
  return (
    <footer className="border-t border-gray-800 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold">Farm Platform</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
              Fresh produce straight from verified farmers, or a plot of farmland to follow from sowing to harvest.
            </p>
          </div>

          <div className="flex gap-12">
            <FooterCol
              title="Explore"
              links={[
                ['/', 'Home'],
                ['/catalog', 'Fresh produce'],
                ['/customer/plots', 'Reserve farmland'],
                ['/team', 'Our team'],
              ]}
            />
            <FooterCol
              title="Account"
              links={
                user
                  ? [[homePathFor(user), 'Dashboard']]
                  : [
                      ['/register', 'Register'],
                      ['/login', 'Login'],
                    ]
              }
            />
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Farm Platform. A CSD course project, guided by Dr Gagan Sir.
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-gray-500">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="block hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
