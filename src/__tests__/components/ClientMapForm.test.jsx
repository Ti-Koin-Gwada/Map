import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ─────────────────────────────────────────────────────

vi.mock('../../hooks/useIsMobile.js', () => ({ useIsMobile: vi.fn() }))

// MapSelector mock expose des boutons pour contrôler chosen/itineraries
vi.mock('../../components/admin/MapSelector.jsx', () => ({
  default: ({ chosen, onChosenChange, itineraries, onItinerariesChange }) => (
    <div data-testid="map-selector">
      <button data-testid="add-2-spots" onClick={() => onChosenChange(['poi-1', 'poi-2'])}>
        Add 2 spots
      </button>
      <button
        data-testid="add-itinerary"
        onClick={() => onItinerariesChange([{ name: 'Matin', steps: ['poi-1', 'poi-2'] }])}
      >
        Add itinerary
      </button>
      <span data-testid="chosen-count">{chosen.length}</span>
      <span data-testid="itinerary-count">{itineraries.length}</span>
    </div>
  ),
}))

import { useIsMobile } from '../../hooks/useIsMobile.js'
import ClientMapForm from '../../components/admin/ClientMapForm.jsx'

const POIS = [
  { id: 'poi-1', name: 'Plage A',  category: 'plage',      latitude: 16, longitude: -61 },
  { id: 'poi-2', name: 'Resto B',  category: 'restaurant', latitude: 16.1, longitude: -61.1 },
]

beforeEach(() => {
  useIsMobile.mockReturnValue(false)
})

// ── Helpers ───────────────────────────────────────────────────

async function goToStep2() {
  const input = screen.getByPlaceholderText(/Famille Martin/i)
  await userEvent.type(input, 'Alice')
  await userEvent.click(screen.getByRole('button', { name: /Continuer/i }))
}

// ── Save sans itinéraire ──────────────────────────────────────

describe('ClientMapForm — save sans itinéraire', () => {
  it('"Générer la carte" appelle onSave avec itineraries=[] et show_route=false', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()
    await userEvent.click(screen.getByTestId('add-2-spots'))

    await userEvent.click(screen.getByRole('button', { name: /Générer/i }))

    expect(onSave).toHaveBeenCalledOnce()
    const saved = onSave.mock.calls[0][0]
    expect(saved.itineraries).toEqual([])
    expect(saved.show_route).toBe(false)
    expect(saved.pois).toHaveLength(2)
  })

  it('"Générer la carte" est désactivé quand aucun spot sélectionné', async () => {
    render(<ClientMapForm pois={POIS} onSave={vi.fn()} onCancel={() => {}} saving={false} />)
    await goToStep2()
    expect(screen.getByRole('button', { name: /Générer/i })).toBeDisabled()
  })
})

// ── Save avec itinéraire ──────────────────────────────────────

describe('ClientMapForm — save avec itinéraire', () => {
  it('"Générer la carte" appelle onSave avec itineraries=[{name, steps}] et show_route=true', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()
    await userEvent.click(screen.getByTestId('add-2-spots'))
    await userEvent.click(screen.getByTestId('add-itinerary'))

    await userEvent.click(screen.getByRole('button', { name: /Générer/i }))

    expect(onSave).toHaveBeenCalledOnce()
    const saved = onSave.mock.calls[0][0]
    expect(saved.itineraries).toHaveLength(1)
    expect(saved.itineraries[0].name).toBe('Matin')
    expect(saved.itineraries[0].steps).toEqual(['poi-1', 'poi-2'])
    expect(saved.show_route).toBe(true)
  })

  it('les pois dans le payload n\'ont pas de display_order', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()
    await userEvent.click(screen.getByTestId('add-2-spots'))

    await userEvent.click(screen.getByRole('button', { name: /Générer/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.pois.every(p => !('display_order' in p))).toBe(true)
  })
})

// ── Mobile ────────────────────────────────────────────────────

describe('ClientMapForm — mobile', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(true)
  })

  it('affiche le bouton Générer sur mobile à l\'étape 2', async () => {
    render(<ClientMapForm pois={POIS} onSave={vi.fn()} onCancel={() => {}} saving={false} />)
    await goToStep2()
    await userEvent.click(screen.getByTestId('add-2-spots'))
    expect(screen.getByRole('button', { name: /Générer/i })).toBeInTheDocument()
  })
})
