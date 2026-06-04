import { useState } from 'react'
import { Eye, EyeOff, Leaf } from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin.js'

function LeafMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24">
      <path d="M20 3.5 C9 3 3.2 9 3.2 16.5 C3.2 18.6 3.8 20.4 4.6 21.6 C5.8 20.4 6.6 19 7.2 17.4 C9 19 12 18.8 14.6 16.8 C19.4 13 20.6 7 20 3.5 Z" fill="var(--color-forest)" />
      <path d="M5.4 20.6 C7.6 14 11.6 9.4 17.4 6.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function AdminLogin() {
  const { login } = useAdmin()
  const [pwd, setPwd]       = useState('')
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(pwd)
    } catch {
      setError('Mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <LeafMark />
          </div>
          <h1
            className="font-serif italic font-semibold text-3xl"
            style={{ color: 'var(--color-forest-dark)' }}
          >
            Ti Koin Gwada
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Espace admin
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-forest-dark)' }}
              >
                Mot de passe
              </span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-10"
                  style={{
                    border: `1.5px solid ${error ? '#FCA5A5' : 'var(--color-border-mid)'}`,
                    background: error ? '#FEF2F2' : 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
              )}
            </label>

            <button
              type="submit"
              disabled={loading || !pwd}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all"
              style={{ background: loading ? 'var(--color-forest-mid)' : 'var(--color-forest)' }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
