import { useState } from 'react'
import { X, Map, List } from 'lucide-react'
import MapView from '../map/MapView.jsx'
import MapFilters from '../map/MapFilters.jsx'
import { CATEGORIES } from '../../lib/constants.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'

// ── Row: spot sélectionné (sans ordre) ───────────────────────
function SpotRow({ poi, note, onNoteChange, onRemove, itineraryIndex, onItineraryToggle }) {
  const cat = CATEGORIES[poi.category]
  const inItinerary = itineraryIndex != null

  return (
    <div className="rounded-xl bg-white p-3" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat?.color || '#ccc' }} />
        <span className="flex-1 font-serif italic font-semibold text-sm truncate" style={{ color: 'var(--color-forest-dark)' }}>
          {poi.name}
        </span>
        <button
          type="button"
          onClick={onItineraryToggle}
          title={inItinerary ? "Retirer de l'itinéraire" : "Ajouter à l'itinéraire"}
          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors"
          style={{
            background: inItinerary ? 'var(--color-forest)' : 'var(--color-border)',
            color: inItinerary ? 'white' : 'var(--color-text-secondary)',
          }}
        >
          {inItinerary ? itineraryIndex + 1 : '+'}
        </button>
        <button type="button" onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-70 transition-opacity">
          <X size={13} />
        </button>
      </div>
      <textarea
        value={note || ''}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Note pour ce client…"
        rows={2}
        className="w-full mt-2.5 px-3 py-2 rounded-lg text-xs resize-none outline-none transition-all"
        style={{ border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

// ── Row: étape de l'itinéraire (avec ▲/▼) ────────────────────
function ItineraryRow({ poi, index, onMoveUp, onMoveDown, onRemove, isFirst, isLast }) {
  const cat = CATEGORIES[poi.category]
  return (
    <div className="flex items-center gap-2 py-2 px-2.5 rounded-xl bg-white" style={{ border: '1px solid var(--color-border)' }}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: 'var(--color-forest)', color: 'white' }}
      >
        {index + 1}
      </span>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color || '#ccc' }} />
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--color-forest-dark)' }}>
        {poi.name}
      </span>
      <div className="flex flex-col gap-0.5">
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          className="w-4 h-4 flex items-center justify-center rounded text-xs disabled:opacity-30"
          style={{ background: 'var(--color-border)' }}>▲</button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          className="w-4 h-4 flex items-center justify-center rounded text-xs disabled:opacity-30"
          style={{ background: 'var(--color-border)' }}>▼</button>
      </div>
      <button type="button" onClick={onRemove}
        className="w-5 h-5 flex items-center justify-center rounded-lg opacity-40 hover:opacity-70 transition-opacity">
        <X size={11} />
      </button>
    </div>
  )
}

export default function MapSelector({ pois = [], chosen, onChosenChange, notes, onNotesChange, totalPois, itinerary, onItineraryChange }) {
  const [filter, setFilter] = useState('all')
  const [mobileTab, setMobileTab] = useState('map')
  const isMobile = useIsMobile()

  const shown = filter === 'all' ? pois : pois.filter(p => p.category === filter)
  const itineraryPois = itinerary.map(id => pois.find(p => p.id === id)).filter(Boolean)

  const toggle = (id) => {
    if (chosen.includes(id)) {
      onChosenChange(chosen.filter(x => x !== id))
      onItineraryChange(itinerary.filter(x => x !== id))
    } else {
      onChosenChange([...chosen, id])
    }
  }

  const removeSpot = (id) => {
    onChosenChange(chosen.filter(x => x !== id))
    onItineraryChange(itinerary.filter(x => x !== id))
  }

  const toggleItinerary = (id) => {
    if (itinerary.includes(id)) {
      onItineraryChange(itinerary.filter(x => x !== id))
    } else {
      onItineraryChange([...itinerary, id])
    }
  }

  const moveInItinerary = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= itinerary.length) return
    const n = [...itinerary]
    ;[n[i], n[j]] = [n[j], n[i]]
    onItineraryChange(n)
  }

  const setNote = (id, val) => onNotesChange({ ...notes, [id]: val })

  // Fix Issue 6 — precompute order map pour éviter O(n²) dans le render
  const itineraryOrder = Object.fromEntries(itinerary.map((id, i) => [id, i]))

  // ── Panneau liste des spots + itinéraire ─────────────────────
  // Fix Issue 1 — renderSpotsPanel() appelé comme fonction, pas <SpotsPanel />
  // Une définition de composant inline crée une nouvelle référence à chaque render,
  // ce qui démonte/remonte le DOM et fait perdre le focus des <textarea>.
  const renderSpotsPanel = () => (
    <div className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-3">
      {/* Spots sélectionnés */}
      {chosen.length === 0 ? (
        <div className="flex items-center justify-center text-center px-4 py-10">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isMobile
              ? 'Retournez sur la carte et tapez sur les pins pour ajouter des spots.'
              : 'Cliquez sur les pins de la carte pour ajouter des spots.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {chosen.map((id) => {
            const poi = pois.find(p => p.id === id)
            if (!poi) return null
            const itineraryIndex = itineraryOrder[id] ?? null
            return (
              <SpotRow
                key={id}
                poi={poi}
                note={notes[id]}
                onNoteChange={(v) => setNote(id, v)}
                onRemove={() => removeSpot(id)}
                itineraryIndex={itineraryIndex}
                onItineraryToggle={() => toggleItinerary(id)}
              />
            )
          })}
        </div>
      )}

      {/* Section itinéraire */}
      {chosen.length > 0 && (
        <div className="mt-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Itinéraire · {itinerary.length}
            </p>
            {itinerary.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                (cliquez sur + pour ajouter des spots)
              </span>
            )}
          </div>
          <div
            className="rounded-xl p-2.5 flex flex-col gap-1.5"
            style={{
              border: '1.5px dashed var(--color-border-mid)',
              background: itinerary.length > 0 ? 'var(--color-surface)' : 'transparent',
              minHeight: 44,
            }}
          >
            {itinerary.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
                Ajoutez des spots via + pour créer un itinéraire
              </p>
            ) : itineraryPois.map((poi, i) => (
              <ItineraryRow
                key={poi.id}
                poi={poi}
                index={i}
                onMoveUp={() => moveInItinerary(i, -1)}
                onMoveDown={() => moveInItinerary(i, 1)}
                onRemove={() => toggleItinerary(poi.id)}
                isFirst={i === 0}
                isLast={i === itinerary.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  /* ── Mobile ─────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 min-h-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        {/* Tab bar */}
        <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {[
            { id: 'map',  label: 'Carte',  icon: Map },
            { id: 'list', label: `Sélectionnés (${chosen.length})`, icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobileTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-1 justify-center"
              style={{
                background: mobileTab === id ? 'var(--color-forest)' : 'var(--color-border)',
                color: mobileTab === id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {mobileTab === 'map' ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="pt-3 flex-shrink-0">
              <MapFilters activeFilter={filter} onChange={setFilter} />
            </div>
            <div className="relative flex-1 min-h-0">
              <MapView
                pois={shown}
                selectionMode
                chosenIds={chosen}
                onToggle={toggle}
                showRoute={itinerary.length >= 2}
                routePois={itineraryPois}
              />
              <div
                className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex items-baseline gap-1.5"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <span className="font-serif italic font-semibold text-xl" style={{ color: 'var(--color-forest)' }}>
                  {chosen.length}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  / {totalPois} spots
                </span>
              </div>
              <div
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex flex-col gap-1 text-xs"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#B9C4BA' }} /> non choisi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-forest)' }} /> choisi ✓
                </span>
              </div>
            </div>
          </div>
        ) : renderSpotsPanel()}
      </div>
    )
  }

  /* ── Desktop ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 min-h-0" style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Carte sélection */}
      <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <MapFilters activeFilter={filter} onChange={setFilter} />
        </div>
        <div className="relative flex-1 min-h-0">
          <MapView
            pois={shown}
            selectionMode
            chosenIds={chosen}
            onToggle={toggle}
            showRoute={itinerary.length >= 2}
            routePois={itineraryPois}
          />
          <div
            className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm flex items-baseline gap-2"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <span className="font-serif italic font-semibold text-2xl" style={{ color: 'var(--color-forest)' }}>
              {chosen.length}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              / {totalPois} spots choisis
            </span>
          </div>
          <div
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3.5 py-2 shadow-sm flex gap-4 text-xs"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#B9C4BA' }} /> non choisi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-forest)' }} /> choisi ✓
            </span>
          </div>
        </div>
      </div>

      {/* Panel spots + itinéraire */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <p className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
          Spots de la carte · {chosen.length}
        </p>
        {renderSpotsPanel()}
      </div>
    </div>
  )
}
