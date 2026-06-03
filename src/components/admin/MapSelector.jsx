import { useState } from 'react'
import { X, Map, List, Route, Check } from 'lucide-react'
import MapView from '../map/MapView.jsx'
import MapFilters from '../map/MapFilters.jsx'
import { CATEGORIES, ROUTE_COLORS } from '../../lib/constants.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'

// ── Row: spot sélectionné (sans ordre) ───────────────────────
function SpotRow({ poi, note, onNoteChange, onRemove }) {
  const cat = CATEGORIES[poi.category]

  return (
    <div className="rounded-xl bg-white p-3" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat?.color || '#ccc' }} />
        <span className="flex-1 font-serif italic font-semibold text-sm truncate" style={{ color: 'var(--color-forest-dark)' }}>
          {poi.name}
        </span>
        <button type="button" onClick={onRemove} aria-label={`Retirer ${poi.name}`}
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
function ItineraryRow({ poi, index, onMoveUp, onMoveDown, onRemove, isFirst, isLast, color }) {
  const cat = CATEGORIES[poi.category]
  return (
    <div className="flex items-center gap-2 py-2 px-2.5 rounded-xl bg-white" style={{ border: '1px solid var(--color-border)' }}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: color || 'var(--color-forest)', color: 'white' }}
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

export default function MapSelector({ pois = [], chosen, onChosenChange, notes, onNotesChange, itineraries, onItinerariesChange, totalPois }) {
  const [filter, setFilter] = useState('all')
  const [mobileTab, setMobileTab] = useState('map')
  const [buildingItinerary, setBuildingItinerary] = useState(false)
  const [draftSteps, setDraftSteps] = useState([])
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [draftName, setDraftName] = useState('')
  const isMobile = useIsMobile()

  const shown = filter === 'all' ? pois : pois.filter(p => p.category === filter)

  // ── Handlers ──────────────────────────────────────────────
  const toggle = (id) => {
    if (buildingItinerary) {
      // Building mode: only update local draftSteps — no external state update.
      // Avoids the two-simultaneous-updater pattern that crashes Google Maps OverlayView.
      // Chosen is updated atomically when the itinerary is confirmed.
      setDraftSteps(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    } else {
      if (chosen.includes(id)) {
        onChosenChange(chosen.filter(x => x !== id))
        // Mirror removeSpot: keep itineraries consistent when a spot is deselected via pin click.
        // Both are external updates → React 18 batches them into one render (no OverlayView crash).
        const cleaned = itineraries
          .map(it => ({ ...it, steps: it.steps.filter(s => s !== id) }))
          .filter(it => it.steps.length > 0)
        if (cleaned.length !== itineraries.length ||
            cleaned.some((it, i) => it.steps.length !== itineraries[i]?.steps.length)) {
          onItinerariesChange(cleaned)
        }
      } else {
        onChosenChange([...chosen, id])
      }
    }
  }

  const removeSpot = (id) => {
    onChosenChange(chosen.filter(x => x !== id))
    setDraftSteps(prev => prev.filter(x => x !== id))
    // Also clean from confirmed itineraries, remove empty ones
    onItinerariesChange(
      itineraries
        .map(it => ({ ...it, steps: it.steps.filter(s => s !== id) }))
        .filter(it => it.steps.length > 0)
    )
  }

  const moveDraftStep = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= draftSteps.length) return
    const n = [...draftSteps]
    ;[n[i], n[j]] = [n[j], n[i]]
    setDraftSteps(n)
  }

  const startItinerary = () => {
    setBuildingItinerary(true)
    setDraftSteps([])
    setShowNamePrompt(false)
    setDraftName('')
  }

  const cancelItinerary = () => {
    setBuildingItinerary(false)
    setDraftSteps([])
    setShowNamePrompt(false)
    setDraftName('')
  }

  const requestConfirm = () => {
    if (draftSteps.length < 2) return
    setShowNamePrompt(true)
  }

  const confirmItinerary = () => {
    if (draftSteps.length < 2) return
    const name = draftName.trim() || `Itinéraire ${itineraries.length + 1}`
    onItinerariesChange([...itineraries, { name, steps: draftSteps }])
    // Add any draft spots not yet in chosen (atomic: single external update after confirmation)
    const newSpots = draftSteps.filter(id => !chosen.includes(id))
    if (newSpots.length > 0) onChosenChange([...chosen, ...newSpots])
    cancelItinerary()
  }

  const removeItinerary = (i) => {
    onItinerariesChange(itineraries.filter((_, idx) => idx !== i))
  }

  const moveItineraryStep = (itinIdx, stepIdx, dir) => {
    const it = itineraries[itinIdx]
    const j = stepIdx + dir
    if (j < 0 || j >= it.steps.length) return
    const steps = [...it.steps]
    ;[steps[stepIdx], steps[j]] = [steps[j], steps[stepIdx]]
    const updated = [...itineraries]
    updated[itinIdx] = { ...it, steps }
    onItinerariesChange(updated)
  }

  const setNote = (id, val) => onNotesChange({ ...notes, [id]: val })

  // ── Pins numérotés pour le brouillon + ids effectifs pour l'affichage ──
  const draftPinNumbers = buildingItinerary
    ? Object.fromEntries(draftSteps.map((id, i) => [id, i + 1]))
    : {}
  // Include draft steps in the "chosen" set for display (non-faded, numbered)
  const effectiveChosenIds = buildingItinerary && draftSteps.length > 0
    ? [...new Set([...chosen, ...draftSteps])]
    : chosen

  // ── Routes pour la carte (preview) ────────────────────────
  const routes = [
    ...itineraries.map((it, i) => ({
      pois: it.steps.map(id => pois.find(p => p.id === id)).filter(Boolean),
      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
    })),
    ...(draftSteps.length >= 2 ? [{
      pois: draftSteps.map(id => pois.find(p => p.id === id)).filter(Boolean),
      color: '#B45309',
      dashed: true,
    }] : []),
  ]

  // ── Panneau liste ──────────────────────────────────────────
  const renderSpotsPanel = () => (
    <div className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-3">
      {/* Mode construction itinéraire */}
      {buildingItinerary && (
        <div
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B' }}
        >
          <div className="flex items-center gap-2">
            <Route size={14} color="#B45309" />
            <span className="text-xs font-semibold" style={{ color: '#92400E' }}>
              Mode itinéraire — {draftSteps.length} étape{draftSteps.length !== 1 ? 's' : ''} sélectionnée{draftSteps.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#92400E' }}>
            Cliquez les spots sur la carte dans l'ordre souhaité.
          </p>
          {draftSteps.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {draftSteps.map((id, i) => {
                const poi = pois.find(p => p.id === id)
                if (!poi) return null
                return (
                  <ItineraryRow
                    key={id}
                    poi={poi}
                    index={i}
                    color="#B45309"
                    onMoveUp={() => moveDraftStep(i, -1)}
                    onMoveDown={() => moveDraftStep(i, 1)}
                    onRemove={() => setDraftSteps(prev => prev.filter(x => x !== id))}
                    isFirst={i === 0}
                    isLast={i === draftSteps.length - 1}
                  />
                )
              })}
            </div>
          )}
          {showNamePrompt ? (
            <div className="flex gap-2 mt-1">
              <input
                autoFocus
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmItinerary()}
                placeholder={`Itinéraire ${itineraries.length + 1}`}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                style={{ border: '1.5px solid #F59E0B', background: 'white' }}
              />
              <button
                type="button"
                onClick={confirmItinerary}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                style={{ background: '#B45309' }}
              >
                <Check size={12} /> Valider
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={requestConfirm}
                disabled={draftSteps.length < 2}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: '#B45309' }}
              >
                Terminer ({draftSteps.length} étapes)
              </button>
              <button
                type="button"
                onClick={cancelItinerary}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}

      {/* Itinéraires confirmés */}
      {itineraries.length > 0 && !buildingItinerary && (
        <div className="flex flex-col gap-2">
          {itineraries.map((it, itinIdx) => {
            const color = ROUTE_COLORS[itinIdx % ROUTE_COLORS.length]
            const itinPois = it.steps.map(id => pois.find(p => p.id === id)).filter(Boolean)
            return (
              <div
                key={itinIdx}
                className="rounded-xl p-2.5 flex flex-col gap-1.5"
                style={{ border: `1.5px solid ${color}`, background: 'var(--color-surface)' }}
              >
                <div className="flex items-center gap-2">
                  <Route size={13} color={color} />
                  <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--color-forest-dark)' }}>
                    {it.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                    style={{ background: color }}>
                    {it.steps.length} étapes
                  </span>
                  <button type="button" onClick={() => removeItinerary(itinIdx)}
                    className="w-5 h-5 flex items-center justify-center rounded opacity-40 hover:opacity-70">
                    <X size={11} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {itinPois.map((poi, stepIdx) => (
                    <ItineraryRow
                      key={poi.id}
                      poi={poi}
                      index={stepIdx}
                      color={color}
                      onMoveUp={() => moveItineraryStep(itinIdx, stepIdx, -1)}
                      onMoveDown={() => moveItineraryStep(itinIdx, stepIdx, 1)}
                      onRemove={() => {
                        const updated = [...itineraries]
                        updated[itinIdx] = { ...it, steps: it.steps.filter(id => id !== poi.id) }
                        if (updated[itinIdx].steps.length === 0) updated.splice(itinIdx, 1)
                        onItinerariesChange(updated)
                      }}
                      isFirst={stepIdx === 0}
                      isLast={stepIdx === itinPois.length - 1}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
            return (
              <SpotRow
                key={id}
                poi={poi}
                note={notes[id]}
                onNoteChange={(v) => setNote(id, v)}
                onRemove={() => removeSpot(id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )

  const itineraryButton = buildingItinerary ? null : (
    <button
      type="button"
      onClick={startItinerary}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
    >
      <Route size={13} /> Créer un itinéraire
    </button>
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
                chosenIds={effectiveChosenIds}
                onToggle={toggle}
                routes={routes}
                pinNumbers={draftPinNumbers}
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
              {buildingItinerary && (
                <div
                  className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold"
                  style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E' }}
                >
                  <Route size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Mode itinéraire
                </div>
              )}
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
            chosenIds={effectiveChosenIds}
            onToggle={toggle}
            routes={routes}
            pinNumbers={draftPinNumbers}
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
          {buildingItinerary && (
            <div
              className="absolute top-4 right-4 z-10 rounded-xl px-4 py-2.5 shadow-sm text-sm font-semibold flex items-center gap-2"
              style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E' }}
            >
              <Route size={14} /> Mode itinéraire actif
            </div>
          )}
        </div>
      </div>

      {/* Panel spots + itinéraires */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}>
            Spots · {chosen.length}
          </p>
          {itineraryButton}
        </div>
        {renderSpotsPanel()}
      </div>
    </div>
  )
}
