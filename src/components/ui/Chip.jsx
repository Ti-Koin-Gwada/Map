export default function Chip({ label, color, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer"
      style={{
        border: `1.5px solid ${selected ? (color || 'var(--color-forest)') : 'var(--color-border-mid)'}`,
        background: selected ? (color || 'var(--color-forest)') : 'var(--color-surface)',
        color: selected ? '#fff' : 'var(--color-text-primary)',
      }}
    >
      {color && !selected && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  )
}
