import { CATEGORIES } from '../../lib/constants.js'
import Chip from '../ui/Chip.jsx'

export default function MapFilters({ activeFilter, onChange }) {
  return (
    <div
      className="flex gap-1.5 px-4 pb-2.5"
      style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <Chip
        label="Tous"
        selected={activeFilter === 'all'}
        onClick={() => onChange('all')}
        small
      />
      {Object.entries(CATEGORIES).map(([key, cat]) => (
        <Chip
          key={key}
          label={cat.label}
          color={cat.color}
          selected={activeFilter === key}
          onClick={() => onChange(key)}
          small
        />
      ))}
    </div>
  )
}
