import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import MapSelector from './MapSelector.jsx'
import Button from '../ui/Button.jsx'

function StepBar({ step, setStep }) {
  const steps = ['Infos client', 'Sélection', 'Confirmation']
  return (
    <div className="flex items-center gap-3 px-7 pb-5 flex-shrink-0">
      {steps.map((label, i) => {
        const n = i + 1, on = step === n, done = step > n
        return (
          <div key={label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => done && setStep(n)}
              className="flex items-center gap-2.5"
              style={{ background: 'none', border: 'none', cursor: done ? 'pointer' : 'default' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{
                  background: on || done ? 'var(--color-forest)' : 'var(--color-surface)',
                  color: on || done ? 'white' : 'var(--color-text-muted)',
                  border: `1.5px solid ${on || done ? 'var(--color-forest)' : 'var(--color-border-mid)'}`,
                }}
              >
                {done ? '✓' : n}
              </span>
              <span
                className="text-sm"
                style={{
                  color: on ? 'var(--color-forest-dark)' : 'var(--color-text-muted)',
                  fontWeight: on ? 600 : 500,
                }}
              >
                {label}
              </span>
            </button>
            {i < 2 && (
              <span className="flex-shrink-0 w-8 h-px" style={{ background: 'var(--color-border-mid)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ form, setForm, onNext }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canNext = form.client_name.trim()

  return (
    <div
      className="flex-1 overflow-y-auto tk-scroll px-7 py-6"
      style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-lg flex flex-col gap-5">
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-forest-dark)' }}>
            Nom du client *
          </span>
          <input
            type="text"
            value={form.client_name}
            onChange={(e) => set('client_name', e.target.value)}
            placeholder="Famille Martin"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ border: '1.5px solid var(--color-border-mid)', background: 'white', color: 'var(--color-text-primary)' }}
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-forest-dark)' }}>
            Notes internes (non visibles du client)
          </span>
          <textarea
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Sportifs, aiment la rando, 2 enfants…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ border: '1.5px solid var(--color-border-mid)', background: 'white', color: 'var(--color-text-primary)' }}
          />
        </label>

        <div className="flex justify-end">
          <Button variant="primary" disabled={!canNext} onClick={onNext}>
            Continuer vers la sélection →
          </Button>
        </div>
      </div>
    </div>
  )
}

function Step3({ form, chosen, pois, slug, onBack }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/map/${slug}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const catBreakdown = chosen.reduce((acc, id) => {
    const poi = pois.find(p => p.id === id)
    if (poi) acc[poi.category] = (acc[poi.category] || 0) + 1
    return acc
  }, {})

  return (
    <div
      className="flex-1 overflow-y-auto tk-scroll flex items-center justify-center px-7 py-10"
      style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-md text-center">
        <div className="inline-flex mb-5">
          <svg width="44" height="44" viewBox="0 0 24 24">
            <path d="M20 3.5 C9 3 3.2 9 3.2 16.5 C3.2 18.6 3.8 20.4 4.6 21.6 C5.8 20.4 6.6 19 7.2 17.4 C9 19 12 18.8 14.6 16.8 C19.4 13 20.6 7 20 3.5 Z" fill="var(--color-forest)" />
            <path d="M5.4 20.6 C7.6 14 11.6 9.4 17.4 6.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-serif italic font-semibold text-3xl mb-2" style={{ color: 'var(--color-forest-dark)' }}>
          Carte prête à partager
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {chosen.length} spot{chosen.length > 1 ? 's' : ''} pour {form.client_name}
        </p>
        {Object.keys(catBreakdown).length > 0 && (
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {Object.entries(catBreakdown).map(([cat, n]) => `${n} ${cat}`).join(' · ')}
          </p>
        )}

        {/* URL */}
        <div
          className="flex items-center gap-2 p-2 rounded-xl mb-5"
          style={{ border: '1px solid var(--color-border)', background: 'white' }}
        >
          <span
            className="flex-1 font-mono text-sm px-2 truncate text-left"
            style={{ color: 'var(--color-forest-dark)' }}
          >
            {url}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white flex-shrink-0"
            style={{ background: copied ? '#22C55E' : 'var(--color-forest)' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={`/map/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <ExternalLink size={14} /> Voir la carte
          </a>
          <button
            type="button"
            onClick={onBack}
            className="text-sm"
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Revenir à la sélection
          </button>
        </div>
      </div>
    </div>
  )
}

const INITIAL_FORM = { client_name: '', notes: '' }

export default function ClientMapForm({ pois = [], onSave, onCancel, saving, createdSlug }) {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState(INITIAL_FORM)
  const [chosen, setChosen] = useState([])
  const [notes, setNotes]   = useState({})

  const handleSave = () => {
    onSave({
      ...form,
      pois: chosen.map((id, i) => ({
        poi_id:      id,
        custom_note: notes[id] || null,
        display_order: i,
      })),
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-end justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif italic font-semibold text-3xl" style={{ color: 'var(--color-forest-dark)' }}>
            {form.client_name || 'Nouvelle carte'}
          </h1>
          {form.client_name && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {chosen.length} spots sélectionnés
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          {step === 2 && (
            <Button
              variant="primary"
              disabled={chosen.length === 0 || saving}
              onClick={handleSave}
            >
              {saving ? 'Génération…' : 'Générer la carte →'}
            </Button>
          )}
        </div>
      </div>

      <StepBar step={createdSlug ? 3 : step} setStep={setStep} />

      {createdSlug ? (
        <Step3 form={form} chosen={chosen} pois={pois} slug={createdSlug} onBack={() => {}} />
      ) : step === 1 ? (
        <Step1 form={form} setForm={setForm} onNext={() => setStep(2)} />
      ) : (
        <MapSelector
          pois={pois}
          chosen={chosen}
          onChosenChange={setChosen}
          notes={notes}
          onNotesChange={setNotes}
          totalPois={pois.length}
        />
      )}
    </div>
  )
}
