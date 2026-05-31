import { CATEGORIES } from '../../lib/constants.js'

export function CategoryBadge({ category }) {
  const cat = CATEGORIES[category]
  if (!cat) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ background: cat.bgLight, color: cat.color, border: `1px solid ${cat.color}33` }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: cat.color, boxShadow: '0 0 0 2px rgba(255,255,255,0.7)' }}
      />
      {cat.label}
    </span>
  )
}

export function FormatBadge({ forfait }) {
  const isPerso = forfait === 'personnalise'
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        border: `1px solid ${isPerso ? 'var(--color-forest)' : 'var(--color-border-mid)'}`,
        color:  isPerso ? 'var(--color-forest-dark)' : 'var(--color-text-secondary)',
        background: isPerso ? 'rgba(45,90,61,0.08)' : 'transparent',
      }}
    >
      {isPerso ? 'Personnalisé' : 'Essentiel'}
    </span>
  )
}

export function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Désactivée'}
    </span>
  )
}
