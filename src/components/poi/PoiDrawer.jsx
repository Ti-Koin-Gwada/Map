import { X, MapPin, Navigation, Instagram } from 'lucide-react'
import { CATEGORIES } from '../../lib/constants.js'
import { CategoryBadge } from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

function SpotPhoto({ poi, height = 220 }) {
  const cat = CATEGORIES[poi.category]
  if (poi.image_url) {
    return (
      <div style={{ height, overflow: 'hidden' }}>
        <img src={poi.image_url} alt={poi.name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      style={{
        height,
        overflow: 'hidden',
        background: cat
          ? `repeating-linear-gradient(135deg, ${cat.color}0e 0 10px, ${cat.color}05 10px 20px), linear-gradient(180deg,#F3F1E8,#ECEFE6)`
          : '#F3F1E8',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {cat && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 80% 0%, ${cat.color}10, transparent 60%)` }} />
      )}
      <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
        photo · {poi.address?.split(',').pop()?.trim() || poi.name}
      </span>
    </div>
  )
}

function InfoRow({ label, value, last }) {
  if (!value || value === '—') return null
  return (
    <div
      className="flex justify-between gap-4 px-3.5 py-2.5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-border)' }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-sm text-right" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

export default function PoiDrawer({ poi, customNote, onClose, isMobile }) {
  if (!poi) return null

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Guadeloupe')}`
  const instaUrl = poi.instagram_url?.startsWith('http') ? poi.instagram_url : `https://www.instagram.com/${poi.instagram_url?.replace('@', '')}`

  return (
    <div className="flex flex-col h-full">
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 tk-scroll">
        <div className="relative">
          <SpotPhoto poi={poi} height={isMobile ? 180 : 240} />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow transition-all hover:bg-white"
            >
              <X size={15} color="var(--color-forest-dark)" />
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          <CategoryBadge category={poi.category} />

          <h2
            className="font-serif italic font-semibold leading-tight mt-3 mb-1"
            style={{ fontSize: isMobile ? 26 : 32, color: 'var(--color-forest-dark)', letterSpacing: '-0.01em' }}
          >
            {poi.name}
          </h2>

          {poi.address && (
            <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={12} />
              {poi.address}
            </p>
          )}

          {poi.description && (
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {poi.description}
            </p>
          )}

          {/* Infos pratiques */}
          {(poi.details || poi.access || poi.duration || poi.difficulty) && (
            <div
              className="mt-5 rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(232,237,230,0.4)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                Infos pratiques
              </div>
              <InfoRow label="Accès"       value={poi.access} />
              <InfoRow label="Durée"       value={poi.duration} />
              <InfoRow label="Difficulté"  value={poi.difficulty} last />
            </div>
          )}

          {/* Note de Flo */}
          {customNote && (
            <div
              className="mt-5 rounded-xl p-4"
              style={{ background: '#FBF6E3', border: '1px solid #EBDFB0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💬</span>
                <span
                  className="font-serif italic font-semibold text-base"
                  style={{ color: '#8A6D1F' }}
                >
                  Note de Flo
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4A14' }}>
                {customNote}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* CTA fixes */}
      <div
        className="px-6 pb-5 pt-4 flex flex-col gap-2.5"
        style={{ borderTop: '1px solid var(--color-border)', background: 'white' }}
      >
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-base transition-colors"
          style={{ background: 'var(--color-forest)', ':hover': { background: 'var(--color-forest-dark)' } }}
        >
          <Navigation size={16} />
          Y aller (Google Maps)
        </a>
        {poi.instagram_url && (
          <a
            href={instaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'white' }}
          >
            <Instagram size={15} />
            Voir sur Instagram
          </a>
        )}
      </div>
    </div>
  )
}
