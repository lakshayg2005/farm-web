import { DEMO, expect, signIn, test } from './helpers'

test.describe('public pages and sign-in', () => {
  test('the start page is sign-in, with a way to create an account', async ({ page, problems }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in')
    await expect(page.getByLabel('Phone number')).toBeVisible()
    await page.getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create an account')
    await expect(page.getByText(/inspector/i)).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('a signed-in farmer goes straight from the start page to their workspace', async ({ page, problems }) => {
    await signIn(page, DEMO.farmer)
    await page.goto('/')
    await expect(page).toHaveURL(/\/farmer\/listings/)
    expect(problems).toEqual([])
  })

  test('a wrong password shows the server message and stays on the page', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Phone number').fill(DEMO.farmer)
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('empty fields are explained before anything is sent', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Enter your password.')).toBeVisible()
    await expect(page.getByText(/10-digit mobile number/)).toBeVisible()
  })

  test('each role lands in its own workspace, and others are turned away', async ({ page }) => {
    await signIn(page, DEMO.farmer)
    await expect(page).toHaveURL(/\/farmer\/listings/)
    await page.goto('/admin/dashboard')
    await expect(page).not.toHaveURL(/\/admin\//) // the guard sends a farmer back to their own section
    await page.getByRole('button', { name: 'Sign out' }).first().click()
    await page.goto('/farmer/orders')
    await expect(page).toHaveURL(/\/login/)
  })

  test('an unknown address gets the not-found page', async ({ page }) => {
    await page.goto('/no/such/page')
    await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible()
  })
})
