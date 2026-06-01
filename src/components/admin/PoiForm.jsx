import { useState, useCallback } from 'react'
import { MapPin, Crosshair, Hand } from 'lucide-react'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { CATEGORIES, TAG_OPTIONS, MAP_CENTER, MAP_ZOOM } from '../../lib/constants.js'
import GeocoderInput from './GeocoderInput.jsx'
import Button from '../ui/Button.jsx'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
const GOOGLE_MAP_ID   = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'

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

// ── Carte cliquable pour placer un point ────────────────────
function MapPicker({ latitude, longitude, onChange }) {
  const handleClick = useCallback((e) => {
    if (!e.detail?.latLng) return
    onChange(e.detail.latLng.lat, e.detail.latLng.lng)
  }, [onChange])

  const handleDragEnd = useCallback((e) => {
    if (!e.latLng) return
    onChange(e.latLng.lat(), e.latLng.lng())
  }, [onChange])

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
      <div
        className="rounded-xl overflow-hidden"
        style={{ height: 280, border: '1.5px solid var(--color-border-mid)', cursor: 'crosshair' }}
      >
        <Map
          defaultCenter={hasPin ? { lat: latitude, lng: longitude } : MAP_CENTER}
          defaultZoom={hasPin ? 13 : MAP_ZOOM}
          mapTypeId="terrain"
          mapId={GOOGLE_MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
        >
          {hasPin && (
            <AdvancedMarker
              position={{ lat: latitude, lng: longitude }}
              draggable
              onDragEnd={handleDragEnd}
            />
          )}
        </Map>
      </div>
      {hasPin ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          📍 {latitude.toFixed(5)}, {longitude.toFixed(5)} — cliquez ailleurs pour déplacer
        </p>
      ) : (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Cliquez sur la carte pour placer le spot. Le marqueur est ensuite déplaçable.
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
