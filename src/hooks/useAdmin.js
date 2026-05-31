import { useState, useCallback } from 'react'

const TOKEN_KEY = 'tikoin_admin_token'

export function useAdmin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))

  const login = useCallback(async (password) => {
    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })
    if (!res.ok) throw new Error('invalid_password')
    const { token: t } = await res.json()
    sessionStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    return t
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    if (!token) throw new Error('not_authenticated')
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  }, [token])

  return { token, isAdmin: !!token, login, logout, authFetch }
}
