import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useClientMap } from '../../hooks/useClientMap.js'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

describe('useClientMap', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns loading=true initially when slug is provided', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const { result } = renderHook(() => useClientMap('my-slug'), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('does not fetch when slug is falsy', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderHook(() => useClientMap(null), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns is404=true on 404 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }))
    const { result } = renderHook(() => useClientMap('missing'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.is404).toBe(true)
    expect(result.current.is403).toBe(false)
  })

  it('returns is403=true on 403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403, ok: false }))
    const { result } = renderHook(() => useClientMap('inactive'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.is403).toBe(true)
    expect(result.current.is404).toBe(false)
  })

  it('returns map data and pois on success', async () => {
    const payload = {
      client_name: 'Alice',
      forfait: 'essentiel',
      slug: 'alice-slug',
      pois: [{ id: 'p1', name: 'Plage', category: 'plage' }],
      notes: { p1: 'Super spot' },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true, json: () => Promise.resolve(payload) }))
    const { result } = renderHook(() => useClientMap('alice-slug'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.map.client_name).toBe('Alice')
    expect(result.current.pois).toHaveLength(1)
    expect(result.current.is404).toBe(false)
    expect(result.current.is403).toBe(false)
  })
})
