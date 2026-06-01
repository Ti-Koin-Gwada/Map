import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, MapPin, Navigation, Instagram, X, MoreVertical, Map, List } from 'lucide-react'
import { usePois } from '../../hooks/usePois.js'
import { useToast } from '../ui/Toast.jsx'
import { useIsMobile } from '../../hooks/useIsMobile.js'
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
      style={{ background: cat ? `repeating-linear-gradient(135deg, ${cat.color}15 0 8px, ${cat.color}08 8px 16px)` : '#F3F1E8' }}
    />
  )
}

function SpotMenu({ poi, onEdit, onDelete }) {
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setConfirm(false) } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setConfirm(false) }}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--color-text-muted)', background: open ? 'var(--color-border)' : 'transparent' }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-30 rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'white', border: '1px solid var(--color-border)', minWidth: 160 }}
        >
          {confirm ? (
            <div className="px-3 py-2.5 flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Supprimer ce spot ?
              </p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { onDelete(poi.id); setOpen(false) }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#DC2626' }}>
                  Confirmer
                </button>
                <button type="button" onClick={() => setConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => { onEdit(poi); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-bg)]"
                style={{ color: 'var(--color-text-primary)' }}>
                <Edit2 size={13} /> Modifier
              </button>
              <button type="button" onClick={() => setConfirm(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-red-50"
                style={{ color: '#DC2626', borderTop: '1px solid var(--color-border)' }}>
                <Trash2 size={13} /> Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Bottom sheet spot detail (mobile) ───────────────────── */
function SpotBottomSheet({ poi, onClose, onEdit, onDelete }) {
  if (!poi) return null
  const cat = CATEGORIES[poi.category]
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
  const instaUrl = poi.instagram_url?.startsWith('http') ? poi.instagram_url : `https://www.instagram.com/${poi.instagram_url?.replace('@', '')}`

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end"
      style={{ background: 'rgba(26,46,32,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white flex flex-col overflow-hidden"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '80dvh',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </div>

        {/* Photo */}
        <div className="relative flex-shrink-0" style={{ height: 160, overflow: 'hidden', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}>
          {poi.image_url
            ? <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full" />
          }
          <button type="button" onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow">
            <X size={15} color="var(--color-forest-dark)" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto tk-scroll px-5 py-4 flex flex-col gap-2.5">
          {cat && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
              <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} /> {cat.label}
            </span>
          )}
          <h3 className="font-serif italic font-semibold text-2xl leading-tight" style={{ color: 'var(--color-forest-dark)' }}>
            {poi.name}
          </h3>
          {poi.address && (
            <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={12} /> {poi.address}
            </p>
          )}
          {poi.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{poi.description}</p>
          )}
          {(poi.access || poi.duration || poi.difficulty) && (
            <div className="rounded-xl overflow-hidden text-xs" style={{ border: '1px solid var(--color-border)' }}>
              {poi.access    && <div className="flex justify-between px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}><span style={{ color: 'var(--color-text-muted)' }}>Accès</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.access}</span></div>}
              {poi.duration  && <div className="flex justify-between px-3 py-2.5" style={{ borderBottom: poi.difficulty ? '1px solid var(--color-border)' : 'none' }}><span style={{ color: 'var(--color-text-muted)' }}>Durée</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.duration}</span></div>}
              {poi.difficulty && <div className="flex justify-between px-3 py-2.5"><span style={{ color: 'var(--color-text-muted)' }}>Difficulté</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.difficulty}</span></div>}
            </div>
          )}
          {poi.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {poi.tags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{tag}</span>
              ))}
            </div>
          )}
          {/* Liens externes */}
          <div className="flex gap-2">
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-forest)' }}>
              <Navigation size={14} /> Y aller
            </a>
            {poi.instagram_url && (
              <a href={instaUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid var(--color-border-mid)', color: 'var(--color-text-primary)' }}>
                <Instagram size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Actions admin */}
        <div
          className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <button type="button" onClick={() => { onEdit(poi); onClose() }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            <Edit2 size={15} /> Modifier
          </button>
          <button type="button" onClick={() => { onDelete(poi.id); onClose() }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <Trash2 size={15} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Desktop popover panel ────────────────────────────────── */
function DesktopPopover({ poi, shown, onClose, onEdit, onDelete }) {
  if (!poi) return null
  const cat = CATEGORIES[poi.category]
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
  const instaUrl = poi.instagram_url?.startsWith('http') ? poi.instagram_url : `https://www.instagram.com/${poi.instagram_url?.replace('@', '')}`

  return (
    <div
      className="absolute top-4 left-4 z-20 bg-white rounded-2xl shadow-xl flex flex-col"
      style={{ border: '1px solid var(--color-border)', width: 300, maxHeight: 'calc(100% - 32px)', overflow: 'hidden' }}
    >
      <div style={{ height: 140, flexShrink: 0, overflow: 'hidden', position: 'relative', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}>
        {poi.image_url
          ? <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />
        }
        <button type="button" onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow">
          <X size={13} color="var(--color-forest-dark)" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-2">
        {cat && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} /> {cat.label}
          </span>
        )}
        <h3 className="font-serif italic font-semibold text-xl leading-tight" style={{ color: 'var(--color-forest-dark)' }}>
          {poi.name}
        </h3>
        {poi.address && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={11} /> {poi.address}
          </p>
        )}
        {poi.description && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{poi.description}</p>
        )}
        {(poi.access || poi.duration || poi.difficulty) && (
          <div className="rounded-xl overflow-hidden text-xs" style={{ border: '1px solid var(--color-border)' }}>
            {poi.access    && <div className="flex justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}><span style={{ color: 'var(--color-text-muted)' }}>Accès</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.access}</span></div>}
            {poi.duration  && <div className="flex justify-between px-3 py-2" style={{ borderBottom: poi.difficulty ? '1px solid var(--color-border)' : 'none' }}><span style={{ color: 'var(--color-text-muted)' }}>Durée</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.duration}</span></div>}
            {poi.difficulty && <div className="flex justify-between px-3 py-2"><span style={{ color: 'var(--color-text-muted)' }}>Difficulté</span><span style={{ color: 'var(--color-text-primary)' }}>{poi.difficulty}</span></div>}
          </div>
        )}
        {poi.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {poi.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{tag}</span>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'var(--color-forest)' }}>
            <Navigation size={12} /> Y aller
          </a>
          {poi.instagram_url && (
            <a href={instaUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ border: '1px solid var(--color-border-mid)', color: 'var(--color-text-primary)' }}>
              <Instagram size={12} /> Insta
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button type="button" onClick={() => { onEdit(poi); onClose() }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          <Edit2 size={12} /> Modifier
        </button>
        <button type="button" onClick={() => onDelete(poi.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: '#FEE2E2', color: '#DC2626' }}>
          <Trash2 size={12} /> Supprimer
        </button>
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */
export default function PoiManager() {
  const { pois, loading, create, update, remove } = usePois()
  const toast = useToast()
  const isMobile = useIsMobile()

  const [filter, setFilter]         = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [modalMode, setModalMode]   = useState(null)
  const [editingPoi, setEditingPoi] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [popoverId, setPopoverId]   = useState(null)
  const [mobileTab, setMobileTab]   = useState('map')

  const shown = filter === 'all' ? pois : pois.filter(p => p.category === filter)
  const popoverPoi = shown.find(p => p.id === popoverId)

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

  const openCreate = () => { setEditingPoi(null); setModalMode('create') }

  /* ── Mobile layout ──────────────────────────────────────── */
  if (isMobile) {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0">
          <div>
            <h1 className="font-serif italic font-semibold text-2xl" style={{ color: 'var(--color-forest-dark)' }}>
              Mes spots
            </h1>
            {!loading && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {pois.length} spot{pois.length !== 1 ? 's' : ''} dans la base
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ background: 'var(--color-forest)' }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex px-4 pb-3 gap-2 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {[
            { id: 'map',  label: 'Carte',  icon: Map },
            { id: 'list', label: 'Liste',  icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobileTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mobileTab === id ? 'var(--color-forest)' : 'var(--color-border)',
                color: mobileTab === id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Filters (always visible) */}
        <div className="pt-3 flex-shrink-0">
          <MapFilters activeFilter={filter} onChange={setFilter} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative">
          {mobileTab === 'map' ? (
            <MapView
              pois={shown}
              selectedId={popoverId || selectedId}
              onSelect={(id) => {
                setPopoverId(id === popoverId ? null : id)
                setSelectedId(id)
              }}
            />
          ) : (
            <div className="h-full overflow-y-auto tk-scroll px-4 pb-4 flex flex-col gap-2 pt-2">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-forest)', borderTopColor: 'transparent' }} />
                </div>
              ) : shown.map(poi => (
                <div
                  key={poi.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white cursor-pointer"
                  style={{ border: `1px solid ${selectedId === poi.id ? 'var(--color-forest)' : 'var(--color-border)'}` }}
                  onClick={() => { setPopoverId(poi.id); setSelectedId(poi.id) }}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <SpotPhoto poi={poi} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORIES[poi.category]?.color || '#ccc' }} />
                      <span className="font-serif italic font-semibold text-base truncate" style={{ color: 'var(--color-forest-dark)' }}>
                        {poi.name}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {poi.address || poi.category}
                    </p>
                  </div>
                  <SpotMenu
                    poi={poi}
                    onEdit={(p) => { setEditingPoi(p); setModalMode('edit') }}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom sheet spot detail (map tab) */}
        {mobileTab === 'map' && popoverPoi && (
          <SpotBottomSheet
            poi={popoverPoi}
            onClose={() => setPopoverId(null)}
            onEdit={(p) => { setEditingPoi(p); setModalMode('edit') }}
            onDelete={handleDelete}
          />
        )}

        {/* Bottom sheet spot detail (list tab) */}
        {mobileTab === 'list' && popoverPoi && (
          <SpotBottomSheet
            poi={popoverPoi}
            onClose={() => setPopoverId(null)}
            onEdit={(p) => { setEditingPoi(p); setModalMode('edit') }}
            onDelete={handleDelete}
          />
        )}

        {/* Modal formulaire */}
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

  /* ── Desktop layout ─────────────────────────────────────── */
  return (
    <>
      <div className="flex items-end justify-between px-7 py-5 flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif italic font-semibold text-3xl" style={{ color: 'var(--color-forest-dark)' }}>
            Mes spots
          </h1>
          {!loading && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {pois.length} spot{pois.length !== 1 ? 's' : ''} dans la base
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: 'var(--color-forest)' }}
        >
          <Plus size={16} /> Ajouter un spot
        </button>
      </div>

      <MapFilters activeFilter={filter} onChange={setFilter} />

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

          <DesktopPopover
            poi={popoverPoi}
            onClose={() => setPopoverId(null)}
            onEdit={(p) => { setEditingPoi(p); setModalMode('edit') }}
            onDelete={handleDelete}
          />
        </div>

        {/* Liste */}
        <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: 'var(--color-bg)' }}>
          <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
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
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORIES[poi.category]?.color || '#ccc' }} />
                      <span className="font-serif italic font-semibold text-sm truncate" style={{ color: 'var(--color-forest-dark)' }}>
                        {poi.name}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {poi.address || poi.category}
                    </p>
                  </div>
                  <SpotMenu
                    poi={poi}
                    onEdit={(p) => { setEditingPoi(p); setModalMode('edit') }}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
