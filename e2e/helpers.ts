import { expect, test as base, type Page } from '@playwright/test'

export const DEMO = {
  password: 'Farm@12345',
  farmer: '+919100000001', // Ramesh Sahu: listings, orders, payouts, plots
  farmerWithCrops: '+919100000005', // Dinesh Tandon: growing crops with photos
  customer: '+919200000005', // Sanjay Dubey: an active reservation with a crop timeline
  inspector: '+919300000001',
  admin: { phone: '+919999999999', password: 'DemoAdmin@2026' },
}

/** Fails a test on any console error, uncaught exception or 5xx answer from the API. */
export const test = base.extend<{ problems: string[] }>({
  problems: async ({ page }, use) => {
    const problems: string[] = []
    page.on('console', (m) => {
      // Map tiles come from OpenStreetMap; a blocked tile must not fail the suite.
      if (m.type() === 'error' && !/tile\.openstreetmap|ERR_(CONNECTION|NAME|INTERNET)/.test(m.text() + (m.location().url ?? ''))) problems.push(m.text())
    })
    page.on('pageerror', (e) => problems.push(String(e)))
    page.on('response', (r) => r.status() >= 500 && problems.push(`${r.status()} ${r.url()}`))
    await use(problems)
    expect(problems, 'console errors, uncaught exceptions or 5xx answers').toEqual([])
  },
})
export { expect }

export async function signIn(page: Page, phone: string, password = DEMO.password) {
  await page.goto('/login')
  await page.getByLabel('Phone number').fill(phone)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/(farmer|customer|inspector|admin)\//)
}

/** The main navigation of the current section (sidebar on desktop, bottom bar on mobile). */
export const nav = (page: Page) => page.getByRole('navigation', { name: /pages$/ }).filter({ visible: true })

export function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
}
