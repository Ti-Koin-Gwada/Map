import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAdmin, AdminProvider } from '../../hooks/useAdmin.js'

const wrapper = ({ children }) => AdminProvider({ children })

// Fake access token with a controllable expiry
function fakeToken(expiresInSec = 900) {
  const now = Math.floor(Date.now() / 1000)
  const payload = { role: 'admin', iat: now, exp: now + expiresInSec }
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=/g, '')
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ── Initial load (silent refresh on mount) ─────────────────────

describe('useAdmin — initial load', () => {
  it('isLoading=true while the refresh check is in flight', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))) // never resolves
    const { result } = renderHook(() => useAdmin(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it('isLoading=false and isAdmin=false when no session exists (401)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.token).toBeNull()
  })

  it('isAdmin=true after silent refresh succeeds', async () => {
    const token = fakeToken()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ token }),
    }))
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.token).toBe(token)
  })
})

// ── Login ──────────────────────────────────────────────────────

describe('useAdmin — login', () => {
  it('sets isAdmin=true on successful login', async () => {
    const token = fakeToken()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })                            // refresh on mount
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token }) }), // login
    )
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.login('mypassword'))
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.token).toBe(token)
  })

  it('throws invalid_password on failed login', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 }) // refresh
      .mockResolvedValueOnce({ ok: false, status: 401 }), // login
    )
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await expect(() => act(() => result.current.login('wrong'))).rejects.toThrow('invalid_password')
  })
})

// ── Logout ─────────────────────────────────────────────────────

describe('useAdmin — logout', () => {
  it('clears token and fires POST /api/admin/logout', async () => {
    const token = fakeToken()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token }) }) // refresh
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })            // logout (best-effort)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isAdmin).toBe(true))

    act(() => result.current.logout())
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.token).toBeNull()

    // logout fires a best-effort POST — flush async
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', { method: 'POST' })
    )
  })
})

// ── authFetch ──────────────────────────────────────────────────

describe('useAdmin — authFetch', () => {
  it('throws not_authenticated when no token (no session)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await expect(() => result.current.authFetch('/api/admin/poi')).rejects.toThrow('not_authenticated')
  })

  it('sends Authorization header with bearer token', async () => {
    const token = fakeToken()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token }) }) // refresh
      .mockResolvedValueOnce({ ok: true, status: 200 })                            // authFetch call
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isAdmin).toBe(true))

    await act(() => result.current.authFetch('/api/admin/poi'))
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/poi', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
    }))
  })

  it('auto-logout and throws session_expired on 401 response', async () => {
    const token = fakeToken()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token }) }) // refresh on mount
      .mockResolvedValueOnce({ ok: false, status: 401 })                           // authFetch → 401
      .mockResolvedValue({ ok: true }),                                             // logout POST
    )
    const { result } = renderHook(() => useAdmin(), { wrapper })
    await waitFor(() => expect(result.current.isAdmin).toBe(true))

    let caught
    await act(async () => {
      try { await result.current.authFetch('/api/admin/poi') }
      catch (e) { caught = e }
    })
    expect(caught?.message).toBe('session_expired')
    expect(result.current.token).toBeNull()
    expect(result.current.isAdmin).toBe(false)
  })
})

// ── Auto-refresh timer ─────────────────────────────────────────

describe('useAdmin — auto-refresh', () => {
  it('schedules a refresh 60s before the access token expires', async () => {
    vi.useFakeTimers()
    // Token expires in 120s → refresh fires in 60s
    const token1 = fakeToken(120)
    const token2 = fakeToken(900)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: token1 }) }) // initial refresh
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: token2 }) }) // auto-refresh
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAdmin(), { wrapper })

    // Flush the initial refresh fetch
    await act(async () => { await Promise.resolve() })

    vi.advanceTimersByTime(60_001) // trigger the auto-refresh timer

    await act(async () => { await Promise.resolve() })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/refresh', { method: 'POST' })
  })
})
