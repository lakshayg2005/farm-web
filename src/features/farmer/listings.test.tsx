import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { photoBadge, type Media } from '@/api/media'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'
import { farmPayload, listingChanges, listingPayload, type Listing, type ListingForm } from './catalog'

const FARM = {
  id: 'farm-1',
  farmerId: 'u1',
  name: 'Verma Farms',
  village: 'Arang',
  district: 'Raipur',
  state: 'Chhattisgarh',
  location: { type: 'Point', coordinates: [81.63, 21.25] },
  boundary: null,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
}
const CROPS = [
  { id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' },
  { id: 'banana', name: 'Banana', category: 'fruit', defaultUnit: 'dozen' },
]
const LISTING: Listing = {
  id: 'l1',
  farmId: 'farm-1',
  farmName: 'Verma Farms',
  cropId: 'tomato',
  cropName: 'Tomato',
  variety: 'Hybrid 501',
  description: null,
  qtyAvailable: 120,
  unit: 'kg',
  pricePerUnit: 28,
  harvestDate: '2026-11-14',
  grade: null,
  isOrganic: false,
  status: 'ACTIVE',
  mediaIds: ['m1', 'm2'],
  updatedAt: '2026-11-15T09:00:00Z',
}
const MEDIA = (id: string, extra: Partial<Media>): Media => ({
  id,
  ownerType: 'LISTING',
  ownerId: 'l1',
  status: 'READY',
  url: `http://media.test/public/${id}.jpg`,
  thumbUrl: `http://media.test/thumbs/${id}.jpg`,
  isGeoVerified: true,
  geoStatus: 'VERIFIED',
  distanceM: 0,
  exifTime: null,
  rejectReason: null,
  createdAt: '2026-11-15T09:00:00Z',
  ...extra,
})

function farmer(handlers: Record<string, (body: unknown) => Response>) {
  session.refreshToken = 'refresh-1'
  return mockApi({
    'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
    'GET /catalog/crops': () => jsonResponse(CROPS),
    'GET /catalog/farms/mine': () => jsonResponse({ items: [FARM], nextCursor: null }),
    ...handlers,
  })
}

beforeEach(() => session.clear())

describe('listing form checks', () => {
  const form: ListingForm = {
    farmId: 'farm-1',
    cropId: 'tomato',
    variety: ' Hybrid 501 ',
    description: '',
    qty: '120',
    unit: 'kg',
    price: '28.456',
    harvestDate: '2026-11-14',
    isOrganic: true,
  }

  it('builds the catalog payload, rounding the price to paise', () => {
    expect(listingPayload(form)).toEqual({
      farmId: 'farm-1',
      cropId: 'tomato',
      variety: 'Hybrid 501',
      qtyAvailable: 120,
      unit: 'kg',
      pricePerUnit: 28.46,
      harvestDate: '2026-11-14',
      isOrganic: true,
    })
  })

  it('rejects missing stock and price', () => {
    expect(listingPayload({ ...form, qty: '0' })).toBe('Enter how much you have in stock.')
    expect(listingPayload({ ...form, price: '' })).toBe('Enter a price per unit in rupees.')
    expect(listingPayload({ ...form, cropId: '' })).toBe('Choose a crop.')
  })

  it('sends only what changed when editing', () => {
    const changes = listingChanges(LISTING, { ...form, qty: '120', price: '30', variety: '', isOrganic: false, harvestDate: '2026-11-14' })
    expect(changes).toEqual({ pricePerUnit: 30, variety: null })
  })

  it('needs a farm gate location', () => {
    const farm = { name: 'Verma Farms', village: '', district: 'Raipur', state: '', lat: '', lng: '' }
    expect(farmPayload(farm)).toMatch(/farm gate location/)
    expect(farmPayload({ ...farm, lat: '21.25', lng: '81.63' })).toEqual({
      name: 'Verma Farms',
      district: 'Raipur',
      location: { type: 'Point', coordinates: [81.63, 21.25] },
    })
  })
})

describe('photo badges', () => {
  it('explains why a photo is unverified', () => {
    expect(photoBadge(MEDIA('m', {})).label).toBe('Verified')
    expect(photoBadge(MEDIA('m', { isGeoVerified: false, geoStatus: 'TOO_FAR', distanceM: 4200 })).detail).toBe('Taken 4.2 km from the farm.')
    expect(photoBadge(MEDIA('m', { isGeoVerified: false, geoStatus: 'NO_GPS' })).label).toBe('Unverified')
    expect(photoBadge(MEDIA('m', { status: 'PROCESSING', url: null, thumbUrl: null })).label).toBe('Checking')
  })
})

describe('farmer listings page', () => {
  it('asks for the farm first when the farmer has none', async () => {
    const calls = farmer({
      'GET /catalog/farms/mine': () => jsonResponse({ items: [], nextCursor: null }),
      'POST /catalog/farms': () => jsonResponse(FARM, 201),
      'GET /catalog/listings/mine': () => jsonResponse({ items: [], nextCursor: null }),
    })
    renderAt('/farmer/listings')
    const form = await screen.findByRole('form', { name: 'Add your farm' })
    await userEvent.type(within(form).getByLabelText('Farm name'), 'Verma Farms')
    await userEvent.type(within(form).getByLabelText('District'), 'Raipur')
    await userEvent.type(within(form).getByLabelText('Latitude'), '21.25')
    await userEvent.type(within(form).getByLabelText('Longitude'), '81.63')
    await userEvent.click(within(form).getByRole('button', { name: 'Save farm' }))

    expect(await screen.findByText('Put your first produce up for sale')).toBeInTheDocument()
    const post = calls.find((c) => c.key === 'POST /catalog/farms')!
    expect(post.body).toEqual({ name: 'Verma Farms', district: 'Raipur', location: { type: 'Point', coordinates: [81.63, 21.25] } })
  })

  it('shows each listing with its photos and their verified badges', async () => {
    farmer({
      'GET /catalog/listings/mine': () =>
        jsonResponse({ items: [LISTING, { ...LISTING, id: 'l2', cropName: 'Banana', variety: null, status: 'PAUSED', mediaIds: [] }], nextCursor: null }),
      'GET /media/owners/LISTING/l1': () =>
        jsonResponse({ items: [MEDIA('m1', {}), MEDIA('m2', { isGeoVerified: false, geoStatus: 'NO_GPS' })], nextCursor: null }),
    })
    renderAt('/farmer/listings')
    const list = await screen.findByRole('list', { name: 'Your listings' })
    const [tomato, banana] = within(list).getAllByRole('article')
    expect(within(tomato!).getByText('₹28 per kg')).toBeInTheDocument()
    expect(await within(tomato!).findByText('Verified')).toBeInTheDocument()
    expect(within(tomato!).getByText('Unverified')).toBeInTheDocument()
    expect(within(banana!).getByText('Paused')).toBeInTheDocument()
    expect(within(banana!).getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 listings on sale.')).toBeInTheDocument()
  })

  it('lists new produce, uploads its photo and attaches it', async () => {
    const created = { ...LISTING, id: 'l9', mediaIds: [] }
    const calls = farmer({
      'GET /catalog/listings/mine': () => jsonResponse({ items: [], nextCursor: null }),
      'POST /catalog/listings': () => jsonResponse(created, 201),
      'POST /media/upload-url': () =>
        jsonResponse({ mediaId: 'm9', uploadUrl: 'http://minio.test/farm-media/originals/m9', headers: { 'Content-Type': 'image/jpeg' }, expiresAt: '' }, 201),
      'PUT /farm-media/originals/m9': () => new Response(null, { status: 200 }),
      'POST /media/m9/complete': () => jsonResponse(MEDIA('m9', { status: 'PROCESSING' }), 202),
      'PATCH /catalog/listings/l9': () => jsonResponse({ ...created, mediaIds: ['m9'] }),
    })
    renderAt('/farmer/listings')
    await userEvent.click(await screen.findByRole('button', { name: 'Add a listing' }))
    const form = screen.getByRole('form', { name: 'Add a listing' })
    await userEvent.selectOptions(within(form).getByLabelText('Crop'), 'banana')
    expect(within(form).getByLabelText('Unit')).toHaveValue('dozen')
    await userEvent.type(within(form).getByLabelText('In stock'), '40')
    await userEvent.type(within(form).getByLabelText('Price per dozen (₹)'), '55')
    const photo = new File(['jpeg'], 'bananas.jpg', { type: 'image/jpeg' })
    await userEvent.upload(within(form).getByLabelText('Add photos'), photo)
    await userEvent.click(within(form).getByRole('button', { name: 'List this produce' }))

    await waitFor(() => expect(calls.some((c) => c.key === 'PATCH /catalog/listings/l9')).toBe(true))
    const post = calls.find((c) => c.key === 'POST /catalog/listings')!
    expect(post.body).toMatchObject({ farmId: 'farm-1', cropId: 'banana', unit: 'dozen', qtyAvailable: 40, pricePerUnit: 55 })
    expect(calls.find((c) => c.key === 'POST /media/upload-url')!.body).toMatchObject({ ownerType: 'LISTING', ownerId: 'l9', contentType: 'image/jpeg' })
    expect(calls.find((c) => c.key === 'PATCH /catalog/listings/l9')!.body).toEqual({ mediaIds: ['m9'] })
    expect(await screen.findByText('Tomato is listed.')).toBeInTheDocument()
  })

  it('keeps the new listing open for editing when its photo fails to upload', async () => {
    const created = { ...LISTING, id: 'l9', mediaIds: [] }
    const calls = farmer({
      'GET /catalog/listings/mine': () => jsonResponse({ items: [], nextCursor: null }),
      'POST /catalog/listings': () => jsonResponse(created, 201),
      'POST /media/upload-url': () => jsonResponse({ error: { code: 'MEDIA_TOO_LARGE', message: 'File is too large.' } }, 422),
    })
    renderAt('/farmer/listings')
    await userEvent.click(await screen.findByRole('button', { name: 'Add a listing' }))
    const form = screen.getByRole('form', { name: 'Add a listing' })
    await userEvent.selectOptions(within(form).getByLabelText('Crop'), 'tomato')
    await userEvent.type(within(form).getByLabelText('In stock'), '10')
    await userEvent.type(within(form).getByLabelText('Price per kg (₹)'), '20')
    await userEvent.upload(within(form).getByLabelText('Add photos'), new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    await userEvent.click(within(form).getByRole('button', { name: 'List this produce' }))

    expect(await screen.findByRole('form', { name: 'Edit Tomato' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Tomato is listed, but a photo did not upload: File is too large.')
    expect(calls.filter((c) => c.key === 'POST /catalog/listings')).toHaveLength(1)
  })

  it('updates stock and pauses a listing', async () => {
    const calls = farmer({
      'GET /catalog/listings/mine': () => jsonResponse({ items: [{ ...LISTING, mediaIds: [] }], nextCursor: null }),
      'PATCH /catalog/listings/l1': (body) => jsonResponse({ ...LISTING, mediaIds: [], ...(body as object) }),
    })
    renderAt('/farmer/listings')
    const stock = await screen.findByLabelText('In stock (kg)')
    await userEvent.clear(stock)
    await userEvent.type(stock, '80')
    await userEvent.click(screen.getByRole('button', { name: 'Update stock' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'PATCH /catalog/listings/l1')).toBe(true))
    expect(calls.find((c) => c.key === 'PATCH /catalog/listings/l1')!.body).toEqual({ qtyAvailable: 80 })

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(await screen.findByText('Paused')).toBeInTheDocument()
    expect(calls.filter((c) => c.key === 'PATCH /catalog/listings/l1').at(-1)!.body).toEqual({ status: 'PAUSED' })
  })

  it('asks before removing a listing', async () => {
    const calls = farmer({
      'GET /catalog/listings/mine': () => jsonResponse({ items: [{ ...LISTING, mediaIds: [] }], nextCursor: null }),
      'DELETE /catalog/listings/l1': () => jsonResponse(null, 204),
    })
    renderAt('/farmer/listings')
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(calls.some((c) => c.key === 'DELETE /catalog/listings/l1')).toBe(false)
    expect(screen.getByText('Remove this listing?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'DELETE /catalog/listings/l1')).toBe(true))
  })
})
