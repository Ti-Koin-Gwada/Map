import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useClientMap } from '../hooks/useClientMap.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import MapView from '../components/map/MapView.jsx'
import { CATEGORIES } from '../lib/constants.js'
import { X, MapPin, Navigation, Instagram, BookOpen } from 'lucide-react'

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

/* ── Desktop panel haut-gauche ────────────────────────────── */
function InfoPanel({ pois, selectedPoi, customNote, onClose, onOpenMenu }) {
  const cat = selectedPoi ? CATEGORIES[selectedPoi.category] : null
  const gmapsUrl = selectedPoi
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPoi.name + ' Guadeloupe')}`
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
            {selectedPoi.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPoi.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {tag}
                  </span>
                ))}
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
            Vos {pois.length} spots
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[...new Set(pois.map(p => p.category))].map(key => {
              const c = CATEGORIES[key]
              if (!c) return null
              return (
                <span key={key} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  {c.label}
                </span>
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
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
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

          {poi.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {poi.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {tag}
                </span>
              ))}
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

/* ── Mobile legend pill ───────────────────────────────────── */
function MobileLegend({ pois }) {
  const cats = [...new Set(pois.map(p => p.category))].map(k => CATEGORIES[k]).filter(Boolean)
  return (
    <div
      className="absolute bottom-4 left-1/2 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <LeafMark size={14} />
      <span className="text-xs font-semibold" style={{ color: 'var(--color-forest-dark)' }}>
        {pois.length} spots
      </span>
      <span className="w-px h-3 mx-0.5" style={{ background: 'var(--color-border-mid)' }} />
      <div className="flex gap-1">
        {cats.map(c => (
          <span key={c.label} className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
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
  const { map, pois, loading, is404, is403, error } = useClientMap(slug)
  const [selectedId, setSelectedId] = useState(null)
  const [menuSrc, setMenuSrc] = useState(null)
  const isMobile = useIsMobile()

  const selectedPoi  = pois.find(p => p.id === selectedId)
  const selectedNote = map?.notes?.[selectedId]

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

      {/* Carte plein écran */}
      <div className="flex-1 relative min-h-0">
        <MapView
          pois={pois}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setMenuSrc(null) }}
        />

        {isMobile ? (
          <>
            {/* Bottom sheet quand un spot est sélectionné */}
            {selectedPoi && (
              <MobileSpotSheet
                poi={selectedPoi}
                customNote={selectedNote}
                onClose={() => setSelectedId(null)}
                onOpenMenu={setMenuSrc}
              />
            )}
            {/* Pill légende quand aucun spot n'est sélectionné */}
            {!selectedPoi && pois.length > 0 && (
              <MobileLegend pois={pois} />
            )}
          </>
        ) : (
          <>
            {pois.length > 0 && (
              <InfoPanel
                pois={pois}
                selectedPoi={selectedPoi}
                customNote={selectedNote}
                onClose={() => setSelectedId(null)}
                onOpenMenu={setMenuSrc}
              />
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
