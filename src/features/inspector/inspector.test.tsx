import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'
import { photoProblem, reportPayload } from './inspector'

const BASE = { subjectType: 'ORDER', subjectId: 's1', attempt: 1, status: 'PENDING', grade: null, moisturePct: null, pestFound: null, weightKg: null, result: null, resolution: null, mediaIds: [], createdAt: '2026-11-16T09:00:00Z', reportedAt: null }
const form = { grade: 'A' as const, moisture: '12', pest: false, weight: '40', result: 'PASS' as const, resolution: '' as const, acceptedGrade: 'B' as const, note: '', mediaIds: [] }

beforeEach(() => {
  session.clear()
  session.refreshToken = 'refresh-1'
})

describe('reportPayload', () => {
  it('builds a pass report', () => {
    expect(reportPayload(form)).toEqual({ grade: 'A', moisturePct: 12, pestFound: false, weightKg: 40, result: 'PASS', mediaIds: [] })
  })
  it('needs a next step when the inspection fails', () => {
    expect(reportPayload({ ...form, result: 'FAIL' })).toMatch(/what happens next/)
    expect(reportPayload({ ...form, result: 'FAIL', resolution: 'ACCEPT_LOWER_GRADE', acceptedGrade: 'C' })).toMatchObject({ resolution: 'ACCEPT_LOWER_GRADE', acceptedGrade: 'C' })
  })
  it('rejects bad numbers', () => {
    expect(reportPayload({ ...form, moisture: '120' })).toMatch(/Moisture/)
    expect(reportPayload({ ...form, weight: '0' })).toMatch(/weight/)
  })
})

describe('photoProblem', () => {
  it('allows small images only', () => {
    expect(photoProblem({ type: 'image/png', size: 1000 })).toBeNull()
    expect(photoProblem({ type: 'application/pdf', size: 1000 })).toMatch(/JPEG/)
    expect(photoProblem({ type: 'image/png', size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
  })
})

describe('inspections page', () => {
  it('claims an open inspection and then shows its report form', async () => {
    let claimed = false
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['inspector'])),
      'GET /quality/inspections': () => jsonResponse([{ ...BASE, id: 'i1', inspectorId: claimed ? 'u1' : null }]),
      'POST /quality/inspections/i1/claim': () => {
        claimed = true
        return jsonResponse({ ...BASE, id: 'i1', inspectorId: 'u1' })
      },
    })
    renderAt('/inspector/inspections')
    await userEvent.click(await screen.findByRole('button', { name: 'Claim' }))
    await screen.findByRole('form', { name: /Report for Packed order/ })
    expect(calls.some((c) => c.key === 'POST /quality/inspections/i1/claim')).toBe(true)
  })

  it('submits a report', async () => {
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['inspector'])),
      'GET /quality/inspections': () => jsonResponse([{ ...BASE, id: 'i1', inspectorId: 'u1' }]),
      'POST /quality/inspections/i1/report': () => jsonResponse({ ...BASE, id: 'i1', inspectorId: 'u1', status: 'REPORTED' }),
    })
    renderAt('/inspector/inspections')
    await userEvent.type(await screen.findByLabelText('Moisture (%)'), '14')
    await userEvent.type(screen.getByLabelText('Weight (kg)'), '38')
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /quality/inspections/i1/report')).toBe(true))
    const sent = calls.find((c) => c.key === 'POST /quality/inspections/i1/report')
    expect(sent?.body).toMatchObject({ grade: 'A', moisturePct: 14, weightKg: 38, result: 'PASS' })
  })
})

describe('report form on a phone', () => {
  it('picks grade and result with big buttons and sends them', async () => {
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['inspector'])),
      'GET /quality/inspections': () => jsonResponse([{ ...BASE, id: 'i1', inspectorId: 'u1' }]),
      'POST /quality/inspections/i1/report': () => jsonResponse({ ...BASE, id: 'i1', inspectorId: 'u1', status: 'REPORTED' }),
    })
    renderAt('/inspector/inspections')
    await userEvent.type(await screen.findByLabelText('Moisture (%)'), '11')
    await userEvent.type(screen.getByLabelText('Weight (kg)'), '30')
    const grade = screen.getByRole('radiogroup', { name: 'Grade' })
    expect(within(grade).getByRole('radio', { name: 'A' })).toBeChecked()
    await userEvent.click(within(grade).getByRole('radio', { name: 'C' }))
    expect(within(grade).getByRole('radio', { name: 'C' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Fail' }))
    await userEvent.selectOptions(screen.getByLabelText('What happens next'), 'REHARVEST')
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /quality/inspections/i1/report')).toBe(true))
    expect(calls.find((c) => c.key === 'POST /quality/inspections/i1/report')?.body).toMatchObject({
      grade: 'C',
      result: 'FAIL',
      resolution: 'REHARVEST',
    })
  })

  it('offers the camera and the gallery, and shows how many photos are picked', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['inspector'])),
      'GET /quality/inspections': () => jsonResponse([{ ...BASE, id: 'i1', inspectorId: 'u1' }]),
    })
    renderAt('/inspector/inspections')
    expect(await screen.findByRole('button', { name: 'Take photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose photos' })).toBeInTheDocument()
    expect(screen.getByText('0 of 10 photos. JPEG, PNG or WebP, 5 MB each.')).toBeInTheDocument()
    await userEvent.upload(screen.getByLabelText('Choose photos', { selector: 'input' }), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByText('1 of 10 photos. JPEG, PNG or WebP, 5 MB each.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }))
    expect(screen.getByText('0 of 10 photos. JPEG, PNG or WebP, 5 MB each.')).toBeInTheDocument()
  })
})
