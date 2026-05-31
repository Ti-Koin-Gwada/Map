import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16"
      style={{ background: 'rgba(26,46,32,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`relative w-full bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-serif italic font-semibold text-2xl" style={{ color: 'var(--color-forest-dark)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} color="var(--color-text-muted)" />
          </button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  )
}
