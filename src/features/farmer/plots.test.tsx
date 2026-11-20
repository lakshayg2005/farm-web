import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'

const PLOT = { id: 'p1', title: 'Riverside plot', areaAcres: 2.5, status: 'ACTIVE', soilType: 'Black soil', waterSource: null, description: null }
const SEASON = { id: 's1', plotId: 'p1', season: 'Rabi', startDate: '2026-11-20', endDate: '2027-03-15', price: 12000, allowedCrops: ['wheat'] }

function farmer() {
  session.refreshToken = 'refresh-1'
  return mockApi({
    'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
    'GET /land/plots/mine': () => jsonResponse([PLOT]),
    'GET /land/plots/p1/seasons': () => jsonResponse([SEASON]),
    'PATCH /land/plots/p1': () => jsonResponse(PLOT),
    'PATCH /land/plots/p1/seasons/s1': () => jsonResponse(SEASON),
  })
}

beforeEach(() => session.clear())

describe('farmer plots page', () => {
  it('lists saved plots with their seasons', async () => {
    farmer()
    renderAt('/farmer/plots')
    expect(await screen.findByText('Riverside plot')).toBeInTheDocument()
    expect(await screen.findByText('Rabi')).toBeInTheDocument()
  })

  it('edits a plot and sends only its editable fields', async () => {
    const calls = farmer()
    renderAt('/farmer/plots')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Riverside plot' }))
    const form = screen.getByRole('form', { name: 'Edit Riverside plot' })
    const name = within(form).getByLabelText('Plot name')
    await userEvent.clear(name)
    await userEvent.type(name, 'North field')
    await userEvent.click(within(form).getByRole('button', { name: 'Save plot' }))
    await waitFor(() => expect(calls.find((c) => c.key === 'PATCH /land/plots/p1')).toBeTruthy())
    expect(calls.find((c) => c.key === 'PATCH /land/plots/p1')!.body).toEqual({
      title: 'North field',
      soilType: 'Black soil',
      waterSource: null,
      description: null,
    })
  })

  it('edits a season with the full replacement body', async () => {
    const calls = farmer()
    renderAt('/farmer/plots')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Rabi season' }))
    const form = screen.getByRole('form', { name: 'Edit Rabi season' })
    const price = within(form).getByLabelText('Price (INR)')
    await userEvent.clear(price)
    await userEvent.type(price, '15000')
    await userEvent.click(within(form).getByRole('button', { name: 'Save season' }))
    await waitFor(() => expect(calls.find((c) => c.key === 'PATCH /land/plots/p1/seasons/s1')).toBeTruthy())
    expect(calls.find((c) => c.key === 'PATCH /land/plots/p1/seasons/s1')!.body).toEqual({
      season: 'Rabi',
      startDate: '2026-11-20',
      endDate: '2027-03-15',
      price: 15000,
      allowedCrops: ['wheat'],
    })
  })
})
