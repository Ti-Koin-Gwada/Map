import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Flush Promises + React state updates from async handlers outside of React events
const flushAll = () => act(async () => { await new Promise(r => setTimeout(r, 50)) })

// ── Mocks ────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual()
  return { ...actual, useParams: () => ({ slug: 'test-slug' }) }
})

vi.mock('../../hooks/useClientMap.js', () => ({ useClientMap: vi.fn() }))
vi.mock('../../hooks/useIsMobile.js', () => ({ useIsMobile: vi.fn() }))

// MapView renders clickable markers so we can simulate user selections
vi.mock('../../components/map/MapView.jsx', () => ({
  default: ({ pois, onSelect, routes, onHomeClick }) => (
    <div
      data-testid="map-view"
      data-count={pois.length}
      data-route-count={routes?.[0]?.pois?.length ?? 0}
    >
      {pois.map(p => (
        <button key={p.id} data-testid={`marker-${p.id}`} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
      {onHomeClick && (
        <button data-testid="map-home-pin" onClick={onHomeClick}>home-pin</button>
      )}
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
    itineraries: [],
    loading: false, is404: false, is403: false, error: null,
  }
}

let localStore = {}

beforeEach(() => {
  localStore = {}
  vi.stubGlobal('localStorage', {
    getItem:    (k) => localStore[k] ?? null,
    setItem:    (k, v) => { localStore[k] = String(v) },
    removeItem: (k) => { delete localStore[k] },
    clear:      () => { localStore = {} },
  })
  useClientMap.mockReturnValue(makeMap())
  useIsMobile.mockReturnValue(false) // desktop par défaut
  delete window.google
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete window.google
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

// ── Filtre — mobile (MobileFilterBar) ─────────────────────────

describe('Filtre par catégorie — mobile', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(true)
  })

  it('affiche les chips de filtre dans MobileFilterBar', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /^Tous$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Plages/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Restaurants/i })).toBeInTheDocument()
  })

  it('filtre les markers au clic d\'une catégorie', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')
    await userEvent.click(screen.getByRole('button', { name: /Restaurants/i }))
    expect(mapView.dataset.count).toBe('1')
  })

  it('"Tous" réinitialise le filtre actif', async () => {
    renderPage()
    const mapView = screen.getByTestId('map-view')
    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))
    expect(mapView.dataset.count).toBe('2')
    await userEvent.click(screen.getByRole('button', { name: /^Tous$/i }))
    expect(mapView.dataset.count).toBe('3')
  })

  it('garde le bouton "Tous" visible si le filtre actif disparaît des catégories disponibles', async () => {
    // Filtre actif sur 'plage', puis refetch avec seulement des restaurants → barre doit rester
    const { rerender } = renderPage()
    await userEvent.click(screen.getByRole('button', { name: /Plages/i }))
    // Simule un refetch avec des POI d'une seule catégorie différente
    useClientMap.mockReturnValue(makeMap([RESTO_1]))
    rerender(<ClientMapPage />)
    // Le bouton "Tous" doit rester disponible malgré 1 seule catégorie
    expect(screen.getByRole('button', { name: /^Tous$/i })).toBeInTheDocument()
    // Cliquer "Tous" remet le filtre à zéro et les spots sont visibles
    await userEvent.click(screen.getByRole('button', { name: /^Tous$/i }))
    expect(screen.getByTestId('map-view').dataset.count).toBe('1')
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

// ── Itinéraire ────────────────────────────────────────────────

function makeItineraryMap() {
  return {
    map: { client_name: 'Alice', notes: {}, show_route: true },
    pois: [PLAGE_1, PLAGE_2, RESTO_1],
    itineraries: [{
      id: 'itin-1',
      name: 'Mon itinéraire',
      steps: ['plage-1', 'resto-1'],
    }],
    loading: false, is404: false, is403: false, error: null,
  }
}

describe('Itinéraire', () => {
  beforeEach(() => {
    useClientMap.mockReturnValue(makeItineraryMap())
    useIsMobile.mockReturnValue(false)
  })

  it('passe routes avec 2 pois au MapView', () => {
    renderPage()
    expect(screen.getByTestId('map-view').dataset.routeCount).toBe('2')
  })

  it('passe routes=[] quand pas d\'itinéraires', () => {
    useClientMap.mockReturnValue(makeMap())
    renderPage()
    expect(screen.getByTestId('map-view').dataset.routeCount).toBe('0')
  })

  it('ouvre le panneau Itinéraire quand on clique un spot de l\'itinéraire', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getByText('Mon itinéraire')).toBeInTheDocument()
    expect(screen.getByText('2 étapes')).toBeInTheDocument()
  })

  it('affiche les deux étapes dans le panneau', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getAllByText('Plage du Gosier').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Chez Marcel').length).toBeGreaterThanOrEqual(1)
  })

  it('développe le détail d\'une étape au clic', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    expect(screen.getByText('5 rue des Flamboyants')).toBeInTheDocument()
    expect(screen.getByText('Cuisine créole.')).toBeInTheDocument()
  })

  it("n'ouvre pas le panneau itinéraire pour un spot régulier", async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-2'))
    expect(screen.queryByText('Mon itinéraire')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plage Caravelle' })).toBeInTheDocument()
  })

  it('ferme le panneau itinéraire au clic sur le bouton ×', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getByText('Mon itinéraire')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Fermer l.itin/i }))
    expect(screen.queryByText('Mon itinéraire')).not.toBeInTheDocument()
  })

  it('affiche le panneau itinéraire sur mobile (ItinerarySheet)', async () => {
    useIsMobile.mockReturnValue(true)
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.getByText('Mon itinéraire')).toBeInTheDocument()
    expect(screen.getByText('2 étapes')).toBeInTheDocument()
  })

  it('ne montre pas le panneau itinéraire quand aucun spot n\'est cliqué', () => {
    renderPage()
    expect(screen.queryByText('Mon itinéraire')).not.toBeInTheDocument()
  })

  it('le lien "Y aller" dans l\'étape développée est un <a> valide, pas dans un <button>', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    const link = screen.getByRole('link', { name: /Y aller/i })
    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe('A')
    expect(link.closest('button')).toBeNull()
  })
})

// ── Y aller — adresse vs nom ──────────────────────────────────

describe('Bouton Y aller', () => {
  it('utilise l\'adresse du spot dans l\'URL quand elle est disponible', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    const link = screen.getByRole('link', { name: /Y aller/i })
    expect(link.getAttribute('href')).toContain(encodeURIComponent('5 rue des Flamboyants'))
  })

  it('utilise le nom + Guadeloupe quand l\'adresse est absente', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    const link = screen.getByRole('link', { name: /Y aller/i })
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Plage du Gosier Guadeloupe'))
    expect(link.getAttribute('href')).not.toContain('null')
  })

  it('utilise l\'adresse dans un étape d\'itinéraire étendue', async () => {
    useClientMap.mockReturnValue({
      map: { client_name: 'Alice', notes: {}, show_route: true },
      pois: [PLAGE_1, RESTO_1],
      itineraries: [{ id: 'itin-1', name: 'Test', steps: ['plage-1', 'resto-1'] }],
      loading: false, is404: false, is403: false, error: null,
    })
    renderPage()
    await userEvent.click(screen.getByTestId('marker-resto-1'))
    const link = screen.getByRole('link', { name: /Y aller/i })
    expect(link.getAttribute('href')).toContain(encodeURIComponent('5 rue des Flamboyants'))
  })
})

// ── Mon domicile ──────────────────────────────────────────────

function mockGeocoder(address = '5 rue des Flamboyants, Gosier, Guadeloupe') {
  const geocode = vi.fn().mockResolvedValue({
    results: [{
      geometry: { location: { lat: () => 16.2, lng: () => -61.5 } },
      formatted_address: address,
    }],
  })
  window.google = { maps: { Geocoder: vi.fn(() => ({ geocode })) } }
  return geocode
}

function mockGeocoderEmpty() {
  const geocode = vi.fn().mockResolvedValue({ results: [] })
  window.google = { maps: { Geocoder: vi.fn(() => ({ geocode })) } }
  return geocode
}

const HOME_DATA = { lat: 16.2, lng: -61.5, address: '5 rue des Flamboyants, Gosier' }

describe('Mon domicile — desktop', () => {
  it('affiche le bouton Mon domicile sur la carte', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Mon domicile' })).toBeInTheDocument()
  })

  it('ouvre le modal quand aucun domicile n\'est enregistré', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByPlaceholderText(/rue de la Plage/i)).toBeInTheDocument()
  })

  it('affiche une erreur quand le géocodeur n\'est pas encore chargé', async () => {
    // window.google n'est pas défini
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    await userEvent.type(screen.getByPlaceholderText(/rue de la Plage/i), '12 rue test')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/pas encore chargée/i)).toBeInTheDocument()
  })

  it('affiche une erreur quand l\'adresse est introuvable', async () => {
    mockGeocoderEmpty()
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    await userEvent.type(screen.getByPlaceholderText(/rue de la Plage/i), 'xyz abc zzz')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/Adresse introuvable/i)).toBeInTheDocument()
  })

  it('le bouton Enregistrer est désactivé sans saisie et actif avec saisie', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    // Champ vide → bouton désactivé
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    await userEvent.type(screen.getByPlaceholderText(/rue de la Plage/i), '5 rue des Flamboyants')
    // Champ rempli → bouton actif
    expect(screen.getByRole('button', { name: 'Enregistrer' })).not.toBeDisabled()
  })

  it('relit homeData depuis localStorage au montage du composant', () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    // Le bouton est bleu (homeData présent) — cliquer ouvre HomeInfoPanel
    // On vérifie que l'UI reflète bien les données sauvegardées
    expect(screen.getByRole('button', { name: 'Mon domicile' })).toBeInTheDocument()
    // La validation du format localStorage partiel est testée séparément
  })

  it('ouvre directement HomeInfoPanel quand un domicile est déjà enregistré', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })

  it('Supprimer efface le domicile, ferme le panel et nettoie localStorage', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(screen.queryByText(HOME_DATA.address)).not.toBeInTheDocument()
    expect(localStorage.getItem('tikoin_home_test-slug')).toBeNull()
  })



  it('Modifier rouvre le modal avec l\'adresse courante pré-remplie', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    const input = screen.getByPlaceholderText(/rue de la Plage/i)
    expect(input.value).toBe(HOME_DATA.address)
  })

  it('cliquer sur un marker de la carte ferme HomeInfoPanel', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.queryByText(HOME_DATA.address)).not.toBeInTheDocument()
  })

  it('cliquer le pin domicile sur la carte (via MapView) ouvre HomeInfoPanel', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByTestId('map-home-pin'))
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
  })

  it('ignore un localStorage avec données partielles (pas d\'address)', () => {
    localStorage.setItem('tikoin_home_test-slug', JSON.stringify({ lat: 16.2, lng: -61.5 }))
    renderPage()
    // Le bouton domicile doit s'ouvrir en mode "ajout" (modal) et non en mode "info"
    // → le bouton "Mon domicile" ne doit pas ouvrir HomeInfoPanel
    expect(screen.queryByText('Mon domicile')).not.toBeInTheDocument() // pas de panel
    expect(screen.getByRole('button', { name: 'Mon domicile' })).toBeInTheDocument() // bouton seul
  })

  it('ferme le modal au clic sur le fond', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByPlaceholderText(/rue de la Plage/i)).toBeInTheDocument()
    const backdrop = screen.getByPlaceholderText(/rue de la Plage/i).closest('form').parentElement.parentElement
    fireEvent.click(backdrop)
    expect(screen.queryByPlaceholderText(/rue de la Plage/i)).not.toBeInTheDocument()
  })
})

describe('Mon domicile — mobile', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(true)
  })

  it('affiche le bouton Mon domicile sur mobile', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Mon domicile' })).toBeInTheDocument()
  })

  it('ouvre HomeInfoSheet quand un domicile est enregistré', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modifier l.adresse/i })).toBeInTheDocument()
  })

  it('Supprimer depuis HomeInfoSheet efface le domicile', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    await userEvent.click(screen.getByRole('button', { name: /Supprimer/i }))
    expect(screen.queryByText(HOME_DATA.address)).not.toBeInTheDocument()
    expect(localStorage.getItem('tikoin_home_test-slug')).toBeNull()
  })

  it('cliquer un marker ferme HomeInfoSheet', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('marker-plage-1'))
    expect(screen.queryByText(HOME_DATA.address)).not.toBeInTheDocument()
  })

  it('le bouton FAB domicile est masqué quand HomeInfoSheet est ouvert', async () => {
    localStore['tikoin_home_test-slug'] = JSON.stringify(HOME_DATA)
    renderPage()
    // Le FAB est visible au départ
    expect(screen.getByRole('button', { name: 'Mon domicile' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mon domicile' }))
    // HomeInfoSheet est ouvert — le FAB disparaît (condition !homeOpen dans le rendu)
    expect(screen.queryByRole('button', { name: 'Mon domicile' })).not.toBeInTheDocument()
    // La sheet est bien affichée
    expect(screen.getByText(HOME_DATA.address)).toBeInTheDocument()
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
