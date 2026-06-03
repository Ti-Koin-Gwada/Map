import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useClientMap } from '../hooks/useClientMap.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import MapView from '../components/map/MapView.jsx'
import Chip from '../components/ui/Chip.jsx'
import { CATEGORIES } from '../lib/constants.js'
import { X, MapPin, Navigation, Instagram, BookOpen, Route, Home as HomeIcon } from 'lucide-react'
import { ROUTE_COLORS } from '../lib/constants.js'

function MenuViewer({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      >
        <X size={20} color="white" />
      </button>
      <img
        src={src}
        alt="Carte du menu"
        className="max-w-full object-contain"
        style={{ padding: '48px 16px 16px', maxHeight: 'calc(100dvh - 64px)' }}
        onClick={(e) => e.stopPropagation()}
        onError={onClose}
      />
    </div>
  )
}

function LeafMark({ size = 22, color = 'var(--color-forest)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20 3.5 C9 3 3.2 9 3.2 16.5 C3.2 18.6 3.8 20.4 4.6 21.6 C5.8 20.4 6.6 19 7.2 17.4 C9 19 12 18.8 14.6 16.8 C19.4 13 20.6 7 20 3.5 Z" fill={color} />
      <path d="M5.4 20.6 C7.6 14 11.6 9.4 17.4 6.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Geocoding ────────────────────────────────────────────── */
async function geocodeAddress(address) {
  if (!window.google?.maps?.Geocoder) throw new Error('maps_not_ready')
  const geocoder = new window.google.maps.Geocoder()
  const response = await geocoder.geocode({ address, region: 'gp' })
  const result = response.results?.[0]
  if (!result) return null
  const loc = result.geometry.location
  return { lat: loc.lat(), lng: loc.lng(), address: result.formatted_address }
}

/* ── Home address modal ───────────────────────────────────── */
function HomeAddressModal({ onSave, onClose, currentAddress }) {
  const [input, setInput] = useState(currentAddress || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await geocodeAddress(input.trim())
      setLoading(false)
      if (result) {
        onSave(result)
      } else {
        setError("Adresse introuvable. Essayez d'être plus précis (ex: 12 rue de la Plage, Gosier).")
      }
    } catch (err) {
      setLoading(false)
      setError(
        err.message === 'maps_not_ready'
          ? "La carte n'est pas encore chargée. Attendez quelques secondes et réessayez."
          : "Adresse introuvable. Essayez d'être plus précis."
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#EFF6FF' }}>
              <HomeIcon size={15} color="#1D4ED8" />
            </span>
            <h2 className="font-serif italic font-semibold text-lg" style={{ color: 'var(--color-forest-dark)' }}>
              Mon domicile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--color-border)' }}
          >
            <X size={14} color="var(--color-text-secondary)" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: 12 rue de la Plage, Gosier"
            autoFocus
            className="w-full px-3 py-3 rounded-xl text-sm"
            style={{ border: '1.5px solid var(--color-border-mid)', outline: 'none', color: 'var(--color-text-primary)' }}
          />
          {error && <p className="text-xs" style={{ color: '#B91C1C' }}>{error}</p>}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: !input.trim() || loading ? '#9CA3AF' : '#1D4ED8' }}
          >
            {loading ? 'Recherche…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Home info panel desktop ──────────────────────────────── */
function HomeInfoPanel({ address, onModify, onDelete, onClose }) {
  return (
    <div
      className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 flex flex-col gap-3"
      style={{ border: '1px solid var(--color-border)', width: 260 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: '#EFF6FF' }}>
            <HomeIcon size={13} color="#1D4ED8" />
          </span>
          <span className="font-serif italic font-semibold text-sm" style={{ color: 'var(--color-forest-dark)' }}>
            Mon domicile
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: 'var(--color-border)' }}
        >
          <X size={12} color="var(--color-text-secondary)" />
        </button>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{address}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onModify}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
          style={{ border: '1.5px solid #1D4ED8', color: '#1D4ED8' }}
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
          style={{ border: '1.5px solid var(--color-border-mid)', color: '#B91C1C' }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

/* ── Home info sheet mobile ───────────────────────────────── */
function HomeInfoSheet({ address, onModify, onDelete, onClose }) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end"
      style={{ background: 'rgba(26,46,32,0.3)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-t-2xl flex flex-col gap-4 p-5"
        style={{ border: '1px solid var(--color-border)', borderBottom: 'none', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#EFF6FF' }}>
              <HomeIcon size={17} color="#1D4ED8" />
            </span>
            <span className="font-serif italic font-semibold text-base" style={{ color: 'var(--color-forest-dark)' }}>
              Mon domicile
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--color-border)' }}
          >
            <X size={15} color="var(--color-text-secondary)" />
          </button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{address}</p>
        <button
          type="button"
          onClick={onModify}
          className="w-full py-3.5 rounded-xl font-semibold text-sm"
          style={{ border: '1.5px solid #1D4ED8', color: '#1D4ED8' }}
        >
          Modifier l'adresse
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full py-2.5 rounded-xl font-semibold text-sm"
          style={{ color: '#B91C1C' }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

/* ── Itinerary panel desktop ──────────────────────────────── */
function ItineraryPanel({ itinerary, allItineraries, notes, expandedId, onExpandStep, onClose, onSelectItinerary, onOpenMenu }) {
  return (
    <div
      className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col overflow-hidden"
      style={{ border: '1px solid var(--color-border)', width: 300, maxHeight: 'calc(100vh - 100px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Route size={14} style={{ color: itinerary?.color || 'var(--color-forest)' }} />
          <span className="font-serif italic font-semibold text-base" style={{ color: 'var(--color-forest-dark)' }}>
            {itinerary?.name || 'Itinéraire'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: itinerary?.color || 'var(--color-forest)', color: 'white' }}>
            {itinerary?.pois?.length ?? 0} étapes
          </span>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer l'itinéraire"
          className="w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: 'var(--color-border)' }}>
          <X size={13} color="var(--color-text-secondary)" />
        </button>
      </div>
      {allItineraries?.length > 1 && (
        <div className="flex gap-1.5 px-3 py-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {allItineraries.map(it => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelectItinerary(it.id)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: it.id === itinerary?.id ? (it.color || 'var(--color-forest)') : 'var(--color-border)',
                color: it.id === itinerary?.id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto tk-scroll px-3 py-3 flex flex-col gap-2">
        {(itinerary?.pois ?? []).map((poi, i) => {
          const cat = CATEGORIES[poi.category]
          const customNote = notes?.[poi.id]
          const isExpanded = expandedId === poi.id
          const gmapsUrl = poi.address
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.address)}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
          const instaUrl = poi.instagram_url
            ? poi.instagram_url.startsWith('http')
              ? poi.instagram_url
              : `https://www.instagram.com/${poi.instagram_url.replace('@', '')}`
            : null
          return (
            <div
              key={poi.id}
              className="rounded-xl transition-all overflow-hidden"
              style={{
                border: `1.5px solid ${isExpanded ? cat?.color || 'var(--color-forest)' : 'var(--color-border)'}`,
                background: isExpanded ? (cat?.bgLight || 'var(--color-surface)') : 'white',
              }}
            >
              <button
                type="button"
                onClick={() => onExpandStep(isExpanded ? null : poi.id)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: itinerary?.color || 'var(--color-forest)', color: 'white' }}>{i + 1}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color || '#ccc' }} />
                  <span className="flex-1 font-serif italic font-semibold text-sm truncate"
                    style={{ color: 'var(--color-forest-dark)' }}>{poi.name}</span>
                </div>
              </button>
              {isExpanded && (
                <>
                  {poi.image_url && (
                    <div style={{ height: 100, overflow: 'hidden', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}>
                      <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="px-3 pb-3 flex flex-col gap-1.5" style={{ paddingTop: poi.image_url ? 8 : 0 }}>
                    {poi.address && (
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <MapPin size={11} /> {poi.address}
                      </p>
                    )}
                    {poi.description && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {poi.description}
                      </p>
                    )}
                    {poi.flo_reco && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-forest-dark)' }}>
                        🌿 {poi.flo_reco}
                      </p>
                    )}
                    {customNote && (
                      <p className="text-xs leading-relaxed" style={{ color: '#8A6D1F' }}>💬 {customNote}</p>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: 'var(--color-forest)' }}
                      >
                        <Navigation size={12} /> Y aller
                      </a>
                      {poi.menu_url && (
                        <button
                          type="button"
                          aria-label="Voir la carte du menu"
                          onClick={() => onOpenMenu?.(poi.menu_url)}
                          className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
                        >
                          <BookOpen size={12} />
                        </button>
                      )}
                      {instaUrl && (
                        <a
                          href={instaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
                        >
                          <Instagram size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Itinerary sheet mobile ───────────────────────────────── */
function ItinerarySheet({ itinerary, allItineraries, notes, expandedId, onExpandStep, onClose, onSelectItinerary, onOpenMenu }) {
  if (!itinerary?.pois?.length) return null
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end"
      style={{ background: 'rgba(26,46,32,0.3)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white flex flex-col overflow-hidden"
        style={{ borderRadius: '20px 20px 0 0', maxHeight: '85dvh', borderTop: '1px solid var(--color-border)' }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Route size={15} style={{ color: itinerary.color || 'var(--color-forest)' }} />
            <span className="font-serif italic font-semibold text-lg" style={{ color: 'var(--color-forest-dark)' }}>
              {itinerary.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: itinerary.color || 'var(--color-forest)', color: 'white' }}>
              {itinerary.pois.length} étapes
            </span>
            <button type="button" onClick={onClose} aria-label="Fermer l'itinéraire"
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'var(--color-border)' }}>
              <X size={15} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>
        {allItineraries?.length > 1 && (
          <div className="flex gap-1.5 px-4 py-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {allItineraries.map(it => (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelectItinerary(it.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  background: it.id === itinerary?.id ? (it.color || 'var(--color-forest)') : 'var(--color-border)',
                  color: it.id === itinerary?.id ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {it.name}
              </button>
            ))}
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-2"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {itinerary.pois.map((poi, i) => {
            const cat = CATEGORIES[poi.category]
            const customNote = notes?.[poi.id]
            const isExpanded = expandedId === poi.id
            const gmapsUrl = poi.address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.address)}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
            const instaUrl = poi.instagram_url
              ? poi.instagram_url.startsWith('http')
                ? poi.instagram_url
                : `https://www.instagram.com/${poi.instagram_url.replace('@', '')}`
              : null
            return (
              <div
                key={poi.id}
                className="rounded-xl transition-all overflow-hidden"
                style={{
                  border: `1.5px solid ${isExpanded ? cat?.color || 'var(--color-forest)' : 'var(--color-border)'}`,
                  background: isExpanded ? (cat?.bgLight || 'var(--color-surface)') : 'white',
                }}
              >
                <button
                  type="button"
                  onClick={() => onExpandStep(isExpanded ? null : poi.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: itinerary.color || 'var(--color-forest)', color: 'white' }}>{i + 1}</span>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat?.color || '#ccc' }} />
                    <span className="flex-1 font-serif italic font-semibold text-base truncate"
                      style={{ color: 'var(--color-forest-dark)' }}>{poi.name}</span>
                  </div>
                </button>
                {isExpanded && (
                  <>
                    {poi.image_url && (
                      <div style={{ height: 140, overflow: 'hidden', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}>
                        <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="px-4 pb-4 flex flex-col gap-2" style={{ paddingTop: poi.image_url ? 12 : 0 }}>
                      {poi.address && (
                        <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <MapPin size={13} /> {poi.address}
                        </p>
                      )}
                      {poi.description && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                          {poi.description}
                        </p>
                      )}
                      {poi.flo_reco && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-forest-dark)' }}>
                          🌿 {poi.flo_reco}
                        </p>
                      )}
                      {customNote && (
                        <p className="text-sm leading-relaxed" style={{ color: '#8A6D1F' }}>💬 {customNote}</p>
                      )}
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold mt-1"
                        style={{ background: 'var(--color-forest)' }}
                      >
                        <Navigation size={16} /> Y aller (Google Maps)
                      </a>
                      {poi.menu_url && (
                        <button
                          type="button"
                          onClick={() => onOpenMenu?.(poi.menu_url)}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
                          style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
                        >
                          <BookOpen size={16} />
                          Voir la carte du menu
                        </button>
                      )}
                      {instaUrl && (
                        <a
                          href={instaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
                          style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
                        >
                          <Instagram size={16} />
                          Voir sur Instagram
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Desktop panel haut-gauche ────────────────────────────── */
function InfoPanel({ pois, categories, filteredCount, selectedPoi, customNote, onClose, onOpenMenu, filterCat, onToggle }) {
  const cat = selectedPoi ? CATEGORIES[selectedPoi.category] : null
  const gmapsUrl = selectedPoi
    ? selectedPoi.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPoi.address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPoi.name + ' Guadeloupe')}`
    : null
  const instaUrl = selectedPoi?.instagram_url
    ? selectedPoi.instagram_url.startsWith('http')
      ? selectedPoi.instagram_url
      : `https://www.instagram.com/${selectedPoi.instagram_url.replace('@', '')}`
    : null

  return (
    <div
      className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        width: 300,
        maxHeight: 'calc(100vh - 100px)',
        transition: 'all 0.25s ease',
      }}
    >
      {selectedPoi ? (
        <>
          <div style={{ height: 150, flexShrink: 0, overflow: 'hidden', position: 'relative', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}>
            {selectedPoi.image_url
              ? <img src={selectedPoi.image_url} alt={selectedPoi.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" />
            }
            <button type="button" onClick={onClose}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow">
              <X size={13} color="var(--color-forest-dark)" />
            </button>
          </div>

          {/* Filter strip — accessible depuis la vue détail */}
          <div className="flex flex-wrap gap-1.5 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {categories.map(c => {
              const active = filterCat === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onToggle(c.key)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
                  style={{
                    background: active ? c.color : 'var(--color-border)',
                    color: active ? 'white' : 'var(--color-text-secondary)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? 'rgba(255,255,255,0.7)' : c.color }} />
                  {c.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-2">
            {cat && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} /> {cat.label}
              </span>
            )}
            <h3 className="font-serif italic font-semibold text-xl leading-tight" style={{ color: 'var(--color-forest-dark)' }}>
              {selectedPoi.name}
            </h3>
            {selectedPoi.address && (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <MapPin size={11} /> {selectedPoi.address}
              </p>
            )}
            {selectedPoi.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedPoi.description}
              </p>
            )}
            {(selectedPoi.access || selectedPoi.duration || selectedPoi.difficulty) && (
              <div className="rounded-xl overflow-hidden text-xs" style={{ border: '1px solid var(--color-border)' }}>
                {selectedPoi.access && (
                  <div className="flex justify-between px-3 py-2" style={{ borderBottom: (selectedPoi.duration || selectedPoi.difficulty) ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Accès</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{selectedPoi.access}</span>
                  </div>
                )}
                {selectedPoi.duration && (
                  <div className="flex justify-between px-3 py-2" style={{ borderBottom: selectedPoi.difficulty ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Durée</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{selectedPoi.duration}</span>
                  </div>
                )}
                {selectedPoi.difficulty && (
                  <div className="flex justify-between px-3 py-2">
                    <span style={{ color: 'var(--color-text-muted)' }}>Difficulté</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{selectedPoi.difficulty}</span>
                  </div>
                )}
              </div>
            )}
            {selectedPoi.flo_reco && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(45,90,61,0.06)', border: '1px solid rgba(45,90,61,0.18)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span>🌿</span>
                  <span className="font-serif italic font-semibold text-sm" style={{ color: 'var(--color-forest-dark)' }}>Reco de Flo</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{selectedPoi.flo_reco}</p>
              </div>
            )}
            {customNote && (
              <div className="rounded-xl p-3" style={{ background: '#FBF6E3', border: '1px solid #EBDFB0' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span>💬</span>
                  <span className="font-serif italic font-semibold text-sm" style={{ color: '#8A6D1F' }}>Note de Flo</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#5C4A14' }}>{customNote}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-forest)' }}>
              <Navigation size={14} /> Y aller
            </a>
            {selectedPoi.menu_url && (
              <button
                type="button"
                aria-label="Voir la carte du menu"
                onClick={() => onOpenMenu?.(selectedPoi.menu_url)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)' }}
              >
                <BookOpen size={14} />
              </button>
            )}
            {instaUrl && (
              <a href={instaUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)' }}>
                <Instagram size={14} />
              </a>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
            {filterCat ? `${filteredCount} sur ${pois.length} spots` : `Vos ${pois.length} spots`}
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => {
              const active = filterCat === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onToggle(c.key)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: active ? c.color : 'var(--color-border)',
                    color: active ? 'white' : 'var(--color-text-secondary)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? 'rgba(255,255,255,0.8)' : c.color }} />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Mobile bottom sheet ──────────────────────────────────── */
function MobileSpotSheet({ poi, customNote, onClose, onOpenMenu }) {
  if (!poi) return null
  const cat = CATEGORIES[poi.category]
  const gmapsUrl = poi.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
  const instaUrl = poi.instagram_url
    ? poi.instagram_url.startsWith('http')
      ? poi.instagram_url
      : `https://www.instagram.com/${poi.instagram_url.replace('@', '')}`
    : null

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end"
      style={{ background: 'rgba(26,46,32,0.3)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white flex flex-col overflow-hidden"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '82dvh',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </div>

        {/* Photo */}
        <div
          className="relative flex-shrink-0"
          style={{ height: 200, overflow: 'hidden', background: cat ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}08)` : '#F3F1E8' }}
        >
          {poi.image_url
            ? <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full" />
          }
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow"
          >
            <X size={16} color="var(--color-forest-dark)" />
          </button>
          {cat && (
            <div className="absolute bottom-3 left-4">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: cat.color }}
              >
                {cat.label}
              </span>
            </div>
          )}
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto tk-scroll px-5 py-4 flex flex-col gap-3">
          <h2
            className="font-serif italic font-semibold text-2xl leading-tight"
            style={{ color: 'var(--color-forest-dark)' }}
          >
            {poi.name}
          </h2>

          {poi.address && (
            <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={13} /> {poi.address}
            </p>
          )}

          {poi.description && (
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {poi.description}
            </p>
          )}

          {(poi.access || poi.duration || poi.difficulty) && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <div className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(232,237,230,0.5)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                Infos pratiques
              </div>
              {poi.access && (
                <div className="flex justify-between px-3.5 py-2.5 text-sm" style={{ borderBottom: (poi.duration || poi.difficulty) ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Accès</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{poi.access}</span>
                </div>
              )}
              {poi.duration && (
                <div className="flex justify-between px-3.5 py-2.5 text-sm" style={{ borderBottom: poi.difficulty ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Durée</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{poi.duration}</span>
                </div>
              )}
              {poi.difficulty && (
                <div className="flex justify-between px-3.5 py-2.5 text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>Difficulté</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{poi.difficulty}</span>
                </div>
              )}
            </div>
          )}

          {poi.flo_reco && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(45,90,61,0.06)', border: '1px solid rgba(45,90,61,0.18)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>🌿</span>
                <span className="font-serif italic font-semibold text-base" style={{ color: 'var(--color-forest-dark)' }}>
                  Reco de Flo
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{poi.flo_reco}</p>
            </div>
          )}
          {customNote && (
            <div className="rounded-xl p-4" style={{ background: '#FBF6E3', border: '1px solid #EBDFB0' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>💬</span>
                <span className="font-serif italic font-semibold text-base" style={{ color: '#8A6D1F' }}>
                  Note de Flo
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4A14' }}>{customNote}</p>
            </div>
          )}

        </div>

        {/* CTA fixes en bas */}
        <div
          className="px-5 pt-4 flex flex-col gap-2.5 flex-shrink-0"
          style={{
            borderTop: '1px solid var(--color-border)',
            background: 'white',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-semibold text-base"
            style={{ background: 'var(--color-forest)' }}
          >
            <Navigation size={18} />
            Y aller (Google Maps)
          </a>
          {poi.menu_url && (
            <button
              type="button"
              onClick={() => onOpenMenu?.(poi.menu_url)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
            >
              <BookOpen size={16} />
              Voir la carte du menu
            </button>
          )}
          {instaUrl && (
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
            >
              <Instagram size={16} />
              Voir sur Instagram
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Mobile filter bar ────────────────────────────────────── */
function MobileFilterBar({ categories, filterCat, onToggle }) {
  if (categories.length <= 1 && filterCat === null) return null
  return (
    <div
      className="absolute top-0 left-0 right-0 z-10 pt-2 pb-3"
      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.92) 60%, transparent 100%)' }}
    >
      <div
        className="flex gap-1.5 px-3"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none' }}
      >
        <Chip label="Tous" selected={filterCat === null} onClick={() => onToggle(null)} small />
        {categories.map(c => (
          <Chip
            key={c.key}
            label={c.label}
            color={c.color}
            selected={filterCat === c.key}
            onClick={() => onToggle(c.key)}
            small
          />
        ))}
      </div>
    </div>
  )
}

/* ── Error pages ──────────────────────────────────────────── */
function Page404() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-md">
        <div className="inline-flex mb-6"><LeafMark size={48} /></div>
        <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--color-text-muted)' }}>Erreur 404</p>
        <h1 className="font-serif italic font-semibold text-4xl leading-tight mb-4" style={{ color: 'var(--color-forest-dark)' }}>
          Cette carte n'existe pas
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Le lien semble incorrect ou la carte a été supprimée.
        </p>
      </div>
    </div>
  )
}

function Page403() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-md">
        <div className="inline-flex mb-6"><LeafMark size={48} /></div>
        <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--color-text-muted)' }}>Erreur 403</p>
        <h1 className="font-serif italic font-semibold text-4xl leading-tight mb-4" style={{ color: 'var(--color-forest-dark)' }}>
          Carte indisponible
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Cette carte a été désactivée. Contactez Flo pour qu'elle la réactive.
        </p>
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────── */
export default function ClientMapPage() {
  const { slug } = useParams()
  const { map, pois, itineraries: rawItineraries, loading, is404, is403, error } = useClientMap(slug)
  const [selectedId, setSelectedId]             = useState(null)
  const [menuSrc, setMenuSrc]                   = useState(null)
  const [filterCat, setFilterCat]               = useState(null)
  const [activeItineraryId, setActiveItineraryId] = useState(null)
  const [expandedStepId, setExpandedStepId]     = useState(null)
  const [homeData, setHomeData]                 = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`tikoin_home_${slug}`))
      if (v && typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.address === 'string') return v
      return null
    } catch { return null }
  })
  const [showHomeModal, setShowHomeModal]       = useState(false)
  const [homeOpen, setHomeOpen]                 = useState(false)
  const isMobile = useIsMobile()

  const saveHome = (data) => {
    localStorage.setItem(`tikoin_home_${slug}`, JSON.stringify(data))
    setHomeData(data)
    setShowHomeModal(false)
    setHomeOpen(false)
  }
  const deleteHome = () => {
    localStorage.removeItem(`tikoin_home_${slug}`)
    setHomeData(null)
    setHomeOpen(false)
  }

  const selectedPoi  = pois.find(p => p.id === selectedId)
  const selectedNote = map?.notes?.[selectedId]
  const filteredPois = useMemo(
    () => filterCat ? pois.filter(p => p.category === filterCat) : pois,
    [pois, filterCat]
  )
  const categories = useMemo(
    () => [...new Set(pois.map(p => p.category))]
      .map(k => ({ key: k, ...CATEGORIES[k] }))
      .filter(c => c.label),
    [pois]
  )

  const poiById = useMemo(() => Object.fromEntries(pois.map(p => [p.id, p])), [pois])
  const resolvedItineraries = useMemo(
    () => rawItineraries.map((it, idx) => ({
      ...it,
      pois: it.steps.map(id => poiById[id]).filter(Boolean),
      color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
    })),
    [rawItineraries, poiById]
  )
  const hasItinerary = resolvedItineraries.some(it => it.pois.length >= 2)
  const activeItinerary = resolvedItineraries.find(it => it.id === activeItineraryId) ?? null
  const itineraryOpen = activeItineraryId !== null

  const routes = useMemo(
    () => resolvedItineraries
      .filter(it => it.pois.length >= 2)
      .map(it => ({ pois: it.pois, color: it.color })),
    [resolvedItineraries]
  )
  const pinNumbers = useMemo(
    () => activeItinerary
      ? Object.fromEntries(activeItinerary.pois.map((p, i) => [p.id, i + 1]))
      : {},
    [activeItinerary]
  )

  const handleSelect = (id) => {
    setHomeOpen(false)
    const itinerary = resolvedItineraries.find(it => it.steps.includes(id))
    if (hasItinerary && itinerary) {
      setActiveItineraryId(itinerary.id)
      setExpandedStepId(id)
      setSelectedId(null)
      setMenuSrc(null)
    } else {
      setSelectedId(id)
      setMenuSrc(null)
      setActiveItineraryId(null)
      setExpandedStepId(null)
    }
  }

  const toggleFilter = (cat) => {
    const next = filterCat === cat ? null : cat
    setFilterCat(next)
    if (next && selectedPoi && selectedPoi.category !== next) {
      setSelectedId(null)
      setMenuSrc(null)
    }
  }

  const closeItinerary = () => {
    setActiveItineraryId(null)
    setExpandedStepId(null)
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-forest)', borderTopColor: 'transparent' }} />
    </div>
  )
  if (is404) return <Page404 />
  if (is403) return <Page403 />
  if (error)  return <Page404 />

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav
        className="flex items-center justify-between flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          padding: isMobile ? '0 16px' : '0 24px',
          height: isMobile ? 52 : 64,
        }}
      >
        <div className="flex items-center gap-2">
          <LeafMark size={isMobile ? 18 : 22} />
          <span
            className="font-serif italic font-semibold"
            style={{ color: 'var(--color-forest-dark)', fontSize: isMobile ? 16 : 18 }}
          >
            Ti Koin Gwada
          </span>
        </div>
        {map?.client_name && (
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 12 : 14 }}
          >
            {isMobile ? map.client_name : `Carte de ${map.client_name}`}
          </span>
        )}
      </nav>

      {menuSrc && <MenuViewer src={menuSrc} onClose={() => setMenuSrc(null)} />}
      {showHomeModal && (
        <HomeAddressModal
          onSave={saveHome}
          onClose={() => setShowHomeModal(false)}
          currentAddress={homeData?.address}
        />
      )}

      {/* Carte plein écran */}
      <div className="flex-1 relative min-h-0">
        <MapView
          pois={filteredPois}
          selectedId={selectedId}
          onSelect={handleSelect}
          routes={routes}
          pinNumbers={pinNumbers}
          homeMarker={homeData}
          onHomeClick={() => { setHomeOpen(true); setSelectedId(null); setActiveItineraryId(null) }}
        />

        {isMobile ? (
          <>
            {!itineraryOpen && (
              <MobileFilterBar
                categories={categories}
                filterCat={filterCat}
                onToggle={toggleFilter}
              />
            )}
            {hasItinerary && !itineraryOpen && !selectedPoi && !homeOpen && (
              <button
                type="button"
                onClick={() => setActiveItineraryId(resolvedItineraries[0]?.id)}
                className="absolute bottom-20 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold text-white"
                style={{ background: 'var(--color-forest)' }}
              >
                <Route size={14} />
                {resolvedItineraries.length > 1 ? `Itinéraires (${resolvedItineraries.length})` : 'Itinéraire'}
              </button>
            )}
            {!itineraryOpen && !selectedPoi && !homeOpen && (
              <button
                type="button"
                onClick={() => homeData ? setHomeOpen(true) : setShowHomeModal(true)}
                aria-label="Mon domicile"
                className="absolute bottom-20 left-4 z-10 w-11 h-11 flex items-center justify-center rounded-full shadow-lg"
                style={{
                  background: homeData ? '#1D4ED8' : 'white',
                  border: homeData ? 'none' : '1.5px solid var(--color-border-mid)',
                }}
              >
                <HomeIcon size={18} color={homeData ? 'white' : 'var(--color-text-secondary)'} />
              </button>
            )}
            {itineraryOpen && (
              <ItinerarySheet
                itinerary={activeItinerary}
                allItineraries={resolvedItineraries}
                notes={map?.notes}
                expandedId={expandedStepId}
                onExpandStep={setExpandedStepId}
                onClose={closeItinerary}
                onSelectItinerary={setActiveItineraryId}
                onOpenMenu={setMenuSrc}
              />
            )}
            {!itineraryOpen && selectedPoi && (
              <MobileSpotSheet
                poi={selectedPoi}
                customNote={selectedNote}
                onClose={() => setSelectedId(null)}
                onOpenMenu={setMenuSrc}
              />
            )}
            {homeOpen && homeData && (
              <HomeInfoSheet
                address={homeData.address}
                onModify={() => { setHomeOpen(false); setShowHomeModal(true) }}
                onDelete={deleteHome}
                onClose={() => setHomeOpen(false)}
              />
            )}
          </>
        ) : (
          <>
            {itineraryOpen && (
              <ItineraryPanel
                itinerary={activeItinerary}
                allItineraries={resolvedItineraries}
                notes={map?.notes}
                expandedId={expandedStepId}
                onExpandStep={setExpandedStepId}
                onClose={closeItinerary}
                onSelectItinerary={setActiveItineraryId}
                onOpenMenu={setMenuSrc}
              />
            )}
            {!itineraryOpen && pois.length > 0 && (
              <InfoPanel
                pois={pois}
                categories={categories}
                filteredCount={filteredPois.length}
                selectedPoi={selectedPoi}
                customNote={selectedNote}
                onClose={() => setSelectedId(null)}
                onOpenMenu={setMenuSrc}
                filterCat={filterCat}
                onToggle={toggleFilter}
              />
            )}
            {hasItinerary && !itineraryOpen && (
              <button
                type="button"
                onClick={() => setActiveItineraryId(resolvedItineraries[0]?.id)}
                className="absolute bottom-6 left-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold text-white"
                style={{ background: 'var(--color-forest)' }}
              >
                <Route size={14} />
                {resolvedItineraries.length > 1 ? `Itinéraires (${resolvedItineraries.length})` : 'Itinéraire'}
              </button>
            )}
            {homeOpen && homeData ? (
              <HomeInfoPanel
                address={homeData.address}
                onModify={() => { setHomeOpen(false); setShowHomeModal(true) }}
                onDelete={deleteHome}
                onClose={() => setHomeOpen(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => homeData ? setHomeOpen(true) : setShowHomeModal(true)}
                aria-label="Mon domicile"
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-md"
                style={{
                  background: homeData ? '#1D4ED8' : 'white',
                  border: homeData ? 'none' : '1.5px solid var(--color-border-mid)',
                }}
              >
                <HomeIcon size={17} color={homeData ? 'white' : 'var(--color-text-secondary)'} />
              </button>
            )}
            {/* Watermark desktop */}
            <div
              className="absolute bottom-4 left-4 flex items-center gap-1.5 z-10 text-xs tracking-widest uppercase font-mono"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <LeafMark size={13} color="var(--color-text-muted)" />
              Carte · Guadeloupe
            </div>
          </>
        )}
      </div>
    </div>
  )
}
