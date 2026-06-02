import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ─────────────────────────────────────────────────────

vi.mock('../../hooks/useIsMobile.js', () => ({ useIsMobile: vi.fn() }))

// MapSelector mock : expose des boutons pour contrôler chosen/itinerary
vi.mock('../../components/admin/MapSelector.jsx', () => ({
  default: ({ chosen, onChosenChange, itinerary, onItineraryChange }) => (
    <div data-testid="map-selector">
      <button data-testid="add-2-spots" onClick={() => onChosenChange(['poi-1', 'poi-2'])}>
        Add 2 spots
      </button>
      <button data-testid="set-itinerary-2" onClick={() => onItineraryChange(['poi-1', 'poi-2'])}>
        Set itinerary (2)
      </button>
      <span data-testid="chosen-count">{chosen.length}</span>
      <span data-testid="itinerary-count">{itinerary.length}</span>
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
  // Ajouter 2 spots et 2 étapes dans l'itinéraire
  await userEvent.click(screen.getByTestId('add-2-spots'))
  await userEvent.click(screen.getByTestId('set-itinerary-2'))
}

// ── Fix 5 : confirmation avant de perdre l'itinéraire ─────────

describe('ClientMapForm — confirmation perte itinéraire (Fix Issue 5)', () => {
  it('premier clic "Générer la carte" avec itinéraire affiche la confirmation', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()

    await userEvent.click(screen.getByRole('button', { name: /Générer la carte/i }))

    // onSave ne doit pas être appelé au premier clic
    expect(onSave).not.toHaveBeenCalled()
    // Le bouton doit afficher un message de confirmation
    expect(screen.getByRole('button', { name: /Confirmer/i })).toBeInTheDocument()
  })

  it('deuxième clic sur "Confirmer" appelle onSave avec show_route=false', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()

    // Premier clic → confirmation
    await userEvent.click(screen.getByRole('button', { name: /Générer la carte/i }))
    // Deuxième clic → save sans itinéraire
    await userEvent.click(screen.getByRole('button', { name: /Confirmer/i }))

    expect(onSave).toHaveBeenCalledOnce()
    const savedData = onSave.mock.calls[0][0]
    expect(savedData.show_route).toBe(false)
    expect(savedData.pois.every(p => p.display_order === null)).toBe(true)
  })

  it('"Créer un itinéraire" appelle onSave avec show_route=true et display_order', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()

    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))

    expect(onSave).toHaveBeenCalledOnce()
    const savedData = onSave.mock.calls[0][0]
    expect(savedData.show_route).toBe(true)
    // Les spots de l'itinéraire ont un display_order
    const itinerarySpots = savedData.pois.filter(p => p.display_order !== null)
    expect(itinerarySpots.length).toBe(2)
    expect(itinerarySpots[0].display_order).toBe(0)
    expect(itinerarySpots[1].display_order).toBe(1)
  })

  it('"Créer un itinéraire" après confirmation remet à zéro et sauve avec itinéraire', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)
    await goToStep2()

    // Déclencher la confirmation
    await userEvent.click(screen.getByRole('button', { name: /Générer la carte/i }))
    expect(screen.getByRole('button', { name: /Confirmer/i })).toBeInTheDocument()

    // Cliquer "Créer un itinéraire" annule la confirmation et sauve avec itinéraire
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0][0].show_route).toBe(true)
  })

  it('"Générer la carte" sans itinéraire sauve directement sans confirmation', async () => {
    const onSave = vi.fn()
    render(<ClientMapForm pois={POIS} onSave={onSave} onCancel={() => {}} saving={false} />)

    // Step 2 avec seulement des spots (pas d'itinéraire)
    const input = screen.getByPlaceholderText(/Famille Martin/i)
    await userEvent.type(input, 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /Continuer/i }))
    await userEvent.click(screen.getByTestId('add-2-spots'))
    // Pas de setItinerary → itinerary.length = 0

    await userEvent.click(screen.getByRole('button', { name: /Générer/i }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0][0].show_route).toBe(false)
  })
})
