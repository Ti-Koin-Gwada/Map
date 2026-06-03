import { Map, useMap } from '@vis.gl/react-google-maps'
import { MAP_CENTER, MAP_ZOOM, CATEGORIES } from '../../lib/constants.js'
import GuadeloupeSVG, { VB } from './GuadeloupeSVG.jsx'
import MarkerPin from './MarkerPin.jsx'
import HtmlMarker from './HtmlMarker.jsx'
import { useRef, useState, useLayoutEffect, useEffect } from 'react'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

const MAP_STYLES_CLEAN = [
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

// ── Route polyline (Google Maps) ─────────────────────────────
function RoutePolyline({ pois, color = '#2D5A3D', dashed = false }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !window.google?.maps) return
    const path = pois
      .filter(p => p.latitude && p.longitude)
      .map(p => ({ lat: p.latitude, lng: p.longitude }))
    if (path.length < 2) return

    const line = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: dashed ? 0 : 0.75,
      strokeWeight: 3,
      icons: dashed ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.75, scale: 3 }, offset: '0', repeat: '10px' }] : [],
      map,
    })
    return () => line.setMap(null)
  }, [map, pois, color, dashed])

  return null
}

// ── Google Maps ──────────────────────────────────────────────
function GoogleMapView({ pois, selectedId, onSelect, selectionMode, chosenIds, onToggle, routes, pinNumbers }) {
  const [mapType, setMapType] = useState('terrain')
  const isSatellite = mapType === 'satellite' || mapType === 'hybrid'

  return (
    <div className="relative w-full h-full">
      <Map
        defaultCenter={MAP_CENTER}
        defaultZoom={MAP_ZOOM}
        mapTypeId={mapType}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        styles={isSatellite ? [] : MAP_STYLES_CLEAN}
        style={{ width: '100%', height: '100%' }}
      >
        {routes.map((route, i) =>
          route.pois.length > 1 && (
            <RoutePolyline
              key={i}
              pois={route.pois}
              color={route.color}
              dashed={route.dashed}
            />
          )
        )}
        {pois.map(poi => {
          if (!poi.latitude || !poi.longitude) return null
          const cat        = CATEGORIES[poi.category]
          const isSelected = selectedId === poi.id
          const isChosen   = chosenIds?.includes(poi.id)
          const routeNum   = pinNumbers?.[poi.id]
          return (
            <HtmlMarker
              key={poi.id}
              position={{ lat: poi.latitude, lng: poi.longitude }}
            >
              <MarkerPin
                color={cat?.color || '#2D5A3D'}
                selected={isSelected || isChosen}
                dimmed={selectionMode ? false : (selectedId && !isSelected)}
                faded={selectionMode && !isChosen}
                check={!routeNum && isChosen}
                number={routeNum}
                title={poi.name}
                onClick={() => selectionMode ? onToggle?.(poi.id) : onSelect?.(poi.id)}
                style={{ position: 'relative', transform: 'translate(-50%, -100%)' }}
              />
            </HtmlMarker>
          )
        })}
      </Map>
      <MapTypeSelector value={mapType} onChange={setMapType} />
    </div>
  )
}

// ── SVG Map fallback ─────────────────────────────────────────
function SVGMapCanvas({ pois, selectedId, onSelect, selectionMode, chosenIds, onToggle, routes, pinNumbers }) {
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
      {scale > 0 && routes.map((route, i) =>
        route.pois.length > 1 && (
          <svg key={i} className="absolute inset-0 pointer-events-none" width={box.w} height={box.h}>
            <polyline
              points={route.pois
                .filter(p => p.latitude && p.longitude)
                .map(p => { const pos = project(p.longitude, p.latitude); return `${pos.left},${pos.top}` })
                .join(' ')}
              fill="none"
              stroke={route.color || '#2D5A3D'}
              strokeWidth="2.5"
              strokeOpacity="0.75"
              strokeDasharray={route.dashed ? '6,4' : undefined}
            />
          </svg>
        )
      )}
      {scale > 0 && pois.map(poi => {
        if (!poi.latitude || !poi.longitude) return null
        const p          = project(poi.longitude, poi.latitude)
        const cat        = CATEGORIES[poi.category]
        const isSelected = selectedId === poi.id
        const isChosen   = chosenIds?.includes(poi.id)
        const routeNum   = pinNumbers?.[poi.id]
        return (
          <MarkerPin
            key={poi.id}
            color={cat?.color || '#2D5A3D'}
            selected={isSelected || isChosen}
            dimmed={selectionMode ? false : (selectedId && !isSelected)}
            faded={selectionMode && !isChosen}
            check={!routeNum && isChosen}
            number={routeNum}
            style={{ position: 'absolute', left: p.left, top: p.top }}
            title={poi.name}
            onClick={() => selectionMode ? onToggle?.(poi.id) : onSelect?.(poi.id)}
          />
        )
      })}
    </div>
  )
}

export default function MapView({
  pois = [], selectedId, onSelect,
  selectionMode = false, chosenIds, onToggle,
  routes = [],
  pinNumbers = {},
  className = '',
}) {
  const props = { pois, selectedId, onSelect, selectionMode, chosenIds, onToggle, routes, pinNumbers }
  return (
    <div className={`relative w-full h-full ${className}`}>
      {GOOGLE_MAPS_KEY ? <GoogleMapView {...props} /> : <SVGMapCanvas {...props} />}
    </div>
  )
}
