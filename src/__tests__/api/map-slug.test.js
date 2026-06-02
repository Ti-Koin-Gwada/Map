// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { mockReq, mockRes, makeChain } from './_helpers.js'

// vi.hoisted ensures mockFrom is defined before vi.mock factory runs
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom }),
}))

const handler = (await import('../../../api/map/[slug].js')).default

describe('GET /api/map/:slug', () => {
  it('returns 405 for non-GET methods', async () => {
    const res = mockRes()
    await handler(mockReq('POST', {}, { slug: 'test' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 404 when map does not exist', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'no rows' } }))
    const res = mockRes()
    await handler(mockReq('GET', {}, { slug: 'unknown' }), res)
    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'not_found' })
  })

  it('returns 403 when map is inactive', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { id: 'map-1', slug: 'inactive', client_name: 'Test', is_active: false }, error: null })
      }
      return makeChain({ data: [], error: null })
    })
    const res = mockRes()
    await handler(mockReq('GET', {}, { slug: 'inactive' }), res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ error: 'inactive' })
  })

  it('returns the map data with pois and notes', async () => {
    const poiData = { id: 'poi-1', name: 'Plage du Gosier', category: 'plage', latitude: 16.2, longitude: -61.5 }
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({
          data: { id: 'map-1', slug: 'my-map', client_name: 'Alice', forfait: 'essentiel', is_active: true },
          error: null,
        })
      }
      return makeChain({
        data: [{ custom_note: 'Très belle plage', display_order: 0, pois: poiData }],
        error: null,
      })
    })
    const res = mockRes()
    await handler(mockReq('GET', {}, { slug: 'my-map' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.client_name).toBe('Alice')
    expect(res.body.pois).toHaveLength(1)
    expect(res.body.pois[0].name).toBe('Plage du Gosier')
    expect(res.body.notes['poi-1']).toBe('Très belle plage')
  })

  it('inclut menu_url et flo_reco dans les POIs de la réponse', async () => {
    const poiData = {
      id: 'poi-r', name: 'Chez Marcel', category: 'restaurant',
      latitude: 16.3, longitude: -61.6,
      menu_url: 'https://cdn.example.com/menu.jpg', flo_reco: 'Incontournable !',
    }
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { id: 'map-1', slug: 'my-map', client_name: 'Alice', is_active: true }, error: null })
      }
      return makeChain({ data: [{ custom_note: null, display_order: 0, pois: poiData }], error: null })
    })
    const res = mockRes()
    await handler(mockReq('GET', {}, { slug: 'my-map' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.pois[0].menu_url).toBe('https://cdn.example.com/menu.jpg')
    expect(res.body.pois[0].flo_reco).toBe('Incontournable !')
  })

  it('returns empty pois and notes when no links exist', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { id: 'map-2', slug: 'empty', client_name: 'Bob', is_active: true }, error: null })
      }
      return makeChain({ data: [], error: null })
    })
    const res = mockRes()
    await handler(mockReq('GET', {}, { slug: 'empty' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.pois).toHaveLength(0)
    expect(res.body.notes).toEqual({})
  })
})
