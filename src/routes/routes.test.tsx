import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { renderAt, signedInAs } from '@/test/auth'
import { sections } from './sections'

beforeEach(() => {
  session.clear()
  signedInAs(['farmer', 'customer', 'inspector', 'admin'])
})

describe('routes', () => {
  it('lists every section on the start page', () => {
    renderAt('/')
    for (const section of sections) {
      expect(screen.getByRole('link', { name: new RegExp(section.label) })).toHaveAttribute('href', `/${section.role}`)
    }
  })

  it.each(sections.map((s) => [s.role, s.pages[0].path, s.pages[0].label] as const))(
    'opens the %s section on its first page',
    async (role, firstPath, firstLabel) => {
      const router = renderAt(`/${role}`)
      expect(await screen.findByRole('heading', { level: 1, name: new RegExp(firstLabel) })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(`/${role}/${firstPath}`)
    },
  )

  it('moves between pages from the section navigation', async () => {
    const router = renderAt('/farmer/listings')
    await screen.findByRole('heading', { level: 1, name: /Listings/ })
    const [railNav] = screen.getAllByRole('navigation', { name: 'Farmer pages' })
    await userEvent.click(within(railNav!).getByRole('link', { name: /Orders/ }))
    expect(router.state.location.pathname).toBe('/farmer/orders')
    expect(screen.getByRole('heading', { level: 1, name: /Orders/ })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown paths', () => {
    renderAt('/nowhere')
    expect(screen.getByRole('heading', { name: 'This page does not exist' })).toBeInTheDocument()
  })
})
