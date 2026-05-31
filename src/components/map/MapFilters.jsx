import { CATEGORIES } from '../../lib/constants.js'
import Chip from '../ui/Chip.jsx'

export default function MapFilters({ activeFilter, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 px-7 pb-4">
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
