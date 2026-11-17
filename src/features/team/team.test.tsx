import { screen } from '@testing-library/react'
import { session } from '@/features/auth/session'
import { renderAt } from '@/test/auth'

beforeEach(() => session.clear())

describe('team page', () => {
  it('thanks Dr Gagan Sir and lists both teams without signing in', async () => {
    renderAt('/team')
    expect(await screen.findByRole('heading', { name: /thanks to Dr Gagan Sir/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Team 1/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Team 2/ })).toBeInTheDocument()
    expect(screen.getByText('@lakshayg2005')).toBeInTheDocument()
  })
})
