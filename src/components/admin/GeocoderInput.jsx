import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { MapPin, Loader } from 'lucide-react'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

// ── Fallback sans API Google (saisie libre) ──────────────────
function PlainInput({ onSelect, placeholder }) {
  const [value, setValue] = useState('')
  return (
    <div className="relative">
      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onSelect({ address: e.target.value, latitude: null, longitude: null })
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ border: '1.5px solid var(--color-border-mid)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

// ── Autocomplete Google Places ───────────────────────────────
function PlacesInput({ onSelect, placeholder }) {
  const placesLib = useMapsLibrary('places')
  const inputRef  = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const ac = new placesLib.Autocomplete(inputRef.current, {
      // Pas de restriction pays — Guadeloupe est une région FR
      fields: ['formatted_address', 'geometry', 'name'],
    })

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      onSelect({
        address:   place.formatted_address || place.name || '',
        latitude:  place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      })
    })

    setReady(true)
    return () => window.google.maps.event.removeListener(listener)
  }, [placesLib, onSelect])

  return (
    <div className="relative">
      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 z-10" />
      {!ready && (
        <Loader size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 animate-spin" />
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ border: '1.5px solid var(--color-border-mid)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

export default function GeocoderInput({ onSelect, placeholder = 'Rechercher une adresse…' }) {
  if (!GOOGLE_MAPS_KEY) return <PlainInput onSelect={onSelect} placeholder={placeholder} />
  return <PlacesInput onSelect={onSelect} placeholder={placeholder} />
}
