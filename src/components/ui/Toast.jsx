import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

let toastCount = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = ++toastCount
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
            style={{
              background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
              color: toast.type === 'error' ? '#DC2626' : '#15803D',
              maxWidth: 360,
            }}
          >
            {toast.type === 'error'
              ? <AlertCircle size={16} />
              : <CheckCircle size={16} />
            }
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
