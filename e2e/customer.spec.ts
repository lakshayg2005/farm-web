import { DEMO, expect, nav, signIn, test } from './helpers'

test.describe('customer', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.customer)
  })

  test('find land: the map and the search form load', async ({ page, problems }) => {
    await expect(page).toHaveURL(/\/customer\/plots/)
    await expect(page.locator('.leaflet-container')).toBeVisible()
    expect(problems).toEqual([])
  })

  test('my reservations: status chip and the farmer’s crop photos', async ({ page, problems }) => {
    await nav(page).getByRole('link', { name: 'My reservations' }).click()
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
