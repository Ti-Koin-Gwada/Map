import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin.js'
import { usePois } from '../hooks/usePois.js'
import { useClientMaps } from '../hooks/useClientMaps.js'
import { ToastProvider, useToast } from '../components/ui/Toast.jsx'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import PoiManager from '../components/admin/PoiManager.jsx'
import ClientMapList from '../components/admin/ClientMapList.jsx'
import ClientMapForm from '../components/admin/ClientMapForm.jsx'

// ── Écran création de carte (wrappé pour accéder aux hooks) ──
function CreateMapScreen() {
  const { pois } = usePois()
  const { create } = useClientMaps()
  const toast = useToast()
  const navigate = useNavigate()
  const [saving, setSaving]       = useState(false)
  const [createdSlug, setCreatedSlug] = useState(null)

  const handleSave = async (data) => {
    setSaving(true)
    try {
      const map = await create.mutateAsync(data)
      setCreatedSlug(map.slug)
      toast('Carte créée !')
    } catch {
      toast('Erreur lors de la création', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ClientMapForm
      pois={pois}
      onSave={handleSave}
      onCancel={() => navigate('/admin/cartes')}
      saving={saving}
      createdSlug={createdSlug}
    />
  )
}

// ── Section Mes Cartes (avec bouton "Nouvelle carte") ─────────
function CartesScreen() {
  const navigate = useNavigate()
  return <ClientMapList onNew={() => navigate('/admin/create')} />
}

// ── Shell admin (protège les routes) ─────────────────────────
function AdminShell() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="spots"  element={<PoiManager />} />
        <Route path="cartes" element={<CartesScreen />} />
        <Route path="create" element={<CreateMapScreen />} />
        <Route path="*"      element={<Navigate to="spots" replace />} />
      </Routes>
    </AdminLayout>
  )
}

// ── Page Admin (gate d'authentification) ─────────────────────
export default function AdminPage() {
  const { isAdmin } = useAdmin()
  const [loggedIn, setLoggedIn] = useState(isAdmin)

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />
  }

  return (
    <ToastProvider>
      <AdminShell />
    </ToastProvider>
  )
}
