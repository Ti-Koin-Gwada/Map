import { useState } from 'react'
import { MapPin, Crosshair } from 'lucide-react'
import { CATEGORIES } from '../../lib/constants.js'
import GeocoderInput from './GeocoderInput.jsx'
import ImageUpload from './ImageUpload.jsx'
import Button from '../ui/Button.jsx'

const GEO_TABS = [
  { id: 'address', label: 'Adresse', icon: MapPin },
  { id: 'gps',     label: 'GPS',     icon: Crosshair },
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

const INITIAL = {
  name: '', category: '', description: '', details: '',
  access: '', duration: '', difficulty: '',
  address: '', latitude: '', longitude: '',
  instagram_url: '', image_url: '', is_active: true,
  menu_url: '', flo_reco: '',
}

export default function PoiForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ? { ...INITIAL, ...initial } : INITIAL)
  const [geoTab, setGeoTab] = useState('address')
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name     = 'Nom requis'
    if (!form.category)    e.category = 'Catégorie requise'
    if (!form.latitude)    e.geo      = 'Localisation requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const { tags: _, ...payload } = form
    onSave({
      ...payload,
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
            onChange={(e) => {
              const cat = e.target.value
              setForm(f => ({
                ...f,
                category: cat,
                ...(cat !== 'restaurant' ? { menu_url: '', flo_reco: '' } : {}),
              }))
            }}
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

      {/* Photo */}
      <Field label="Photo">
        <ImageUpload value={form.image_url} onChange={v => set('image_url', v)} />
      </Field>

      {/* Carte du menu + Reco de Flo (restaurants uniquement) */}
      {form.category === 'restaurant' && (
        <>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-forest-dark)' }}>
              🍽️ Spécifique restaurant
            </p>
            <div className="flex flex-col gap-5">
              <Field label="Carte du menu (image)">
                <ImageUpload value={form.menu_url} onChange={v => set('menu_url', v)} />
              </Field>
              <Field label="Reco de Flo">
                <Textarea
                  value={form.flo_reco}
                  onChange={v => set('flo_reco', v)}
                  placeholder="Les plats à ne pas rater, l'ambiance, les meilleurs horaires…"
                  rows={4}
                />
              </Field>
            </div>
          </div>
        </>
      )}

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
