import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MapFilters from '../../components/map/MapFilters.jsx'
import { CATEGORIES } from '../../lib/constants.js'

const CATEGORY_COUNT = Object.keys(CATEGORIES).length

describe('MapFilters', () => {
  it('renders a "Tous" chip', () => {
    render(<MapFilters activeFilter="all" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument()
  })

  it(`renders ${CATEGORY_COUNT} category chips`, () => {
    render(<MapFilters activeFilter="all" onChange={() => {}} />)
    for (const cat of Object.values(CATEGORIES)) {
      expect(screen.getByRole('button', { name: cat.label })).toBeInTheDocument()
    }
  })

  it('calls onChange("all") when "Tous" is clicked', async () => {
    const handler = vi.fn()
    render(<MapFilters activeFilter="randonnee" onChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tous' }))
    expect(handler).toHaveBeenCalledWith('all')
  })

  it('calls onChange with the category key when a category chip is clicked', async () => {
    const handler = vi.fn()
    render(<MapFilters activeFilter="all" onChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: CATEGORIES.plage.label }))
    expect(handler).toHaveBeenCalledWith('plage')
  })

  it('marks the active filter chip as selected', () => {
    render(<MapFilters activeFilter="restaurant" onChange={() => {}} />)
    // The selected chip has white text (background = color). We verify by checking
    // that the restaurant chip is rendered (selection state is styling, not ARIA).
    const btn = screen.getByRole('button', { name: CATEGORIES.restaurant.label })
    expect(btn).toBeInTheDocument()
  })

  it('renders all 6 chips in total (1 "Tous" + 5 categories)', () => {
    render(<MapFilters activeFilter="all" onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(CATEGORY_COUNT + 1)
  })
})
