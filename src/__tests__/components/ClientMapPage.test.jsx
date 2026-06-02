import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual()
  return { ...actual, useParams: () => ({ slug: 'test-slug' }) }
})

vi.mock('../../hooks/useClientMap.js', () => ({ useClientMap: vi.fn() }))
vi.mock('../../hooks/useIsMobile.js', () => ({ useIsMobile: vi.fn() }))

// MapView renders clickable markers so we can simulate user selections
vi.mock('../../components/map/MapView.jsx', () => ({
  default: ({ pois, onSelect }) => (
    <div data-testid="map-view" data-count={pois.length}>
      {pois.map(p => (
        <button key={p.id} data-testid={`marker-${p.id}`} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}))

import { useClientMap } from '../../hooks/useClientMap.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import ClientMapPage from '../../pages/ClientMapPage.jsx'

// ── Fixtures ─────────────────────────────────────────────────

const PLAGE_1 = { id: 'plage-1', name: 'Plage du Gosier', category: 'plage',    latitude: 16.2, longitude: -61.5, image_url: null, flo_reco: null, menu_url: null, tags: [], address: null, description: null }
const PLAGE_2 = { id: 'plage-2', name: 'Plage Caravelle',  category: 'plage',    latitude: 16.1, longitude: -61.4, image_url: null, flo_reco: null, menu_url: null, tags: [], address: null, description: null }
const RESTO_1 = {
  id: 'resto-1', name: 'Chez Marcel', category: 'restaurant', latitude: 16.3, longitude: -61.6,
  image_url: null, tags: [], address: '5 rue des Flamboyants', description: 'Cuisine créole.',
  flo_reco: 'Les accras sont incroyables !', menu_url: 'https://cdn.example.com/menu.jpg',
}

function makeMap(pois = [PLAGE_1, PLAGE_2, RESTO_1]) {
  return {
    map: { client_name: 'Alice', notes: {} },
    pois,
    loading: false, is404: false, is403: false, error: null,
  }
}

beforeEach(() => {
  useClientMap.mockReturnValue(makeMap())
  useIsMobile.mockReturnValue(false) // desktop par défaut
})

// ── Helpers ───────────────────────────────────────────────────

function renderPage() {
  return render(<ClientMapPage />)
}

// ── Filtre — desktop (InfoPanel) ──────────────────────────────

describe('Filtre par catégorie — desktop', () => {
  it('affiche les pills de filtre dans l\'InfoPanel quand aucun spot n\'est sélectionné', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Plages/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Restaurants/i })).toBeInTheDocument()
  })

  it('affiche le compte total quand aucun filtre n\'est actif', () => {
    renderPage()
    expect(screen.getByText('Vos 3 spots')).toBeInTheDocument()
  })

  it('filtre les markers sur la carte après un clic', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')
    expect(mapView.dataset.count).toBe('3')

    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))

    expect(mapView.dataset.count).toBe('2')
    expect(screen.queryByTestId('marker-resto-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('marker-plage-1')).toBeInTheDocument()
  })

  it('met à jour le compteur "X sur Y spots" quand le filtre est actif', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))
    expect(screen.getByText('2 sur 3 spots')).toBeInTheDocument()
  })

  it('désactive le filtre en cliquant à nouveau sur la même catégorie', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')

    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))
    expect(mapView.dataset.count).toBe('2')

    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))
    expect(mapView.dataset.count).toBe('3')
    expect(screen.getByText('Vos 3 spots')).toBeInTheDocument()
  })

  it('ferme le panneau du spot si sa catégorie est filtrée', async () => {
    renderPage()
    // Sélectionner un spot plage — vérifier via le heading h3 dans InfoPanel
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getByRole('heading', { name: 'Plage du Gosier' })).toBeInTheDocument()

    // Activer le filtre resto → le heading InfoPanel disparaît
    await userEvent.click(screen.getByRole('button', { name: /Restaurants/i }))
    expect(screen.queryByRole('heading', { name: 'Plage du Gosier' })).not.toBeInTheDocument()
  })

  it('garde le panneau ouvert si le spot correspond au filtre activé', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    await userEvent.click(screen.getByRole('button', { name: /Restaurants/i }))
    // Le heading h3 du spot doit rester visible
    expect(screen.getByRole('heading', { name: 'Chez Marcel' })).toBeInTheDocument()
  })

  it('change de filtre depuis le strip compact dans la vue détail', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')

    // Ouvrir un spot plage — heading h3 visible dans InfoPanel
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getByRole('heading', { name: 'Plage du Gosier' })).toBeInTheDocument()

    // Cliquer sur Restaurants dans le strip compact qui s'affiche dans InfoPanel
    const restaurantBtns = screen.getAllByRole('button', { name: /Restaurants/i })
    await userEvent.click(restaurantBtns[0])

    // Le filtre resto est actif : 1 marker visible, le panneau se ferme (plage cachée)
    expect(mapView.dataset.count).toBe('1')
  })
})

// ── Filtre — mobile (MobileLegend) ────────────────────────────

describe('Filtre par catégorie — mobile', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(true)
  })

  it('affiche les dots de filtre dans MobileLegend', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Filtrer Plages/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filtrer Restaurants/i })).toBeInTheDocument()
  })

  it('affiche le count total au départ', () => {
    renderPage()
    expect(screen.getByText('3 spots')).toBeInTheDocument()
  })

  it('affiche "X / Y" et le nom de la catégorie quand le filtre est actif', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /Filtrer Plages/i }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText(/Plages/i)).toBeInTheDocument()
  })

  it('filtre les markers sur la carte depuis MobileLegend', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')
    await userEvent.click(screen.getByRole('button', { name: /Filtrer Restaurants/i }))
    expect(mapView.dataset.count).toBe('1')
  })
})

// ── Reco de Flo ───────────────────────────────────────────────

describe('Reco de Flo', () => {
  it('affiche le bloc "Reco de Flo" quand le POI a flo_reco', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    expect(screen.getByText('Reco de Flo')).toBeInTheDocument()
    expect(screen.getByText('Les accras sont incroyables !')).toBeInTheDocument()
  })

  it('ne rend pas le bloc "Reco de Flo" pour un POI sans flo_reco', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.queryByText('Reco de Flo')).not.toBeInTheDocument()
  })
})

// ── Carte du menu (MenuViewer) ────────────────────────────────

describe('Carte du menu', () => {
  it('affiche le bouton "Voir la carte du menu" quand le POI a menu_url', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    expect(screen.getByRole('button', { name: /Voir la carte du menu/i })).toBeInTheDocument()
  })

  it("n'affiche pas le bouton pour un POI sans menu_url", async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.queryByRole('button', { name: /Voir la carte du menu/i })).not.toBeInTheDocument()
  })

  it('ouvre le MenuViewer au clic sur le bouton', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    await userEvent.click(screen.getByRole('button', { name: /Voir la carte du menu/i }))
    const img = screen.getByRole('img', { name: /Carte du menu/i })
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/menu.jpg')
  })

  it('ferme le MenuViewer sur la touche Escape', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    await userEvent.click(screen.getByRole('button', { name: /Voir la carte du menu/i }))
    expect(screen.getByRole('img', { name: /Carte du menu/i })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('img', { name: /Carte du menu/i })).not.toBeInTheDocument()
  })

  it('ferme le MenuViewer au clic sur le fond', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    await userEvent.click(screen.getByRole('button', { name: /Voir la carte du menu/i }))

    // Le backdrop est le div fixe — on simule un clic dessus
    const backdrop = screen.getByRole('img', { name: /Carte du menu/i }).parentElement
    fireEvent.click(backdrop)
    expect(screen.queryByRole('img', { name: /Carte du menu/i })).not.toBeInTheDocument()
  })

  it('ferme le MenuViewer quand on change de spot via la carte', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    await userEvent.click(screen.getByRole('button', { name: /Voir la carte du menu/i }))
    expect(screen.getByRole('img', { name: /Carte du menu/i })).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.queryByRole('img', { name: /Carte du menu/i })).not.toBeInTheDocument()
  })
})
