import { CATEGORIES } from '../../lib/constants.js'
import Chip from '../ui/Chip.jsx'

export default function MapFilters({ activeFilter, onChange }) {
  return (
    <div
      className="flex gap-2 px-4 pb-3"
      style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      <style>{`.map-filters-scroll::-webkit-scrollbar { display: none; }`}</style>
      <Chip
        label="Tous"
        selected={activeFilter === 'all'}
        onClick={() => onChange('all')}
      />
      {Object.entries(CATEGORIES).map(([key, cat]) => (
        <Chip
          key={key}
          label={cat.label}
          color={cat.color}
          selected={activeFilter === key}
          onClick={() => onChange(key)}
        />
      ))}
    </div>
  )
}
