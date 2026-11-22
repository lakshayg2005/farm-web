import { DEMO, expect, nav, signIn, test } from './helpers'

test.describe('customer', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.customer)
  })

  test('shop: produce cards with price, freshness and distance load', async ({ page, problems }) => {
    await expect(page).toHaveURL(/\/customer\/shop/)
    await expect(page.getByRole('list').getByRole('button', { name: /per (kg|quintal|piece|dozen|bunch)/ }).first()).toBeVisible()
    await expect(page.getByText(/Harvested/).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('buy: add to cart, check the totals and the address form', async ({ page, problems }) => {
    await page.getByRole('list').getByRole('button', { name: /per (kg|quintal|piece|dozen|bunch)/ }).first().click()
    await page.getByRole('button', { name: /Add to cart/ }).click()
    await expect(page.getByRole('status')).toContainText('in your cart')
    await page.keyboard.press('Escape')
    await nav(page).getByRole('link', { name: /^Cart/ }).click()
    await expect(page.getByText('Delivery (1 farm)')).toBeVisible()
    await page.getByRole('button', { name: /place order/ }).click()
    await expect(page.getByRole('alert')).toContainText('street')
    expect(problems).toEqual([])
  })

  test('orders: the list loads', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Orders' }).click()
    await expect(page.getByRole('tablist', { name: 'Order status' })).toBeVisible()
    expect(problems).toEqual([])
  })

  test('find land: the map and the search form load', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Find land' }).click()
    await expect(page).toHaveURL(/\/customer\/plots/)
    await expect(page.locator('.leaflet-container')).toBeVisible()
    expect(problems).toEqual([])
  })

  test('my reservations: status chip and the farmer’s crop photos', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'Reservations' }).click()
    await expect(page.getByText('Growing').first()).toBeVisible()
    const timeline = page.getByRole('list', { name: 'Crop updates' }).first()
    await expect(timeline).toBeVisible()
    const photos = timeline.getByRole('list', { name: 'Photos' }).first()
    await expect(photos.locator('img').first()).toBeVisible()
    await expect.poll(() => photos.locator('img').first().evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    expect(problems).toEqual([])
  })

  test('notifications: customers see their order and payment updates', async ({ page }) => {
    await page.getByRole('link', { name: /^Notifications/ }).filter({ visible: true }).first().click()
    await expect(page.getByRole('group', { name: 'Filter' })).toBeVisible()
  })
})
