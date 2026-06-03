export default function HomePin({ size = 32, onClick, title, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || 'Mon domicile'}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -100%)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        lineHeight: 0,
        zIndex: 5,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size * 1.28}
        viewBox="0 0 24 31"
        style={{ display: 'block', filter: 'drop-shadow(0 3px 4px rgba(0,40,180,0.3))' }}
      >
        <path
          d="M12 0.8 C5.5 0.8 0.8 5.4 0.8 11.4 C0.8 19.4 12 30.2 12 30.2 C12 30.2 23.2 19.4 23.2 11.4 C23.2 5.4 18.5 0.8 12 0.8 Z"
          fill="#1D4ED8"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="1.1"
        />
        <circle cx="12" cy="11.4" r="4.3" fill="#fff" />
        {/* Roof */}
        <path
          d="M8.8 11.2 L12 8.2 L15.2 11.2"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Walls */}
        <path
          d="M9.8 11.2 L9.8 14.4 L14.2 14.4 L14.2 11.2"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Door */}
        <rect x="11.2" y="12.6" width="1.6" height="1.8" rx="0.3" fill="#1D4ED8" />
      </svg>
    </button>
  )
}
