import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../../components/ui/Button.jsx'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Enregistrer</Button>)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Cliquer</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Non disponible</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Cliquer</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('renders as a submit button when type="submit"', () => {
    render(<Button type="submit">Envoyer</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'])(
    'renders variant "%s" without crashing',
    (variant) => {
      const { container } = render(<Button variant={variant}>Bouton</Button>)
      expect(container.firstChild).not.toBeNull()
    }
  )
})
