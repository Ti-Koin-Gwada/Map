import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { MAP_CENTER, MAP_ZOOM, CATEGORIES } from '../../lib/constants.js'
import GuadeloupeSVG, { VB } from './GuadeloupeSVG.jsx'
import MarkerPin from './MarkerPin.jsx'
import { useRef, useState, useLayoutEffect } from 'react'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

// Style sobre (masque les POI Google) — appliqué uniquement en mode roadmap/terrain
const MAP_STYLES = [
  { featureType: 'poi',          elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', elementType: 'all',    stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',      elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

const MAP_TYPES = [
  { id: 'terrain',   label: 'Terrain'   },
  { id: 'roadmap',   label: 'Route'     },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid',    label: 'Hybride'   },
]

function MapTypeSelector({ value, onChange }) {
  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex rounded-xl overflow-hidden shadow-md"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {MAP_TYPES.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="px-3.5 py-2 text-xs font-semibold transition-all duration-150"
          style={{
            background:  value === t.id ? 'var(--color-forest)' : 'rgba(255,255,255,0.92)',
            color:       value === t.id ? '#fff' : 'var(--color-text-primary)',
            backdropFilter: 'blur(8px)',
            borderRight: i < MAP_TYPES.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Google Maps ──────────────────────────────────────────────
function GoogleMapView({ pois, selectedId, onSelect, selectionMode, chosenIds, onToggle }) {
  const [mapType, setMapType] = useState('terrain')
  const isSatellite = mapType === 'satellite' || mapType === 'hybrid'

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <Map
        defaultCenter={MAP_CENTER}
        defaultZoom={MAP_ZOOM}
        mapTypeId={mapType}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        styles={isSatellite ? [] : MAP_STYLES}
        style={{ width: '100%', height: '100%' }}
      >
        {pois.map(poi => {
          if (!poi.latitude || !poi.longitude) return null
          const cat      = CATEGORIES[poi.category]
          const isSelected = selectedId === poi.id
          const isChosen   = chosenIds?.includes(poi.id)

          return (
            <AdvancedMarker
              key={poi.id}
              position={{ lat: poi.latitude, lng: poi.longitude }}
            >
              <MarkerPin
                color={cat?.color || '#2D5A3D'}
                selected={isSelected || isChosen}
                dimmed={selectionMode ? false : (selectedId && !isSelected)}
                faded={selectionMode && !isChosen}
                check={isChosen}
                title={poi.name}
                onClick={() => selectionMode ? onToggle?.(poi.id) : onSelect?.(poi.id)}
                style={{ position: 'relative', transform: 'translate(-50%, -100%)' }}
              />
            </AdvancedMarker>
          )
        })}
      </Map>
      <MapTypeSelector value={mapType} onChange={setMapType} />
    </APIProvider>
  )
}

// ── SVG Map fallback (sans clé API) ─────────────────────────
function SVGMapCanvas({ pois, selectedId, onSelect, selectionMode, chosenIds, onToggle }) {
  const ref  = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const scale = box.w && box.h ? Math.min(box.w / VB.w, box.h / VB.h) : 0
  const offX  = (box.w - VB.w * scale) / 2
  const offY  = (box.h - VB.h * scale) / 2

  const LNG_MIN = -61.85, LNG_MAX = -61.0
  const LAT_MIN = 15.83,  LAT_MAX = 16.52
  const SVG_X_MIN = 330,  SVG_X_MAX = 1160
  const SVG_Y_MIN = 208,  SVG_Y_MAX = 746

  const project = (lng, lat) => ({
    left: offX + (SVG_X_MIN + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (SVG_X_MAX - SVG_X_MIN)) * scale,
    top:  offY + (SVG_Y_MAX - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (SVG_Y_MAX - SVG_Y_MIN)) * scale,
  })

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: '#D4EBF0' }}>
      <GuadeloupeSVG />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium z-10 whitespace-nowrap">
        Mode aperçu — ajoutez VITE_GOOGLE_MAPS_KEY pour la carte réelle
      </div>
      {scale > 0 && pois.map(poi => {
        if (!poi.latitude || !poi.longitude) return null
        const p        = project(poi.longitude, poi.latitude)
        const cat      = CATEGORIES[poi.category]
        const isSelected = selectedId === poi.id
        const isChosen   = chosenIds?.includes(poi.id)
        return (
          <MarkerPin
            key={poi.id}
            color={cat?.color || '#2D5A3D'}
            selected={isSelected || isChosen}
            dimmed={selectionMode ? false : (selectedId && !isSelected)}
            faded={selectionMode && !isChosen}
            check={isChosen}
            style={{ position: 'absolute', left: p.left, top: p.top }}
            title={poi.name}
            onClick={() => selectionMode ? onToggle?.(poi.id) : onSelect?.(poi.id)}
          />
        )
      })}
    </div>
  )
}

// ── MapView (auto-switch) ────────────────────────────────────
export default function MapView({
  pois = [],
  selectedId,
  onSelect,
  selectionMode = false,
  chosenIds,
  onToggle,
  className = '',
}) {
  const props = { pois, selectedId, onSelect, selectionMode, chosenIds, onToggle }
  return (
    <div className={`relative w-full h-full ${className}`}>
      {GOOGLE_MAPS_KEY
        ? <GoogleMapView {...props} />
        : <SVGMapCanvas  {...props} />
      }
    </div>
  )
}
