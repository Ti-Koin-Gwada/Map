import { createContext, useContext, useState, useCallback, useEffect, useRef, createElement } from 'react'

const Ctx = createContext(null)

function parseExpiry(token) {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000
  } catch { return 0 }
}

export function AdminProvider({ children }) {
  const [token,   setToken]   = useState(null)   // access token in memory only — never persisted
  const [loading, setLoading] = useState(true)   // true while the silent refresh check runs on mount
  const timerRef     = useRef(null)
  const scheduleRef  = useRef(null)              // stable ref to scheduleRefresh

  // Schedule auto-refresh 60s before access token expiry
  scheduleRef.current = (t) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const delay = parseExpiry(t) - Date.now() - 60_000
    if (delay <= 0) return
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/refresh', { method: 'POST' })
        if (res.ok) {
          const { token: newT } = await res.json()
          setToken(newT)
          scheduleRef.current?.(newT)
        } else {
          setToken(null)
        }
      } catch { setToken(null) }
    }, delay)
  }

  // Silent re-auth on mount — uses the HttpOnly refresh cookie automatically
  useEffect(() => {
    let alive = true
    fetch('/api/admin/refresh', { method: 'POST' })
      .then(async res => {
        if (!alive) return
        if (res.ok) {
          const { token: t } = await res.json()
          setToken(t)
          scheduleRef.current?.(t)
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => {
      alive = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const login = useCallback(async (password) => {
    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })
    if (!res.ok) throw new Error('invalid_password')
    const { token: t } = await res.json()
    setToken(t)
    scheduleRef.current?.(t)
    return t
  }, [])

  const logout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToken(null)
    // Best-effort: clear the HttpOnly cookie server-side
    fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    if (!token) throw new Error('not_authenticated')
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
    if (res.status === 401) {
      logout()
      throw new Error('session_expired')
    }
    return res
  }, [token, logout])

  return createElement(Ctx.Provider, {
    value: { token, isAdmin: !!token, isLoading: loading, login, logout, authFetch },
  }, children)
}

export function useAdmin() {
  return useContext(Ctx)
}
