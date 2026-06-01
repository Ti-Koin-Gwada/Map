import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chip from '../../components/ui/Chip.jsx'

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label="Plages & Mer" />)
    expect(screen.getByText('Plages & Mer')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Chip label="Tous" onClick={handler} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Chip label="Désactivé" disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows the color dot when color is set and chip is not selected', () => {
    const { container } = render(<Chip label="Plage" color="#0EA5E9" selected={false} />)
    // Color dot is a <span> with the color as background
    const dot = container.querySelector('span[style*="background: rgb"]')
    expect(dot).not.toBeNull()
  })

  it('does not show the color dot when chip is selected', () => {
    const { container } = render(<Chip label="Plage" color="#0EA5E9" selected={true} />)
    // When selected, the dot span is not rendered
    const dot = container.querySelector('span[style*="background: rgb"]')
    expect(dot).toBeNull()
  })
})
