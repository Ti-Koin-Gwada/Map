export default function Button({
  children, variant = 'secondary', size = 'md',
  onClick, disabled, type = 'button', className = '', style,
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl cursor-pointer transition-all duration-150 whitespace-nowrap select-none'
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-base',
  }
  const variants = {
    primary:  'bg-[--color-forest] text-white hover:bg-[--color-forest-dark] shadow-sm',
    secondary:'bg-white text-[--color-text-primary] border border-[--color-border-mid] hover:bg-[--color-bg]',
    ghost:    'text-[--color-text-secondary] hover:bg-[--color-border]',
    danger:   'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
