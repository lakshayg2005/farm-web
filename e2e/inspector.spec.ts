import { DEMO, expect, noHorizontalScroll, signIn, test } from './helpers'

test('inspector: open inspections can be claimed', async ({ page, problems }) => {
  await signIn(page, DEMO.inspector)
  await expect(page).toHaveURL(/\/inspector\/inspections/)
  await expect(page.getByRole('heading', { name: 'Waiting for an inspector' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Claim' }).first()).toBeVisible()
  expect(problems).toEqual([])
})

test('inspector on a phone: controls are big enough to tap and nothing scrolls sideways', async ({ page, problems }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, DEMO.inspector)
  await expect(page.getByRole('heading', { name: 'Waiting for an inspector' })).toBeVisible()
  expect(await noHorizontalScroll(page)).toBe(true)

  for (const control of [page.getByRole('button', { name: 'Share my location' }), page.getByRole('button', { name: 'Claim' }).first()]) {
    const box = await control.boundingBox()
    expect(Math.round(box!.height), 'touch target height in px').toBeGreaterThanOrEqual(48)
  }
  await page.screenshot({ path: 'e2e/screenshots/inspector-queue-phone.png', fullPage: true })
  expect(problems).toEqual([])
})
