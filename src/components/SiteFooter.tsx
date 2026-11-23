import { Link } from 'react-router'
import { BrandMark } from './BrandMark'

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-surface-container-lowest py-12">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-12">
        <BrandMark />
        <div className="flex flex-wrap justify-center gap-6 text-xs text-on-surface-variant">
          <Link to="/catalog" className="transition-colors hover:text-on-surface">Produce Marketplace</Link>
          <Link to="/reserve-farmland" className="transition-colors hover:text-on-surface">Farmland Reservation</Link>
          <Link to="/how-it-works" className="transition-colors hover:text-on-surface">Direct Verification</Link>
          <Link to="/team" className="transition-colors hover:text-on-surface">Growers collective</Link>
          <Link to="/register" className="transition-colors hover:text-on-surface">Create account</Link>
        </div>
        <p className="text-xs font-light text-on-surface-variant">© 2026 Farm Platform · A CSD course project, guided by Dr Gagan Sir.</p>
      </div>
    </footer>
  )
}
