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

function Wrapper({ initialChosen = [], initialItineraries = [], onChosenChange, onItinerariesChange } = {}) {
  const [chosen, setChosen] = useState(initialChosen)
  const [itineraries, setItineraries] = useState(initialItineraries)
  const [notes, setNotes] = useState({})

  const handleChosenChange = (v) => { setChosen(v); onChosenChange?.(v) }
  const handleItinerariesChange = (v) => { setItineraries(v); onItinerariesChange?.(v) }

  return (
    <>
      <MapSelector
        pois={POIS}
        chosen={chosen}
        onChosenChange={handleChosenChange}
        notes={notes}
        onNotesChange={setNotes}
        itineraries={itineraries}
        onItinerariesChange={handleItinerariesChange}
        totalPois={POIS.length}
      />
      <span data-testid="chosen-state">{chosen.join(',')}</span>
      <span data-testid="itineraries-count">{itineraries.length}</span>
    </>
  )
}

// ── Mode normal : toggle ──────────────────────────────────────

describe('MapSelector — toggle en mode normal', () => {
  it('ajouter un spot au clic pin : chosen +1', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('a')
  })

  it('retirer un spot choisi : chosen -1', async () => {
    render(<Wrapper initialChosen={['a']} />)
    await userEvent.click(screen.getByTestId('pin-a'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('')
  })

  it('retirer un spot via × le retire de chosen', async () => {
    render(<Wrapper initialChosen={['a', 'b']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Retirer Plage A' }))
    expect(screen.getByTestId('chosen-state').textContent).toBe('b')
  })
})

// ── Mode itinéraire ───────────────────────────────────────────

describe('MapSelector — mode itinéraire', () => {
  it('bouton "Créer un itinéraire" est présent quand pas en mode', () => {
    render(<Wrapper />)
    expect(screen.getByRole('button', { name: /Créer un itinéraire/i })).toBeInTheDocument()
  })

  it('entrer en mode itinéraire change l\'interface', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    expect(screen.getAllByText(/Mode itinéraire/i).length).toBeGreaterThan(0)
  })

  it('cliquer un pin en mode itinéraire l\'ajoute aux étapes et à chosen', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    await userEvent.click(screen.getByTestId('pin-a'))
    await userEvent.click(screen.getByTestId('pin-b'))
    expect(screen.getByTestId('chosen-state').textContent).toBe('a,b')
    // Le compteur d'étapes dans l'interface
    expect(screen.getByText(/2 étapes sélectionnée/i)).toBeInTheDocument()
  })

  it('cliquer un pin déjà dans chosen l\'ajoute aux étapes sans doublon dans chosen', async () => {
    render(<Wrapper initialChosen={['a']} />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    await userEvent.click(screen.getByTestId('pin-a'))
    await userEvent.click(screen.getByTestId('pin-b'))
    // 'a' était déjà dans chosen, 'b' s'ajoute
    expect(screen.getByTestId('chosen-state').textContent).toBe('a,b')
  })

  it('confirmer un itinéraire avec nom l\'ajoute à la liste', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    await userEvent.click(screen.getByTestId('pin-a'))
    await userEvent.click(screen.getByTestId('pin-b'))
    // Cliquer "Terminer"
    await userEvent.click(screen.getByRole('button', { name: /Terminer/i }))
    // Saisir un nom
    const input = screen.getByPlaceholderText(/Itinéraire 1/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Mon itinéraire')
    // Valider
    await userEvent.click(screen.getByRole('button', { name: /Valider/i }))
    expect(screen.getByTestId('itineraries-count').textContent).toBe('1')
    expect(screen.getByText('Mon itinéraire')).toBeInTheDocument()
  })

  it('annuler remet à zéro sans sauvegarder', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    await userEvent.click(screen.getByTestId('pin-a'))
    await userEvent.click(screen.getByRole('button', { name: /Annuler/i }))
    expect(screen.getByTestId('itineraries-count').textContent).toBe('0')
    expect(screen.getByRole('button', { name: /Créer un itinéraire/i })).toBeInTheDocument()
  })

  it('removeSpot retire le spot des itinéraires confirmés', async () => {
    const onItinerariesChange = vi.fn()
    render(
      <Wrapper
        initialChosen={['a', 'b', 'c']}
        initialItineraries={[{ name: 'Matin', steps: ['a', 'b'] }]}
        onItinerariesChange={onItinerariesChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Retirer Plage A' }))

    expect(screen.getByTestId('chosen-state').textContent).toBe('b,c')
    expect(onItinerariesChange).toHaveBeenCalledWith([{ name: 'Matin', steps: ['b'] }])
  })

  it('removeSpot supprime un itinéraire qui devient vide', async () => {
    const onItinerariesChange = vi.fn()
    render(
      <Wrapper
        initialChosen={['a', 'b']}
        initialItineraries={[{ name: 'Solo', steps: ['a'] }]}
        onItinerariesChange={onItinerariesChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Retirer Plage A' }))

    expect(onItinerariesChange).toHaveBeenCalledWith([])
    expect(screen.getByTestId('chosen-state').textContent).toBe('b')
  })

  it('"Terminer" est désactivé avec moins de 2 étapes', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: /Créer un itinéraire/i }))
    await userEvent.click(screen.getByTestId('pin-a'))
    const terminerBtn = screen.getByRole('button', { name: /Terminer/i })
    expect(terminerBtn).toBeDisabled()
  })
})
