import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useClientMap } from '../hooks/useClientMap.js'
import MapView from '../components/map/MapView.jsx'
import PoiDrawer from '../components/poi/PoiDrawer.jsx'
import { CATEGORIES } from '../lib/constants.js'

// ── Logo feuille ─────────────────────────────────────────────
function LeafMark({ size = 22, color = 'var(--color-forest)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20 3.5 C9 3 3.2 9 3.2 16.5 C3.2 18.6 3.8 20.4 4.6 21.6 C5.8 20.4 6.6 19 7.2 17.4 C9 19 12 18.8 14.6 16.8 C19.4 13 20.6 7 20 3.5 Z" fill={color} />
      <path d="M5.4 20.6 C7.6 14 11.6 9.4 17.4 6.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ── Légende catégories ────────────────────────────────────────
function Legend({ pois }) {
  const usedCats = [...new Set(pois.map(p => p.category))]
  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3.5 shadow-sm"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
        Vos {pois.length} spots
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {usedCats.map(key => {
          const cat = CATEGORIES[key]
          if (!cat) return null
          return (
            <span key={key} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color, boxShadow: '0 0 0 2px rgba(255,255,255,0.7)' }} />
              {cat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Page 404 ──────────────────────────────────────────────────
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
          Le lien semble incorrect ou la carte a été supprimée. Vérifiez l'adresse auprès de la personne qui vous l'a partagée.
        </p>
      </div>
    </div>
  )
}

// ── Page 403 ──────────────────────────────────────────────────
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
          Cette carte a été désactivée par son auteur. Contactez Flo pour qu'elle la réactive.
        </p>
      </div>
    </div>
  )
}

// ── Bottom-sheet mobile ───────────────────────────────────────
function BottomSheet({ poi, customNote, onClose }) {
  const [expanded, setExpanded] = useState(false)

  if (!poi) return null

  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-20 transition-transform duration-400"
      style={{ transform: 'translateY(0)' }}
    >
      <div
        className="rounded-t-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-400"
        style={{
          background: 'white',
          height: expanded ? '85vh' : 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-full flex justify-center pt-3 pb-1 flex-shrink-0"
        >
          <span className="w-10 h-1.5 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </button>

        {expanded ? (
          <div className="flex-1 min-h-0">
            <PoiDrawer
              poi={poi}
              customNote={customNote}
              onClose={() => { setExpanded(false); onClose() }}
              isMobile
            />
          </div>
        ) : (
          <div className="px-5 pb-6" onClick={() => setExpanded(true)}>
            <div className="flex items-start gap-4">
              <div>
                {CATEGORIES[poi.category] && (
                  <span className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORIES[poi.category].color }} />
                    {CATEGORIES[poi.category].label}
                  </span>
                )}
                <h3
                  className="font-serif italic font-semibold text-2xl leading-tight"
                  style={{ color: 'var(--color-forest-dark)' }}
                >
                  {poi.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="ml-auto w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 mt-1"
                style={{ background: 'var(--color-border)' }}
              >
                ×
              </button>
            </div>
            {customNote && (
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: '#FBF6E3', border: '1px solid #EBDFB0', color: '#5C4A14' }}>
                <span className="font-serif italic font-semibold" style={{ color: '#8A6D1F' }}>💬 Note de Flo ·</span> {customNote}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2.5 text-sm font-semibold text-center rounded-xl text-white"
                style={{ background: 'var(--color-forest)' }}
              >
                Y aller →
              </a>
              {poi.instagram_url && (
                <a
                  href={poi.instagram_url?.startsWith('http') ? poi.instagram_url : `https://www.instagram.com/${poi.instagram_url?.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2.5 text-sm font-semibold text-center rounded-xl"
                  style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)' }}
                >
                  Insta
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function ClientMapPage() {
  const { slug } = useParams()
  const { map, pois, loading, is404, is403, error } = useClientMap(slug)
  const [selectedId, setSelectedId] = useState(null)
  const selectedPoi   = pois.find(p => p.id === selectedId)
  const selectedNote  = map?.notes?.[selectedId]

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
        className="flex items-center justify-between px-6 h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)', zIndex: 10 }}
      >
        <div className="flex items-center gap-2.5">
          <LeafMark size={22} />
          <span className="font-serif italic font-semibold text-lg" style={{ color: 'var(--color-forest-dark)' }}>
            Ti Koin Gwada
          </span>
        </div>
        {map?.client_name && (
          <span className="text-sm hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>
            Carte de {map.client_name}
          </span>
        )}
      </nav>

      {/* Map + UI */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Carte */}
        <div className="flex-1 relative min-w-0">
          <MapView
            pois={pois}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Légende */}
          {pois.length > 0 && (
            <div className="absolute top-4 left-4 z-10 max-w-[280px]">
              <Legend pois={pois} />
            </div>
          )}

          {/* Watermark */}
          <div
            className="absolute bottom-4 left-4 flex items-center gap-1.5 z-10 text-xs tracking-widest uppercase font-mono"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LeafMark size={13} color="var(--color-text-muted)" />
            Carte · Guadeloupe
          </div>

          {/* Bottom sheet mobile */}
          <div className="sm:hidden">
            <BottomSheet
              poi={selectedPoi}
              customNote={selectedNote}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>

        {/* Drawer desktop */}
        <div
          className="hidden sm:block absolute top-0 right-0 bottom-0 z-10"
          style={{
            width: 420,
            maxWidth: '92%',
            background: 'white',
            borderLeft: '1px solid var(--color-border)',
            boxShadow: '-18px 0 50px -28px rgba(26,46,32,0.4)',
            transform: selectedPoi ? 'translateX(0)' : 'translateX(102%)',
            transition: 'transform 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
          {selectedPoi && (
            <PoiDrawer
              poi={selectedPoi}
              customNote={selectedNote}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
