import { useState, useCallback, useRef } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const BBOX = '-62.0,15.6,-60.9,16.6' // Guadeloupe bounding box

export function useGeocoder() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const search = useCallback((query) => {
    clearTimeout(debounceRef.current)
    if (!query.trim() || !MAPBOX_TOKEN) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?bbox=${BBOX}&language=fr&limit=5&access_token=${MAPBOX_TOKEN}`
        const res = await fetch(url)
        const json = await res.json()
        setResults(json.features ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const clear = useCallback(() => setResults([]), [])

  return { results, loading, search, clear }
}
