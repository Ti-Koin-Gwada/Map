import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

// ── Mocks ─────────────────────────────────────────────────────

vi.mock('../../components/map/MapView.jsx', () => ({
  default: ({ pois, onToggle, chosenIds }) => (
    <div>
      {pois.map(p => (
        <button key={p.id} data-testid={`pin-${p.id}`} onClick={() => onToggle?.(p.id)}>
          {p.name}
        </button>
      ))}
      <span data-testid="chosen-pins">{chosenIds?.join(',') ?? ''}</span>
    </div>
  ),
}))
vi.mock('../../components/map/MapFilters.jsx', () => ({ default: () => null }))
vi.mock('../../hooks/useIsMobile.js', () => ({ useIsMobile: () => false }))

import MapSelector from '../../components/admin/MapSelector.jsx'

// ── Fixtures ──────────────────────────────────────────────────

const POIS = [
  { id: 'a', name: 'Plage A',  category: 'plage',      latitude: 16.0, longitude: -61.0 },
  { id: 'b', name: 'Resto B',  category: 'restaurant', latitude: 16.1, longitude: -61.1 },
  { id: 'c', name: 'Rando C',  category: 'randonnee',  latitude: 16.2, longitude: -61.2 },
]

// ── Wrapper avec état contrôlé ─────────────────────────────────

function Wrapper({ initialChosen = [], initialItinerary = [], onChosenChange, onItineraryChange } = {}) {
  const [chosen, setChosen] = useState(initialChosen)
  const [itinerary, setItinerary] = useState(initialItinerary)
  const [notes, setNotes] = useState({})

  const handleChosenChange = (v) => { setChosen(v); onChosenChange?.(v) }
  const handleItineraryChange = (v) => { setItinerary(v); onItineraryChange?.(v) }

  return (
    <>
      <MapSelector
        pois={POIS}
        chosen={chosen}
        onChosenChange={handleChosenChange}
        notes={notes}
        onNotesChange={setNotes}
        itinerary={itinerary}
        onItineraryChange={handleItineraryChange}
        totalPois={POIS.length}
      />
      <span data-testid="chosen-state">{chosen.join(',')}</span>
      <span data-testid="itinerary-state">{itinerary.join(',')}</span>
    </>
  )
}

// ── Fix 3 : toggle déselectionne spot + itinéraire ─────────────

describe('MapSelector — toggle (Fix Issue 3)', () => {
  it('ajouter un spot au clic pin : chosen +1, itinéraire inchangé', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('a')
    expect(screen.getByTestId('itinerary-state').textContent).toBe('')
  })

  it('retirer un spot choisi mais hors itinéraire : seulement chosen -1', async () => {
    render(<Wrapper initialChosen={['a']} />)
    // Le spot 'a' est dans chosen mais pas dans itinerary
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('')
    expect(screen.getByTestId('itinerary-state').textContent).toBe('')
  })

  it('retirer un spot dans l\'itinéraire : l\'enlève de chosen ET de l\'itinéraire', async () => {
    render(<Wrapper initialChosen={['a', 'b']} initialItinerary={['a']} />)
    // 'a' est dans chosen ET dans itinerary → clic pin-a doit l'enlever des deux
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('b')
    expect(screen.getByTestId('itinerary-state').textContent).toBe('')
  })

  it('toggle n\'affecte pas l\'itinéraire quand le spot n\'est pas dans l\'itinéraire', async () => {
    render(<Wrapper initialChosen={['a', 'b']} initialItinerary={['b']} />)
    // retirer 'a' (pas dans itinerary) → itinerary reste ['b']
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('b')
    expect(screen.getByTestId('itinerary-state').textContent).toBe('b')
  })
})

// ── Fix 3 : removeSpot (bouton ×) ─────────────────────────────

describe('MapSelector — removeSpot via ×', () => {
  it('le bouton × retire le spot de chosen ET de l\'itinéraire', async () => {
    render(<Wrapper initialChosen={['a', 'b']} initialItinerary={['a']} />)
    // 'Plage A' apparaît dans SpotRow ET dans ItineraryRow — on prend le 1er (SpotRow)
    const plageAName = screen.getAllByText('Plage A')[0]
    const flexRow = plageAName.parentElement // div flex contenant dot + nom + boutons
    // Le bouton × du SpotRow n'a pas de title (le toggle itinéraire en a un)
    const removeBtn = flexRow.querySelector('button:not([title])')
    await userEvent.click(removeBtn)

    expect(screen.getByTestId('chosen-state').textContent).toBe('b')
    expect(screen.getByTestId('itinerary-state').textContent).toBe('')
  })
})

// ── Fix 6 : precompute itineraryOrder — rendu correct des numéros ──

describe('MapSelector — numérotation itinéraire (Fix Issue 6)', () => {
  it('les badges dans SpotRow affichent le bon index d\'ordre', () => {
    render(<Wrapper initialChosen={['a', 'b', 'c']} initialItinerary={['c', 'a']} />)
    // itinerary = ['c', 'a'] → itineraryOrder = { c: 0, a: 1 }
    // chosen order: a → badge '2', b → badge '+', c → badge '1'
    // Les boutons "Retirer de l'itinéraire" (title) sont dans l'ordre du chosen array
    const inItineraryBtns = screen.getAllByTitle("Retirer de l'itinéraire")
    expect(inItineraryBtns).toHaveLength(2)
    expect(inItineraryBtns[0].textContent).toBe('2') // 'a' est à l'index 1 → affiche 2
    expect(inItineraryBtns[1].textContent).toBe('1') // 'c' est à l'index 0 → affiche 1
  })
})
