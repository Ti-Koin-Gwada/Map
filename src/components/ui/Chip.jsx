export default function Chip({ label, color, selected, onClick, disabled, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap flex-shrink-0 ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}`}
      style={{
        border: `1.5px solid ${selected ? (color || 'var(--color-forest)') : 'var(--color-border-mid)'}`,
        background: selected ? (color || 'var(--color-forest)') : 'var(--color-surface)',
        color: selected ? '#fff' : 'var(--color-text-primary)',
      }}
    >
      {color && !selected && (
        <span
          className={`rounded-full flex-shrink-0 ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
          style={{ background: color }}
        />
      )}
      {label}
    </button>
  )
}
