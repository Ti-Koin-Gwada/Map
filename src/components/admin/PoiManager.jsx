import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { usePois } from '../../hooks/usePois.js'
import { useToast } from '../ui/Toast.jsx'
import MapView from '../map/MapView.jsx'
import MapFilters from '../map/MapFilters.jsx'
import { CategoryBadge } from '../ui/Badge.jsx'
import Modal from '../ui/Modal.jsx'
import PoiForm from './PoiForm.jsx'
import { CATEGORIES } from '../../lib/constants.js'

function SpotPhoto({ poi }) {
  const cat = CATEGORIES[poi.category]
  if (poi.image_url) return <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: cat ? `repeating-linear-gradient(135deg, ${cat.color}15 0 8px, ${cat.color}08 8px 16px)` : '#F3F1E8',
      }}
    />
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
      style={{ background: on ? 'var(--color-forest)' : '#CBD5C9' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  )
}

export default function PoiManager() {
  const { pois, loading, create, update, remove } = usePois()
  const toast = useToast()
  const [filter, setFilter]   = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [modalMode, setModalMode]   = useState(null) // 'create' | 'edit'
  const [editingPoi, setEditingPoi] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [popoverId, setPopoverId]   = useState(null)

  const shown = filter === 'all' ? pois : pois.filter(p => p.category === filter)
  const selectedPoi = shown.find(p => p.id === selectedId)

  const handleToggleActive = async (poi) => {
    try {
      await update.mutateAsync({ id: poi.id, is_active: !poi.is_active })
    } catch {
      toast('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modalMode === 'edit') {
        await update.mutateAsync({ id: editingPoi.id, ...data })
        toast('Spot mis à jour')
      } else {
        await create.mutateAsync(data)
        toast('Spot créé')
      }
      setModalMode(null)
    } catch {
      toast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce spot ? Cette action est irréversible.')) return
    try {
      await remove.mutateAsync(id)
      toast('Spot supprimé')
      setPopoverId(null)
      if (selectedId === id) setSelectedId(null)
    } catch {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between px-7 py-5 flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif italic font-semibold text-3xl" style={{ color: 'var(--color-forest-dark)' }}>
            Mes spots
          </h1>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {pois.length} spots dans la base
          </span>
        </div>
        <button
          type="button"
          onClick={() => { setEditingPoi(null); setModalMode('create') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: 'var(--color-forest)' }}
        >
          <Plus size={16} /> Ajouter un spot
        </button>
      </div>

      {/* Filtres */}
      <MapFilters activeFilter={filter} onChange={setFilter} />

      {/* Corps : carte + liste */}
      <div className="flex flex-1 min-h-0">
        {/* Carte */}
        <div className="flex-1 relative min-h-0" style={{ borderRight: '1px solid var(--color-border)' }}>
          <MapView
            pois={shown}
            selectedId={popoverId || selectedId}
            onSelect={(id) => {
              setPopoverId(id === popoverId ? null : id)
              setSelectedId(id)
            }}
          />

          {/* Popover pin */}
          {popoverId && (() => {
            const poi = shown.find(p => p.id === popoverId)
            if (!poi) return null
            return (
              <div
                className="absolute top-4 left-4 z-20 bg-white rounded-xl shadow-lg p-3"
                style={{ border: '1px solid var(--color-border)', width: 200 }}
              >
                <p className="font-serif italic font-semibold text-base mb-2.5" style={{ color: 'var(--color-forest-dark)' }}>
                  {poi.name}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingPoi(poi); setModalMode('edit'); setPopoverId(null) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <Edit2 size={12} /> Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(poi.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPopoverId(null)}
                  className="absolute top-2 right-2 text-xs opacity-40 hover:opacity-70"
                >×</button>
              </div>
            )
          })()}
        </div>

        {/* Liste */}
        <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: 'var(--color-bg)' }}>
          <p
            className="px-5 py-3 text-xs font-semibold uppercase tracking-wider flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Liste · {shown.length} spot{shown.length > 1 ? 's' : ''}
          </p>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-forest)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto tk-scroll px-4 pb-4 flex flex-col gap-2">
              {shown.map(poi => (
                <div
                  key={poi.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white cursor-pointer transition-all"
                  style={{ border: `1px solid ${selectedId === poi.id ? 'var(--color-forest)' : 'var(--color-border)'}` }}
                  onClick={() => setSelectedId(s => s === poi.id ? null : poi.id)}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <SpotPhoto poi={poi} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORIES[poi.category]?.color || '#ccc' }}
                      />
                      <span
                        className="font-serif italic font-semibold text-sm truncate"
                        style={{ color: 'var(--color-forest-dark)' }}
                      >
                        {poi.name}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {poi.address || poi.category}
                    </p>
                  </div>
                  <Toggle on={poi.is_active} onChange={() => handleToggleActive(poi)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Formulaire */}
      <Modal
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Modifier le spot' : 'Ajouter un spot'}
        wide
      >
        <PoiForm
          initial={editingPoi}
          onSave={handleSave}
          onCancel={() => setModalMode(null)}
          saving={saving}
        />
      </Modal>
    </>
  )
}
