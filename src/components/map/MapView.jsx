import { useRef, useState, useLayoutEffect } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import { MAP_STYLE, MAP_CENTER, MAP_ZOOM, CATEGORIES } from '../../lib/constants.js'
import GuadeloupeSVG, { VB } from './GuadeloupeSVG.jsx'
import MarkerPin from './MarkerPin.jsx'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// ── SVG Map Canvas (sans token Mapbox) ──────────────────────
function SVGMapCanvas({ pois = [], selectedId, onSelect, selectionMode, chosenIds, onToggle }) {
  const ref = useRef(null)
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

  // POI coords are real GPS; we need to map them to the SVG viewBox.
  // The SVG represents Guadeloupe at roughly:
  //   lng [-61.85, -61.0] → x [330, 1160]  (Basse+Grande Terre)
  //   lat [15.83, 16.52]  → y [746, 208]   (south → north = top)
  const LNG_MIN = -61.85, LNG_MAX = -61.0
  const LAT_MIN = 15.83,  LAT_MAX = 16.52
  const SVG_X_MIN = 330, SVG_X_MAX = 1160
  const SVG_Y_MIN = 208, SVG_Y_MAX = 746

  const project = (lng, lat) => {
    const vx = SVG_X_MIN + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (SVG_X_MAX - SVG_X_MIN)
    const vy = SVG_Y_MAX - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (SVG_Y_MAX - SVG_Y_MIN)
    return {
      left: offX + vx * scale,
      top:  offY + vy * scale,
    }
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: '#D4EBF0' }}>
      <GuadeloupeSVG />
      {!MAPBOX_TOKEN && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium z-10 whitespace-nowrap">
          Mode aperçu — configurez VITE_MAPBOX_TOKEN pour la carte réelle
        </div>
      )}
      {scale > 0 && pois.map(poi => {
        if (!poi.latitude || !poi.longitude) return null
        const p = project(poi.longitude, poi.latitude)
        const cat = CATEGORIES[poi.category]
        const isSelected = selectedId === poi.id
        const isChosen = chosenIds?.includes(poi.id)
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

// ── Mapbox Map ───────────────────────────────────────────────
function MapboxMap({ pois = [], selectedId, onSelect, selectionMode, chosenIds, onToggle }) {
  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: MAP_CENTER[0], latitude: MAP_CENTER[1], zoom: MAP_ZOOM }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
    >
      <NavigationControl position="bottom-right" />
      {pois.map(poi => {
        if (!poi.latitude || !poi.longitude) return null
        const cat = CATEGORIES[poi.category]
        const isSelected = selectedId === poi.id
        const isChosen = chosenIds?.includes(poi.id)
        return (
          <Marker
            key={poi.id}
            longitude={poi.longitude}
            latitude={poi.latitude}
            anchor="bottom"
          >
            <MarkerPin
              color={cat?.color || '#2D5A3D'}
              selected={isSelected || isChosen}
              dimmed={selectionMode ? false : (selectedId && !isSelected)}
              faded={selectionMode && !isChosen}
              check={isChosen}
              title={poi.name}
              onClick={() => selectionMode ? onToggle?.(poi.id) : onSelect?.(poi.id)}
            />
          </Marker>
        )
      })}
    </Map>
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
      {MAPBOX_TOKEN
        ? <MapboxMap {...props} />
        : <SVGMapCanvas {...props} />
      }
    </div>
  )
}
