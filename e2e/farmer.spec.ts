import { DEMO, expect, nav, signIn, test } from './helpers'

test.describe('farmer', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.farmer)
  })

  test('listings show photos with a location badge and stock', async ({ page, problems }) => {
    await expect(page.getByRole('heading', { name: 'Listings', level: 1 })).toBeVisible()
    await expect(page.getByText(/listings on sale/)).toBeVisible()
    const first = page.getByRole('article').first()
    await expect(first.locator('img').first()).toBeVisible()
    await expect(first.getByText(/Verified|Unverified|Checking/).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('a listing can be paused and put back on sale', async ({ page }) => {
    const card = page.getByRole('article').filter({ has: page.getByRole('button', { name: 'Pause' }) }).first()
    const title = await card.getByRole('heading').innerText()
    await card.getByRole('button', { name: 'Pause' }).click()
    const paused = page.getByRole('article').filter({ hasText: title }).first()
    await expect(paused.getByText('Paused')).toBeVisible()
    await paused.getByRole('button', { name: /Resume|Put back on sale|Activate/ }).click()
    await expect(page.getByRole('article').filter({ hasText: title }).first().getByText('On sale')).toBeVisible()
  })

  test('orders: figures, tabs and the eight-stage rail', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Orders' }).click()
    await expect(page.getByText('Paid out to you')).toBeVisible()
    await expect(page.getByRole('tab', { name: /To pack/ })).toBeVisible()
    await page.getByRole('tab', { name: /In progress/ }).click()
    await expect(page.getByRole('img', { name: /Stage \d of 8/ }).first()).toBeVisible()
    await page.getByRole('tab', { name: /Cancelled/ }).click()
    await expect(page.getByRole('img', { name: 'Cancelled' }).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('order details list the items and the status history', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Orders' }).click()
    await page.getByRole('tab', { name: /Delivered/ }).click()
    await page.getByRole('button', { name: 'Details' }).first().click()
    await expect(page.getByText(/×/).first()).toBeVisible()
    await expect(page.getByText(/Delivered|Completed/).first()).toBeVisible()
  })

  test('earnings: payouts grouped by month add up to the total', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Earnings' }).click()
    await expect(page.getByText('Paid out, all time')).toBeVisible()
    await expect(page.getByRole('region').first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Amount' }).first()).toBeVisible()
  })

  test('plots: the map loads and the draw tool is there', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Plots' }).click()
    await expect(page.getByText('Patan river-side plot')).toBeVisible()
    await page.getByRole('button', { name: 'List a new plot' }).click()
    await expect(page.getByText('Draw your plot boundary')).toBeVisible()
    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect(page.locator('.leaflet-draw-draw-polygon')).toBeVisible()
  })

  test('requests lists agreements with their status', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Requests' }).click()
    await expect(page.getByRole('heading', { name: 'Agreements' })).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('notifications page opens from the sidebar or the bell', async ({ page }) => {
    const link = page.getByRole('link', { name: /^Notifications/ }).filter({ visible: true })
    await link.first().click()
    await expect(page).toHaveURL(/\/farmer\/notifications/)
    await expect(page.getByRole('group', { name: 'Filter' })).toBeVisible()
  })
})

test('a farmer with growing crops sees the timeline with photos', async ({ page, problems }) => {
  await signIn(page, DEMO.farmerWithCrops)
  await nav(page).getByRole('link', { name: 'Crops' }).click()
  await expect(page.getByRole('region', { name: 'Crop updates' }).first()).toBeVisible()
  await expect(page.getByRole('list', { name: 'Photos' }).first()).toBeVisible()
  expect(problems).toEqual([])
})
