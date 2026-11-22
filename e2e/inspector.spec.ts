import { DEMO, expect, signIn, test } from './helpers'

test('inspector: open inspections can be claimed', async ({ page, problems }) => {
  await signIn(page, DEMO.inspector)
  await expect(page).toHaveURL(/\/inspector\/inspections/)
  await expect(page.getByRole('heading', { name: 'Waiting for an inspector' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Claim' }).first()).toBeVisible()
  expect(problems).toEqual([])
})
