import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdmin } from '../../hooks/useAdmin.js'

describe('useAdmin', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts unauthenticated when sessionStorage is empty', () => {
    const { result } = renderHook(() => useAdmin())
    expect(result.current.token).toBeNull()
    expect(result.current.isAdmin).toBe(false)
  })

  it('reads an existing token from sessionStorage on mount', () => {
    sessionStorage.setItem('tikoin_admin_token', 'existing-token')
    const { result } = renderHook(() => useAdmin())
    expect(result.current.token).toBe('existing-token')
    expect(result.current.isAdmin).toBe(true)
  })

  it('login: stores token in sessionStorage and updates state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'new-token-123' }),
    }))

    const { result } = renderHook(() => useAdmin())
    await act(() => result.current.login('mypassword'))

    expect(fetch).toHaveBeenCalledWith('/api/admin/login', expect.objectContaining({ method: 'POST' }))
    expect(sessionStorage.getItem('tikoin_admin_token')).toBe('new-token-123')
    expect(result.current.token).toBe('new-token-123')
    expect(result.current.isAdmin).toBe(true)
  })

  it('login: throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useAdmin())
    await expect(() => act(() => result.current.login('wrong'))).rejects.toThrow('invalid_password')
  })

  it('logout: clears token from sessionStorage and state', async () => {
    sessionStorage.setItem('tikoin_admin_token', 'some-token')
    const { result } = renderHook(() => useAdmin())
    act(() => result.current.logout())
    expect(result.current.token).toBeNull()
    expect(result.current.isAdmin).toBe(false)
    expect(sessionStorage.getItem('tikoin_admin_token')).toBeNull()
  })

  it('authFetch: throws when not authenticated', async () => {
    const { result } = renderHook(() => useAdmin())
    await expect(() => result.current.authFetch('/api/admin/poi')).rejects.toThrow('not_authenticated')
  })

  it('authFetch: includes Authorization header with bearer token', async () => {
    sessionStorage.setItem('tikoin_admin_token', 'tok-xyz')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useAdmin())
    await act(() => result.current.authFetch('/api/admin/poi'))
    expect(fetch).toHaveBeenCalledWith('/api/admin/poi', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer tok-xyz' }),
    }))
  })
})
