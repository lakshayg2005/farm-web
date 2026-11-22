import { mkdirSync } from 'node:fs'
import { DEMO, expect, noHorizontalScroll, signIn, test } from './helpers'

/** Every page at phone and desktop width: nothing scrolls sideways, and a screenshot is kept for review. */
const journeys = [
  { role: 'public', phone: null, pages: ['/', '/login', '/team'] },
  { role: 'farmer', phone: DEMO.farmer, pages: ['listings', 'orders', 'plots', 'reservations', 'crops', 'earnings', 'notifications'] },
  { role: 'customer', phone: DEMO.customer, pages: ['plots', 'reservations', 'notifications'] },
  { role: 'inspector', phone: DEMO.inspector, pages: ['inspections'] },
  { role: 'admin', phone: DEMO.admin.phone, pages: ['dashboard', 'orders', 'verification', 'pooling'] },
]
const sizes = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]
mkdirSync('e2e/screenshots', { recursive: true })

for (const size of sizes) {
  for (const j of journeys) {
    test(`${j.role} at ${size.width}px`, async ({ page, problems }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      if (j.phone) await signIn(page, j.phone, j.role === 'admin' ? DEMO.admin.password : DEMO.password)
      for (const p of j.pages) {
        await page.goto(p.startsWith('/') ? p : `/${j.role}/${p}`)
        await page.waitForLoadState('networkidle')
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await noHorizontalScroll(page), `${j.role}/${p} scrolls sideways at ${size.width}px`).toBe(true)
        await page.screenshot({ path: `e2e/screenshots/${j.role}-${p.replace(/\W+/g, '_')}-${size.name}.png` })
      }
      expect(problems).toEqual([])
    })
  }
}
