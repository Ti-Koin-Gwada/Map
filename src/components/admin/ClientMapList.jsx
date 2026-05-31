import { useState } from 'react'
import { Copy, Check, ExternalLink, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useClientMaps } from '../../hooks/useClientMaps.js'
import { useToast } from '../ui/Toast.jsx'
import { FormatBadge, StatusBadge } from '../ui/Badge.jsx'

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
      style={{ background: on ? 'var(--color-forest)' : '#CBD5C9' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  )
}

function CopyLink({ slug }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/map/${slug}`

  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono text-xs px-2.5 py-1.5 rounded-lg truncate max-w-[140px]"
        style={{ background: 'var(--color-bg)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-border)' }}
      >
        /map/{slug}
      </span>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
        style={{ background: copied ? '#DCFCE7' : 'var(--color-border)', color: copied ? '#15803D' : 'var(--color-text-secondary)' }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Copié' : 'Copier'}
      </button>
    </div>
  )
}

const COLS = [
  { key: 'client',  label: 'Client',     flex: '1.6fr' },
  { key: 'forfait', label: 'Forfait',     flex: '1fr' },
  { key: 'spots',   label: 'Spots',       flex: '0.7fr' },
  { key: 'date',    label: 'Créée le',    flex: '1fr' },
  { key: 'active',  label: 'Active',      flex: '0.8fr' },
  { key: 'link',    label: 'Lien client', flex: '2fr' },
  { key: 'actions', label: '',            flex: '0.4fr' },
]

export default function ClientMapList({ onNew }) {
  const { maps, loading, update, remove } = useClientMaps()
  const toast = useToast()

  const handleToggle = async (map) => {
    try {
      await update.mutateAsync({ id: map.id, is_active: !map.is_active })
      toast(map.is_active ? 'Carte désactivée' : 'Carte activée')
    } catch {
      toast('Erreur', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette carte ?')) return
    try {
      await remove.mutateAsync(id)
      toast('Carte supprimée')
    } catch {
      toast('Erreur lors de la suppression', 'error')
    }
  }

  const gridStyle = { display: 'grid', gridTemplateColumns: COLS.map(c => c.flex).join(' ') }

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between px-7 py-5 flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif italic font-semibold text-3xl" style={{ color: 'var(--color-forest-dark)' }}>
            Mes cartes
          </h1>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {maps.length} cartes clients
          </span>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
          style={{ background: 'var(--color-forest)' }}
        >
          <Plus size={16} /> Nouvelle carte
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto tk-scroll px-7 pb-7">
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {/* En-têtes */}
          <div
            style={{ ...gridStyle, borderBottom: '1px solid var(--color-border)', background: 'rgba(232,237,230,0.4)', padding: '12px 22px' }}
          >
            {COLS.map(col => (
              <span key={col.key} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {col.label}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-forest)', borderTopColor: 'transparent' }} />
            </div>
          ) : maps.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Aucune carte créée pour l'instant.
            </div>
          ) : maps.map((map, i) => (
            <div
              key={map.id}
              style={{
                ...gridStyle,
                alignItems: 'center',
                padding: '16px 22px',
                borderBottom: i < maps.length - 1 ? '1px solid var(--color-border)' : 'none',
                opacity: map.is_active ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
            >
              <span className="font-serif italic font-semibold text-lg" style={{ color: 'var(--color-forest-dark)' }}>
                {map.client_name}
              </span>
              <span><FormatBadge forfait={map.forfait} /></span>
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {map.client_map_pois?.[0]?.count ?? '—'} spots
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {new Date(map.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
              </span>
              <Toggle on={map.is_active} onChange={() => handleToggle(map)} />
              <CopyLink slug={map.slug} />
              <div className="flex justify-end gap-1">
                <a
                  href={`/map/${map.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg opacity-40 hover:opacity-70 transition-opacity"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(map.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg opacity-40 hover:opacity-70 transition-opacity"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
