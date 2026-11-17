import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'
import { stageReached, suggestedStage } from './reservations'

const R = (o: Record<string, unknown>) => ({
  id: 'r1',
  plotSeasonId: 'ps-1',
  customerId: 'c1',
  farmerId: 'u1',
  cropId: 'tomato',
  expectedQtyKg: 100,
  deposit: 800,
  total: 4000,
  status: 'ACTIVE',
  expiresAt: '2026-11-10T10:00:00Z',
  ...o,
})
const UPDATES = [
  { id: 'cu1', reservationId: 'r1', stage: 'SOWN', note: 'Seeds in the ground', mediaIds: ['m1'], createdAt: '2026-11-21T08:00:00Z' },
  { id: 'cu2', reservationId: 'r1', stage: 'GROWING', note: null, mediaIds: [], createdAt: '2026-12-10T08:00:00Z' },
]
const MEDIA = {
  id: 'm1', ownerType: 'RESERVATION', ownerId: 'r1', status: 'READY', url: 'http://m/p.jpg', thumbUrl: 'http://m/t.jpg',
  isGeoVerified: false, geoStatus: 'TOO_FAR', distanceM: 850, exifTime: null, rejectReason: null, createdAt: '',
}

function farmer(handlers: Record<string, (body: unknown) => Response>) {
  session.refreshToken = 'refresh-1'
  return mockApi({
    'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
    'GET /catalog/crops': () => jsonResponse([{ id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' }]),
    'GET /land/plots/mine': () => jsonResponse([{ id: 'p1', title: 'Riverside plot', areaAcres: 2.5, status: 'ACTIVE' }]),
    'GET /land/plots/p1/seasons': () =>
      jsonResponse([{ id: 'ps-1', plotId: 'p1', season: 'Rabi', startDate: '2026-11-20', endDate: '2027-03-15', price: 40, allowedCrops: [] }]),
    'GET /media/owners/RESERVATION/r1': () => jsonResponse({ items: [MEDIA], nextCursor: null }),
    ...handlers,
  })
}

beforeEach(() => session.clear())

describe('crop stages', () => {
  it('follows the latest stage posted, and harvest ready once marked', () => {
    expect(stageReached('ACTIVE', [])).toBe(-1)
    expect(stageReached('ACTIVE', [{ stage: 'SOWN' }, { stage: 'FLOWERING' }])).toBe(2)
    expect(stageReached('HARVEST_READY', [{ stage: 'SOWN' }])).toBe(3)
    expect(suggestedStage([])).toBe('SOWN')
    expect(suggestedStage([{ stage: 'SOWN' }, { stage: 'GROWING' }])).toBe('GROWING')
  })
})

describe('farmer crop updates', () => {
  it('shows the timeline newest first with photo badges', async () => {
    farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({}), R({ id: 'r9', status: 'PENDING' })]),
      'GET /land/reservations/r1/updates': () => jsonResponse(UPDATES),
    })
    renderAt('/farmer/crops')
    const card = await screen.findByRole('article', { name: 'Tomato for a customer' })
    expect(await within(card).findByText('Riverside plot, Rabi season until 15 Mar 2027')).toBeInTheDocument()
    const region = await within(card).findByRole('region', { name: 'Crop updates' })
    const items = Array.from(region.querySelectorAll(':scope > ol > li'))
    expect(items[0]).toHaveTextContent('Growing')
    expect(items.at(-1)).toHaveTextContent('Seeds in the ground')
    expect(await within(card).findByText('Unverified')).toBeInTheDocument()
    expect(within(card).getByText(': Taken 850 m from the plot.')).toBeInTheDocument()
    expect(within(card).getByRole('list', { name: 'Crop stages' }).querySelector('[aria-current="step"]')).toHaveTextContent('Growing')
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('posts an update with a photo uploaded for the reservation', async () => {
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'GET /land/reservations/r1/updates': () => jsonResponse([]),
      'POST /media/upload-url': () => jsonResponse({ mediaId: 'm5', uploadUrl: 'http://minio.test/b/o/m5', headers: {}, expiresAt: '' }, 201),
      'PUT /b/o/m5': () => new Response(null, { status: 200 }),
      'POST /media/m5/complete': () => jsonResponse({}, 202),
      'POST /land/reservations/r1/updates': (body) => jsonResponse({ id: 'cu9', createdAt: '2026-11-21T08:00:00Z', ...(body as object) }, 201),
    })
    renderAt('/farmer/crops')
    await userEvent.click(await screen.findByRole('button', { name: 'Post an update' }))
    const form = screen.getByRole('form', { name: 'Post an update' })
    expect(within(form).getByLabelText('Sown')).toBeChecked()
    await userEvent.type(within(form).getByLabelText(/Note/), 'Sowing done')
    await userEvent.upload(within(form).getByLabelText('Add photos'), new File(['x'], 'field.jpg', { type: 'image/jpeg' }))
    await userEvent.click(within(form).getByRole('button', { name: 'Post update' }))

    await waitFor(() => expect(calls.some((c) => c.key === 'POST /land/reservations/r1/updates')).toBe(true))
    expect(calls.find((c) => c.key === 'POST /media/upload-url')!.body).toMatchObject({ ownerType: 'RESERVATION', ownerId: 'r1' })
    expect(calls.find((c) => c.key === 'POST /land/reservations/r1/updates')!.body).toEqual({ stage: 'SOWN', note: 'Sowing done', mediaIds: ['m5'] })
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Post an update' })).not.toBeInTheDocument())
  })

  it('does not upload a photo twice when posting the update is retried', async () => {
    let attempts = 0
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'GET /land/reservations/r1/updates': () => jsonResponse([]),
      'POST /media/upload-url': () => jsonResponse({ mediaId: 'm5', uploadUrl: 'http://minio.test/b/o/m5', headers: {}, expiresAt: '' }, 201),
      'PUT /b/o/m5': () => new Response(null, { status: 200 }),
      'POST /media/m5/complete': () => jsonResponse({}, 202),
      'POST /land/reservations/r1/updates': () =>
        ++attempts === 1 ? jsonResponse({ error: { code: 'internal', message: 'Try again later.' } }, 500) : jsonResponse({ id: 'cu9' }, 201),
    })
    renderAt('/farmer/crops')
    await userEvent.click(await screen.findByRole('button', { name: 'Post an update' }))
    const form = screen.getByRole('form', { name: 'Post an update' })
    await userEvent.upload(within(form).getByLabelText('Add photos'), new File(['x'], 'field.jpg', { type: 'image/jpeg' }))
    await userEvent.click(within(form).getByRole('button', { name: 'Post update' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('Try again later.')
    await userEvent.click(within(form).getByRole('button', { name: 'Post update' }))
    await waitFor(() => expect(attempts).toBe(2))
    expect(calls.filter((c) => c.key === 'POST /media/upload-url')).toHaveLength(1)
  })

  it('needs a photo or a note', async () => {
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'GET /land/reservations/r1/updates': () => jsonResponse([]),
    })
    renderAt('/farmer/crops')
    await userEvent.click(await screen.findByRole('button', { name: 'Post an update' }))
    await userEvent.click(screen.getByRole('button', { name: 'Post update' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Add a photo or a note')
    expect(calls.some((c) => c.key === 'POST /land/reservations/r1/updates')).toBe(false)
  })

  it('marks the harvest ready after confirming', async () => {
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'GET /land/reservations/r1/updates': () => jsonResponse(UPDATES),
      'POST /land/reservations/r1/harvest-ready': () => jsonResponse(R({ status: 'HARVEST_READY' })),
    })
    renderAt('/farmer/crops')
    await userEvent.click(await screen.findByRole('button', { name: 'Mark ready to harvest' }))
    expect(calls.some((c) => c.key === 'POST /land/reservations/r1/harvest-ready')).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Yes, it is ready' }))
    expect(await screen.findByText(/Marked ready to harvest/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark ready to harvest' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post an update' })).toBeInTheDocument()
  })

  it('points to requests when nothing is growing', async () => {
    farmer({ 'GET /land/reservations/mine': () => jsonResponse([R({ status: 'PENDING' })]) })
    renderAt('/farmer/crops')
    expect(await screen.findByRole('link', { name: 'See reservation requests' })).toHaveAttribute('href', '/farmer/reservations')
  })
})
