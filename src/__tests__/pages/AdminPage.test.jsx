import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// ── Mocks des hooks (data layer) ──────────────────────────────
// On rend `isAdmin: true` pour traverser la gate d'auth et atteindre
// les écrans admin — c'est là que vivent les bugs de rendu (ex: un
// hook utilisé sans import → `useState is not defined`).

vi.mock('../../hooks/useAdmin.js', () => ({
  useAdmin: vi.fn(),
}))
vi.mock('../../hooks/usePois.js', () => ({
  usePois: () => ({ pois: [] }),
}))
vi.mock('../../hooks/useClientMaps.js', () => ({
  useClientMaps: () => ({ create: { mutateAsync: vi.fn() } }),
}))

// ── Mocks des composants enfants (UI lourde) ──────────────────
// On les remplace par des stubs : le but n'est PAS de tester leur
// contenu (déjà couvert ailleurs) mais de vérifier que les wrappers
// d'écran d'AdminPage s'exécutent et montent sans crash.

vi.mock('../../components/admin/AdminLayout.jsx', () => ({
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}))
vi.mock('../../components/admin/AdminLogin.jsx', () => ({
  default: () => <div data-testid="admin-login" />,
}))
vi.mock('../../components/admin/PoiManager.jsx', () => ({
  default: () => <div data-testid="poi-manager" />,
}))
vi.mock('../../components/admin/ClientMapList.jsx', () => ({
  default: ({ onNew }) => <button data-testid="client-map-list" onClick={onNew} />,
}))
vi.mock('../../components/admin/ClientMapForm.jsx', () => ({
  default: () => <div data-testid="client-map-form" />,
}))

import { useAdmin } from '../../hooks/useAdmin.js'
import AdminPage from '../../pages/AdminPage.jsx'

// Rend AdminPage sous une route /admin/* (les routes internes sont relatives)
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Gate d'authentification ───────────────────────────────────

describe('AdminPage — gate auth', () => {
  it('affiche un spinner pendant le chargement', () => {
    useAdmin.mockReturnValue({ isAdmin: false, isLoading: true })
    const { container } = renderAt('/admin/spots')
    // pas de login ni de layout tant que ça charge
    expect(screen.queryByTestId('admin-login')).toBeNull()
    expect(screen.queryByTestId('admin-layout')).toBeNull()
    // spinner présent
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('affiche le login quand non authentifié', () => {
    useAdmin.mockReturnValue({ isAdmin: false, isLoading: false })
    renderAt('/admin/spots')
    expect(screen.getByTestId('admin-login')).toBeInTheDocument()
  })
})

// ── Smoke test des écrans admin (anti-régression "X is not defined") ──

describe('AdminPage — écrans (rendu sans crash)', () => {
  beforeEach(() => {
    useAdmin.mockReturnValue({ isAdmin: true, isLoading: false })
  })

  it('monte l\'écran Spots', () => {
    renderAt('/admin/spots')
    expect(screen.getByTestId('poi-manager')).toBeInTheDocument()
  })

  it('monte l\'écran Cartes', () => {
    renderAt('/admin/cartes')
    expect(screen.getByTestId('client-map-list')).toBeInTheDocument()
  })

  it('monte l\'écran Create (régression: useState non importé)', () => {
    // Si CreateMapScreen utilise un hook non importé, ce rendu lève
    // "useState is not defined" et le test échoue.
    renderAt('/admin/create')
    expect(screen.getByTestId('client-map-form')).toBeInTheDocument()
  })

  it('redirige une route inconnue vers Spots', () => {
    renderAt('/admin/nope')
    expect(screen.getByTestId('poi-manager')).toBeInTheDocument()
  })
})
