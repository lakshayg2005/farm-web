import { useEffect } from 'react'
import { Link } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'
import { useAuth } from '@/features/auth/authContext'
import { useI18n } from '@/i18n/i18n'
import { ShopBrowser } from './ShopBrowser'

/** The produce catalog for everyone: browse without an account; an account is only needed to check out. */
export function CatalogPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  useEffect(() => {
    document.title = `${t('Fresh produce near you')} | Farm Platform`
  }, [t])
  const isCustomer = !!user?.roles.includes('customer')

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-16 sm:px-8">
      <SiteHeader />
      <h1 className="mt-6 font-display text-[2.4rem] leading-none sm:text-[3.2rem]">{t('Fresh produce near you')}</h1>
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
