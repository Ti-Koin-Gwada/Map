import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryBadge, FormatBadge, StatusBadge } from '../../components/ui/Badge.jsx'

describe('CategoryBadge', () => {
  it('renders the category label', () => {
    render(<CategoryBadge category="plage" />)
    expect(screen.getByText('Plages & Mer')).toBeInTheDocument()
  })

  it('renders nothing for an unknown category', () => {
    const { container } = render(<CategoryBadge category="unknown" />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(['plage', 'restaurant', 'randonnee', 'activite', 'spot_cache'])(
    'renders category "%s" without crashing',
    (cat) => {
      const { container } = render(<CategoryBadge category={cat} />)
      expect(container.firstChild).not.toBeNull()
    }
  )
})

describe('FormatBadge', () => {
  it('renders "Personnalisé" for personnalise forfait', () => {
    render(<FormatBadge forfait="personnalise" />)
    expect(screen.getByText('Personnalisé')).toBeInTheDocument()
  })

  it('renders "Essentiel" for essentiel forfait', () => {
    render(<FormatBadge forfait="essentiel" />)
    expect(screen.getByText('Essentiel')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('shows "Active" when active=true', () => {
    render(<StatusBadge active={true} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows "Désactivée" when active=false', () => {
    render(<StatusBadge active={false} />)
    expect(screen.getByText('Désactivée')).toBeInTheDocument()
  })
})
