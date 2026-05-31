import { useState, useRef } from 'react'
import { MapPin, Loader } from 'lucide-react'
import { useGeocoder } from '../../hooks/useGeocoder.js'

export default function GeocoderInput({ onSelect, placeholder = 'Rechercher une adresse…' }) {
  const [value, setValue] = useState('')
  const [open, setOpen]   = useState(false)
  const { results, loading, search, clear } = useGeocoder()
  const ref = useRef(null)

  const handleChange = (e) => {
    setValue(e.target.value)
    search(e.target.value)
    setOpen(true)
  }

  const handleSelect = (feature) => {
    const [lng, lat] = feature.center
    setValue(feature.place_name)
    onSelect({ address: feature.place_name, longitude: lng, latitude: lat })
    clear()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ border: '1.5px solid var(--color-border-mid)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
        {loading && (
          <Loader size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-50 py-1"
          style={{ border: '1px solid var(--color-border)', maxHeight: 240, overflowY: 'auto' }}
        >
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(f)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[--color-bg] transition-colors flex items-start gap-2.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <MapPin size={13} className="mt-0.5 flex-shrink-0 opacity-40" />
                <span className="leading-snug">{f.place_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
