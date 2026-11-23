import { Link } from 'react-router'
import { BrandMark } from './BrandMark'

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full bg-surface-container-lowest py-12">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-12">
        <BrandMark />
        <div className="flex flex-wrap justify-center gap-6 text-label-md text-on-surface-variant">
          <Link to="/catalog" className="transition-colors hover:text-on-surface">Produce marketplace</Link>
          <Link to="/reserve-farmland" className="transition-colors hover:text-on-surface">Farmland reservation</Link>
          <Link to="/how-it-works" className="transition-colors hover:text-on-surface">How it works</Link>
          <Link to="/team" className="transition-colors hover:text-on-surface">Our team</Link>
          <Link to="/register" className="transition-colors hover:text-on-surface">Create account</Link>
        </div>
        <p className="text-label-sm text-on-surface-variant">© 2026 Farm Platform · A CSD course project, guided by Dr Gagan Sir.</p>
      </div>
    </footer>
  )
}
