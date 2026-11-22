import { useEffect } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { useAuth } from '@/features/auth/authContext'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { ShopBrowser } from './ShopBrowser'
import { useCart } from './shop'

/** The produce catalog for everyone: browse without an account; an account is only needed to check out. */
export function CatalogPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const cart = useCart().length
  useEffect(() => {
    document.title = `${t('Fresh produce near you')} | Farm Platform`
  }, [t])
  const isCustomer = !!user?.roles.includes('customer')

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-16 sm:px-8">
      <header className="flex items-center gap-4 py-5">
        <BrandMark />
        <nav aria-label={t('Site')} className="ml-auto flex items-center gap-4 text-[0.95rem] font-medium">
          <LanguageSwitch />
          {isCustomer && (
            <Link to="/customer/cart" className="font-semibold hover:text-primary">
              {t('Cart')}
              {cart > 0 && <span className="ml-1.5 rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">{cart}</span>}
            </Link>
          )}
          {user ? (
            <Link to="/" className="font-semibold hover:text-primary">
              {t('My account')}
            </Link>
          ) : (
            <Link to="/login" className="font-semibold hover:text-primary">
              {t('Sign in')}
            </Link>
          )}
        </nav>
      </header>
      <h1 className="font-display text-[2.4rem] leading-none sm:text-[3.2rem]">{t('Fresh produce near you')}</h1>
      <p className="mt-2 max-w-xl text-ink-soft">{t('Bought straight from farmers. See how fresh it is, how far it travels and who grew it.')}</p>
      {!user && (
        <p className="mt-3 rounded-lg bg-white p-3 text-sm">
          <Link to="/register" className="font-semibold text-primary underline">
            {t('Create an account')}
          </Link>{' '}
          {t('or')}{' '}
          <Link to="/login" className="font-semibold text-primary underline">
            {t('sign in')}
          </Link>{' '}
          {t('to check out. You can fill your cart first.')}
        </p>
      )}
      <ShopBrowser cartPath={isCustomer ? '/customer/cart' : '/login'} />
    </div>
  )
}
