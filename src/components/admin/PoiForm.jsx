import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, Crosshair, Hand } from 'lucide-react'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { CATEGORIES, TAG_OPTIONS, MAP_CENTER, MAP_ZOOM } from '../../lib/constants.js'
import GeocoderInput from './GeocoderInput.jsx'
import HtmlMarker from '../map/HtmlMarker.jsx'
import Button from '../ui/Button.jsx'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

const GEO_TABS = [
  { id: 'address', label: 'Adresse',      icon: MapPin },
  { id: 'gps',     label: 'GPS',          icon: Crosshair },
  { id: 'manual',  label: 'Sur la carte', icon: Hand },
]

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-forest-dark)' }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...props }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}
      {...props}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}
    />
  )
}

// Capture l'instance de la carte pour lire son centre
function MapCenterRef({ mapRef }) {
  mapRef.current = useMap()
  return null
}

// ── Carte avec pin central flottant ─────────────────────────
function MapPicker({ latitude, longitude, onChange }) {
  const [placing, setPlacing] = useState(false)
  const mapRef = useRef(null)

  const handleConfirm = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    onChange(center.lat(), center.lng())
    setPlacing(false)
  }, [onChange])

  const handleCancel = useCallback(() => setPlacing(false), [])

  useEffect(() => {
    if (!placing) return
    const onKey = (e) => { if (e.key === 'Escape') setPlacing(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placing])

  const hasPin = latitude != null && longitude != null

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="rounded-xl p-4 text-sm text-center" style={{ background: 'var(--color-bg)', border: '1.5px dashed var(--color-border-mid)', color: 'var(--color-text-muted)' }}>
        Configurez VITE_GOOGLE_MAPS_KEY pour activer le placement sur la carte
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Zone carte */}
      <div className="relative rounded-xl overflow-hidden" style={{
        height: 300,
        border: placing ? '2px solid #2D5A3D' : '1.5px solid var(--color-border-mid)',
        transition: 'border-color 0.15s',
      }}>
        <Map
          defaultCenter={hasPin ? { lat: latitude, lng: longitude } : MAP_CENTER}
          defaultZoom={hasPin ? 13 : MAP_ZOOM}
          mapTypeId="terrain"
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          style={{ width: '100%', height: '100%' }}
        >
          <MapCenterRef mapRef={mapRef} />
          {/* Pin existant (hors mode placement) */}
          {hasPin && !placing && (
            <HtmlMarker position={{ lat: latitude, lng: longitude }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50% 50% 50% 0',
                background: '#2D5A3D', border: '2px solid white',
                transform: 'translate(-50%, -100%) rotate(-45deg)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }} />
            </HtmlMarker>
          )}
        </Map>

        {/* Pin central flottant (mode placement) */}
        {placing && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10 }}
          >
            {/* Ombre au sol */}
            <div style={{
              position: 'absolute',
              width: 12, height: 6,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.25)',
              transform: 'translateY(14px)',
            }} />
            {/* Pin */}
            <svg width="32" height="40" viewBox="0 0 32 40" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))', transform: 'translateY(-4px)' }}>
              <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z" fill="#2D5A3D"/>
              <circle cx="16" cy="12" r="5" fill="white"/>
            </svg>
          </div>
        )}

        {/* Bandeau instruction (mode placement) */}
        {placing && (
          <div className="pointer-events-none absolute top-2 left-0 right-0 flex justify-center" style={{ zIndex: 11 }}>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full shadow-md" style={{ background: '#2D5A3D', color: 'white' }}>
              Déplace la carte sous le pin
            </span>
          </div>
        )}
      </div>

      {/* Boutons */}
      {placing ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#2D5A3D' }}
          >
            Valider cette position
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlacing(true)}
          className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          {hasPin ? '✏️ Repositionner' : '📍 Placer le spot'}
        </button>
      )}

      {hasPin && !placing && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  )
}

const INITIAL = {
  name: '', category: '', description: '', details: '',
  access: '', duration: '', difficulty: '',
  address: '', latitude: '', longitude: '',
  instagram_url: '', image_url: '', tags: [], is_active: true,
}

export default function PoiForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ? { ...INITIAL, ...initial } : INITIAL)
  const [geoTab, setGeoTab]   = useState('address')
  const [errors, setErrors]   = useState({})

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name     = 'Nom requis'
    if (!form.category)        e.category = 'Catégorie requise'
    if (!form.latitude)        e.geo      = 'Localisation requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      latitude:  parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Nom + catégorie */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom du spot" required error={errors.name}>
          <Input value={form.name} onChange={v => set('name', v)} placeholder="Ex : Plage de Grande Anse" />
        </Field>
        <Field label="Catégorie" required error={errors.category}>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: '1.5px solid var(--color-border-mid)', color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}
          >
            <option value="">Choisir…</option>
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <option key={k} value={k}>{c.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Description */}
      <Field label="Description publique">
        <Textarea value={form.description} onChange={v => set('description', v)}
          placeholder="Visible par le client sur sa carte…" rows={3} />
      </Field>

      {/* Infos pratiques */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-forest-dark)' }}>Infos pratiques</p>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.access}     onChange={v => set('access', v)}     placeholder="Accès" />
          <Input value={form.duration}   onChange={v => set('duration', v)}   placeholder="Durée" />
          <Input value={form.difficulty} onChange={v => set('difficulty', v)} placeholder="Difficulté" />
        </div>
      </div>

      {/* Localisation */}
      <Field label="Localisation" required error={errors.geo}>
        <div className="flex gap-2 mb-3">
          {GEO_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setGeoTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: geoTab === t.id ? 'var(--color-forest)' : 'var(--color-border)',
                color: geoTab === t.id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
        {geoTab === 'address' && (
          <GeocoderInput
            onSelect={({ address, latitude, longitude }) => {
              set('address', address)
              set('latitude', latitude)
              set('longitude', longitude)
            }}
          />
        )}
        {geoTab === 'gps' && (
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.latitude}  onChange={v => set('latitude', v)}  placeholder="Latitude  (ex: 16.265)" type="number" step="0.000001" />
            <Input value={form.longitude} onChange={v => set('longitude', v)} placeholder="Longitude (ex: -61.551)" type="number" step="0.000001" />
          </div>
        )}
        {geoTab === 'manual' && (
          <MapPicker
            latitude={form.latitude ? parseFloat(form.latitude) : null}
            longitude={form.longitude ? parseFloat(form.longitude) : null}
            onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng) }}
          />
        )}
        {form.latitude && form.longitude && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
          </p>
        )}
      </Field>

      {/* URL Instagram */}
      <Field label="Instagram">
        <Input value={form.instagram_url} onChange={v => set('instagram_url', v)} placeholder="@ti.koin.gwada ou URL" />
      </Field>

      {/* URL image */}
      <Field label="Photo (URL ou lien Supabase Storage)">
        <Input value={form.image_url} onChange={v => set('image_url', v)} placeholder="https://…" />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap gap-2 mt-1">
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: form.tags.includes(tag) ? 'var(--color-forest)' : 'var(--color-border)',
                color: form.tags.includes(tag) ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </Field>

      {/* Actif */}
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-forest-dark)' }}>Spot actif</span>
        <button
          type="button"
          onClick={() => set('is_active', !form.is_active)}
          className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
          style={{ background: form.is_active ? 'var(--color-forest)' : '#CBD5C9' }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: form.is_active ? '22px' : '2px' }}
          />
        </button>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Créer le spot'}
        </Button>
      </div>
    </form>
  )
}
