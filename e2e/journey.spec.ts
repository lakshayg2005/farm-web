import { type APIRequestContext, type Browser, type Page } from '@playwright/test'
import { DEMO, expect, signIn, test } from './helpers'

/**
 * Whole journeys through the website that need no demo data: each run makes its own farmer, customer
 * and delivery partner through the API (phones carry a run id), then works the screens. It writes
 * data, so run it on a local or test stack, not on a database people use.
 *
 *   E2E_API_URL=http://localhost/api/v1 pnpm e2e journey   (the default API)
 */
const API = process.env.E2E_API_URL ?? 'http://localhost/api/v1'
const run = String(Date.now()).slice(-6)
const phone = (kind: number, n: number) => `+9198${kind}${run}${n}`

interface Person {
  id: string
  phone: string
  token: string
}

async function call(ctx: APIRequestContext, method: string, path: string, token?: string, data?: unknown) {
  const res = await ctx.fetch(`${API}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
  })
  return { status: res.status(), body: res.status() === 204 ? null : await res.json().catch(() => null) }
}

async function ok(ctx: APIRequestContext, method: string, path: string, token?: string, data?: unknown) {
  const r = await call(ctx, method, path, token, data)
  expect(r.status, `${method} ${path}: ${JSON.stringify(r.body)}`).toBeLessThan(300)
  return r.body
}

async function admin(ctx: APIRequestContext) {
  return (await ok(ctx, 'POST', '/identity/login', undefined, { phone: DEMO.admin.phone, password: DEMO.admin.password })).accessToken as string
}

/** Registers and signs in; a farmer is verified by the admin unless `verify` is false. */
async function person(ctx: APIRequestContext, name: string, phoneNo: string, roles: string[], verify = true, home?: [number, number]) {
  const user = await ok(ctx, 'POST', '/identity/register', undefined, {
    name: `Journey ${name}`,
    phone: phoneNo,
    password: DEMO.password,
    roles,
    ...(home ? { homeLat: home[0], homeLng: home[1] } : {}),
  })
  if (roles.includes('farmer') && verify) await ok(ctx, 'POST', `/identity/users/${user.id}/verify-farmer`, await admin(ctx))
  const login = await ok(ctx, 'POST', '/identity/login', undefined, { phone: phoneNo, password: DEMO.password })
  return { id: user.id, phone: phoneNo, token: login.accessToken } as Person
}

async function until<T>(what: string, check: () => Promise<T | null | undefined | false>, seconds = 45): Promise<T> {
  const end = Date.now() + seconds * 1000
  for (;;) {
    const found = await check()
    if (found) return found
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`)
    await new Promise((r) => setTimeout(r, 1000))
  }
}

async function pageFor(browser: Browser, who: string, password?: string): Promise<Page> {
  const page = await browser.newPage()
  await signIn(page, who, password)
  return page
}

const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10) // India date

test.describe('journeys on an empty stack', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('a new farmer waits for the admin, then may set up a farm', async ({ page, browser, request, problems }) => {
    const farmer = await person(request, 'Waiting Farmer', phone(1, 1), ['farmer'], false)

    await signIn(page, farmer.phone)
    await page.goto('/farmer/listings')
    await expect(page.getByRole('note')).toContainText('Waiting for verification')
    await expect(page.getByText(/Once an admin verifies you, set up your farm here/)).toBeVisible()
    const refused = await call(request, 'POST', '/catalog/farms', farmer.token, {
      name: 'Too early',
      district: 'Durg',
      location: { type: 'Point', coordinates: [81.3, 21.2] },
    })
    expect(refused.body.error.code).toBe('FARMER_NOT_VERIFIED')

    const adminPage = await pageFor(browser, DEMO.admin.phone, DEMO.admin.password)
    await adminPage.goto('/admin/verification')
    await adminPage.getByRole('button', { name: 'Verify Journey Waiting Farmer' }).click()
    await expect(adminPage.getByRole('button', { name: 'Verify Journey Waiting Farmer' })).toHaveCount(0)
    await adminPage.close()

    await page.reload() // the session is renewed and says the farmer is verified
    await expect(page.getByRole('note')).toHaveCount(0)
    await expect(page.getByText(/Once an admin verifies you/)).toHaveCount(0)
    expect(problems).toEqual([])
  })

  test('produce: the farmer packs, the admin pools, the customer reads the code, rates', async ({ page, browser, request, problems }) => {
    const at: [number, number] = [21.31 + Math.random() * 0.02, 81.62 + Math.random() * 0.02]
    const farmer = await person(request, 'Produce Farmer', phone(2, 1), ['farmer'], true)
    const customer = await person(request, 'Produce Customer', phone(2, 2), ['customer'])
    const partner = await person(request, 'Produce Partner', phone(2, 3), ['delivery'], true, at)
    const point = { type: 'Point', coordinates: [at[1], at[0]] }
    const farm = await ok(request, 'POST', '/catalog/farms', farmer.token, { name: `Journey Farm ${run}`, district: 'Raipur', location: point })
    const listing = await ok(request, 'POST', '/catalog/listings', farmer.token, {
      farmId: farm.id, cropId: 'tomato', qtyAvailable: 50, unit: 'kg', pricePerUnit: 30, harvestDate: today(),
    })
    const intent = await ok(request, 'POST', '/order/orders/payments/intent', customer.token, { amount: 1, kind: 'FULL' })
    const res = await request.fetch(`${API}/order/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer.token}`, 'Idempotency-Key': `journey-web-${run}` },
      data: {
        items: [{ listingId: listing.id, qty: 3 }],
        deliveryAddress: { line1: '4 Journey Road', city: 'Raipur', pincode: '492001', contactPhone: customer.phone, location: { type: 'Point', coordinates: [at[1] + 0.005, at[0] + 0.005] } },
        deliveryDate: today(),
        paymentIntentId: intent.id,
      },
    })
    const order = (await res.json()).orders[0]

    // the farmer packs on the website: no quality check, it is ready for a partner at once
    const farmerPage = await pageFor(browser, farmer.phone)
    await farmerPage.goto('/farmer/orders')
    await farmerPage.getByRole('button', { name: 'Mark packed' }).first().click()
    await until('the order to be ready for dispatch', async () => (await ok(request, 'GET', `/order/orders/${order.id}`, customer.token)).status === 'READY_FOR_DISPATCH')
    await farmerPage.close()

    // the admin runs pooling for today on the website
    const adminPage = await pageFor(browser, DEMO.admin.phone, DEMO.admin.password)
    await adminPage.goto('/admin/pooling')
    await adminPage.getByRole('button', { name: /Run pooling/ }).click()
    await until('the order to be on a route', async () => (await ok(request, 'GET', `/order/orders/${order.id}`, customer.token)).status === 'POOLED')
    await adminPage.close()

    // the customer sees the delivery code; the partner's route never shows it
    await signIn(page, customer.phone)
    await page.goto('/customer/orders')
    await page.getByRole('button', { name: /On a route/ }).first().click()
    const codeText = await page.getByText(/Delivery code/).first().textContent()
    const code = codeText?.match(/\d{4}/)?.[0]
    expect(code, 'the delivery code is shown to the customer').toBeTruthy()
    const route = await ok(request, 'GET', `/logistics/my-route?pool_date=${today()}`, partner.token)
    expect(route.stops.every((s: { otp: string | null }) => s.otp === null)).toBe(true)
    for (const s of route.stops.filter((x: { orderId: string; stopType: string }) => x.orderId === order.id && x.stopType === 'PICKUP'))
      await ok(request, 'POST', `/logistics/stops/${s.id}/pickup`, partner.token, {})
    const drop = route.stops.find((x: { orderId: string; stopType: string }) => x.orderId === order.id && x.stopType === 'DROP')
    expect(drop.customerPhone).toBe(customer.phone)
    const wrong = await call(request, 'POST', `/logistics/stops/${drop.id}/deliver`, partner.token, { photoMediaId: crypto.randomUUID(), otp: code === '0000' ? '1111' : '0000' })
    expect(wrong.status).toBe(422)
    await ok(request, 'POST', `/logistics/stops/${drop.id}/deliver`, partner.token, { photoMediaId: crypto.randomUUID(), otp: code })
    await until('the order to complete', async () => (await ok(request, 'GET', `/order/orders/${order.id}`, customer.token)).status === 'COMPLETED')

    await page.reload()
    await page.getByRole('tab', { name: /Delivered|Done|Completed/ }).first().click().catch(() => undefined)
    await page.getByRole('button', { name: /Completed/ }).first().click()
    await page.getByRole('radio', { name: '5 stars' }).click()
    await page.getByRole('button', { name: 'Send rating' }).click()
    await expect(page.getByText('You rated this order')).toBeVisible()
    expect(problems).toEqual([])
  })

  test('land: the farmer records the harvest weight, the customer chooses buy-back and sees the money', async ({ page, browser, request, problems }) => {
    const at = [22.4 + Math.random() * 0.2, 80.4 + Math.random() * 0.2]
    const farmer = await person(request, 'Land Farmer', phone(3, 1), ['farmer'])
    const customer = await person(request, 'Land Customer', phone(3, 2), ['customer'])
    const ring = [[at[1], at[0]], [at[1] + 0.002, at[0]], [at[1] + 0.002, at[0] + 0.002], [at[1], at[0] + 0.002], [at[1], at[0]]]
    const plot = await ok(request, 'POST', '/land/plots', farmer.token, { title: `Journey field ${run}`, boundary: { type: 'Polygon', coordinates: [ring] } })
    const end = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)
    const season = await ok(request, 'POST', `/land/plots/${plot.id}/seasons`, farmer.token, { season: 'Rabi', startDate: today(), endDate: end, price: 30, allowedCrops: ['wheat'] })
    const reservation = await ok(request, 'POST', '/land/reservations', customer.token, { plotSeasonId: season.id, cropId: 'wheat', expectedQtyKg: 100 })
    const accepted = await ok(request, 'POST', `/land/reservations/${reservation.id}/accept`, farmer.token)
    await until('the deposit to be taken', async () => {
      const r = await call(request, 'POST', '/order/orders/payments/intent', customer.token, { amount: accepted.deposit, kind: 'DEPOSIT', referenceId: reservation.id })
      return r.status === 201
    })
    await until('the reservation to be active', async () =>
      ((await ok(request, 'GET', '/land/reservations/mine', customer.token)) as { id: string; status: string }[]).some((r) => r.id === reservation.id && r.status === 'ACTIVE'),
    )

    const farmerPage = await pageFor(browser, farmer.phone)
    await farmerPage.goto('/farmer/crops')
    await farmerPage.getByRole('button', { name: 'Mark ready to harvest' }).click()
    await farmerPage.getByRole('spinbutton', { name: /Harvested/ }).fill('95')
    await farmerPage.getByRole('button', { name: 'Yes, it is harvested' }).click()
    await expect(farmerPage.getByText(/Harvested\./).first()).toBeVisible()
    await farmerPage.close()

    await signIn(page, customer.phone)
    await until('the harvest order', async () => {
      await page.goto('/customer/reservations')
      return page.getByText('95 kg harvested').waitFor({ timeout: 5000 }).then(() => true, () => false)
    })
    // 95 kg at 30 = 2,850; 600 deposit paid, so 2,250 is due; buy-back credits 90% = 2,565
    await expect(page.getByText(/You pay the balance of ₹2,250 now; the farmer sells the harvest and credits you ₹2,565/)).toBeVisible()
    await page.getByLabel(/Let the farmer buy it back/).check()
    await page.getByRole('button', { name: 'Confirm my choice' }).click()
    await expect(page.getByText(/You chose buy-back/)).toBeVisible({ timeout: 15_000 })
    await until('the reservation to complete', async () =>
      ((await ok(request, 'GET', '/land/reservations/mine', customer.token)) as { id: string; status: string }[]).some((r) => r.id === reservation.id && r.status === 'COMPLETED'),
    )
    expect(problems).toEqual([])
  })
})
