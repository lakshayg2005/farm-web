import { DEMO, expect, nav, signIn, test } from './helpers'

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.admin.phone, DEMO.admin.password)
  })

  test('dashboard shows real numbers, not dashes', async ({ page, problems }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    for (const label of ['Farmers waiting to be verified', 'Verified farmers', 'Customer rating', 'Kilometres saved today']) {
      await expect(page.getByText(label)).toBeVisible()
    }
    await expect(page.getByText('–')).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('dashboard charts orders per day and sums sales', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Orders per day' })).toBeVisible()
    await expect(page.getByRole('table', { name: /Orders and sales per day/ })).toBeAttached()
    await expect(page.getByText('Sales, last 14 days')).toBeVisible()
  })

  test('orders: filter, open details and see the cancel and refund action', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Orders' }).click()
    await expect(page.getByRole('tab', { name: /^All/ })).toBeVisible()
    await page.getByRole('tab', { name: /^Delivered/ }).click()
    await expect(page.getByRole('img', { name: /Stage 6 of 6/ }).first()).toBeVisible()
    await page.getByRole('tab', { name: /^Needs a step/ }).click()
    await expect(page.getByRole('button', { name: 'Cancel and refund' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Details' }).first().click()
    await expect(page.getByText(/×/).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('verification lists farmers waiting', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Verification' }).click()
    await expect(page.getByRole('button', { name: /Verify/ }).first()).toBeVisible()
  })

  test('pooling: the date picker, the run button and the map', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Pooling' }).click()
    await expect(page.getByLabel('Delivery date')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Run pooling' })).toBeVisible()
    await expect(page.locator('.leaflet-container')).toBeVisible()
    // The demo orders are due today, so today's date (the default) already has routes.
    await expect(page.getByText('No pools for this date yet')).toHaveCount(0)
    expect(problems).toEqual([])
  })
})
