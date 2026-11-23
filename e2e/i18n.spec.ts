import { DEMO, expect, noHorizontalScroll, signIn, test } from './helpers'

const HINDI = { name: 'हिन्दी' }
const ENGLISH = { name: 'English' }

test('hindi: the choice sticks across pages and reloads', async ({ page, problems }) => {
  await page.goto('/')
  await page.getByRole('button', HINDI).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('साइन इन करें')
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('साइन इन करें')

  await page.goto('/register')
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Create an account')
  await page.goto('/login')
  await expect(page.getByLabel('फ़ोन नंबर')).toBeVisible()

  await page.getByRole('button', ENGLISH).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in')
  expect(problems).toEqual([])
})

test('hindi: the farmer workspace reads in Hindi and fits a phone', async ({ page, problems }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await page.getByRole('button', HINDI).first().click()
  await page.getByLabel('फ़ोन नंबर').fill(DEMO.farmer)
  await page.getByLabel('पासवर्ड').fill(DEMO.password)
  await page.getByRole('button', { name: 'साइन इन करें' }).click()
  await page.waitForURL(/\/farmer\//)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('उपज की सूची')
  await expect(page.getByRole('button', { name: 'उपज जोड़ें' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'आपकी उपज की सूची' })).toBeVisible()
  expect(await noHorizontalScroll(page)).toBe(true)
  await page.screenshot({ path: 'e2e/screenshots/hindi-farmer-listings-mobile.png', fullPage: true })

  await page.getByRole('navigation', { name: /के पेज$/ }).filter({ visible: true }).getByRole('link', { name: 'ऑर्डर' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ऑर्डर')
  expect(await noHorizontalScroll(page)).toBe(true)

  await page.evaluate(() => localStorage.removeItem('farm.lang'))
  expect(problems).toEqual([])
})

test('farmer: the farm shows its rating on the listings page', async ({ page, problems }) => {
  await signIn(page, DEMO.farmer)
  await page.getByRole('navigation', { name: /pages$/ }).filter({ visible: true }).getByRole('link', { name: 'Listings' }).click()
  const farms = page.getByRole('list', { name: 'Your farms' })
  await expect(farms).toBeVisible()
  await expect(farms.getByText('Sahu Krishi Farm')).toBeVisible()
  // either a score from customers or the honest "not rated yet"
  await expect(farms.getByText(/Not rated yet|\(\d+ ratings?\)/)).toBeVisible()
  expect(problems).toEqual([])
})
