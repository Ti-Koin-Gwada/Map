export default function MarkerPin({
  color = '#2D5A3D',
  size = 32,
  selected,
  dimmed,
  faded,
  check,
  number,
  style,
  onClick,
  title,
}) {
  const fill   = faded ? '#B9C4BA' : color
  const stroke = 'rgba(0,0,0,0.28)'

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -100%)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        lineHeight: 0,
        zIndex: selected ? 6 : 4,
        opacity: dimmed ? 0.45 : 1,
        transition: 'opacity 0.2s, transform 0.15s',
        transformOrigin: 'bottom center',
        ...(selected && { transform: 'translate(-50%, -100%) scale(1.2)' }),
        ...style,
      }}
    >
      <svg
        width={size}
        height={size * 1.28}
        viewBox="0 0 24 31"
        style={{
          display: 'block',
          filter: 'drop-shadow(0 3px 4px rgba(26,46,32,0.32))',
          transition: 'filter 0.15s',
        }}
      >
        <path
          d="M12 0.8 C5.5 0.8 0.8 5.4 0.8 11.4 C0.8 19.4 12 30.2 12 30.2 C12 30.2 23.2 19.4 23.2 11.4 C23.2 5.4 18.5 0.8 12 0.8 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.1"
        />
        <circle cx="12" cy="11.4" r="4.3" fill="#fff" />
        {number != null ? (
          <text
            x="12"
            y="14.2"
            textAnchor="middle"
            fontSize="5.5"
            fontWeight="700"
            fontFamily="DM Sans, sans-serif"
            fill={fill}
          >
            {number > 99 ? '99+' : number}
          </text>
        ) : check && (
          <path
            d="M9.6 11.4 l1.7 1.7 l3.1 -3.4"
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  )
}
