import { GripVertical, X } from 'lucide-react'
import MapView from '../map/MapView.jsx'
import MapFilters from '../map/MapFilters.jsx'
import { CATEGORIES } from '../../lib/constants.js'
import { useState } from 'react'

function SpotRow({ poi, index, note, onNoteChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div
      className="rounded-xl bg-white p-3"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="text-xs font-mono w-5 text-right flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: CATEGORIES[poi.category]?.color || '#ccc' }}
        />
        <span
          className="flex-1 font-serif italic font-semibold text-sm truncate"
          style={{ color: 'var(--color-forest-dark)' }}
        >
          {poi.name}
        </span>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-30"
            style={{ background: 'var(--color-border)' }}
          >▲</button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-30"
            style={{ background: 'var(--color-border)' }}
          >▼</button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-70 transition-opacity"
        >
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

export default function MapSelector({ pois = [], chosen, onChosenChange, notes, onNotesChange, totalPois }) {
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? pois : pois.filter(p => p.category === filter)

  const toggle = (id) => {
    onChosenChange(
      chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen, id]
    )
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= chosen.length) return
    const n = [...chosen]
    ;[n[i], n[j]] = [n[j], n[i]]
    onChosenChange(n)
  }

  const setNote = (id, val) => onNotesChange({ ...notes, [id]: val })

  return (
    <div className="flex flex-1 min-h-0" style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Carte sélection */}
      <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="px-7 pt-4 pb-2 flex-shrink-0">
          <MapFilters activeFilter={filter} onChange={setFilter} />
        </div>
        <div className="relative flex-1 min-h-0">
          <MapView
            pois={shown}
            selectionMode
            chosenIds={chosen}
            onToggle={toggle}
          />
          {/* Compteur */}
          <div
            className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm flex items-baseline gap-2"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <span
              className="font-serif italic font-semibold text-2xl"
              style={{ color: 'var(--color-forest)' }}
            >
              {chosen.length}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              / {totalPois} spots choisis
            </span>
          </div>
          {/* Légende sélection */}
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

      {/* Panel spots sélectionnés */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <p
          className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
        >
          Spots de la carte · {chosen.length}
        </p>
        <div className="flex-1 overflow-y-auto tk-scroll px-4 py-3 flex flex-col gap-2.5">
          {chosen.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center px-4 py-10">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Cliquez sur les pins de la carte pour ajouter des spots.
              </p>
            </div>
          ) : chosen.map((id, i) => {
            const poi = pois.find(p => p.id === id)
            if (!poi) return null
            return (
              <SpotRow
                key={id}
                poi={poi}
                index={i}
                note={notes[id]}
                onNoteChange={(v) => setNote(id, v)}
                onRemove={() => toggle(id)}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                isFirst={i === 0}
                isLast={i === chosen.length - 1}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
