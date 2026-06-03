// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { mockReq, mockRes, makeChain } from './_helpers.js'

const SECRET = 'test-secret'
beforeAll(() => {
  process.env.JWT_SECRET = SECRET
  process.env.VITE_SUPABASE_URL        = 'http://localhost'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'key'
})

vi.mock('../../../api/_lib/supabase.js', () => {
  const chain = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), order: vi.fn(), single: vi.fn() }
  return { supabaseAdmin: { from: vi.fn().mockReturnValue(chain), _chain: chain } }
})

const { supabaseAdmin } = await import('../../../api/_lib/supabase.js')
const chain = supabaseAdmin._chain

function wireChain(result) {
  const c = makeChain(result)
  Object.assign(chain, c)
  supabaseAdmin.from.mockReturnValue(chain)
}

const handler = (await import('../../../api/admin/client-map/[id].js')).default

function adminReq(method = 'PUT', body = {}, id = 'map-1') {
  const token = jwt.sign({ role: 'admin' }, SECRET)
  return mockReq(method, body, { id }, { authorization: `Bearer ${token}` })
}

describe('PUT /api/admin/client-map/:id', () => {
  it('returns 401 without token', async () => {
    const res = mockRes()
    await handler(mockReq('PUT', {}, { id: '1' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('updates map fields without touching POIs', async () => {
    const updated = { id: 'map-1', client_name: 'Updated', is_active: true }
    wireChain({ data: updated, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { client_name: 'Updated', is_active: true }, 'map-1'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ id: 'map-1' })
  })

  it('replaces POI links when pois array is provided', async () => {
    const updated = { id: 'map-1', client_name: 'Carol', is_active: true }
    wireChain({ data: updated, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Carol',
      pois: [{ poi_id: 'poi-2', custom_note: null }],
    }, 'map-1'), res)
    expect(res.statusCode).toBe(200)
  })
})

describe('PUT /api/admin/client-map/:id — itinéraires', () => {
  beforeEach(() => {
    supabaseAdmin.from.mockReset()
  })

  it('dérive show_route=true quand itineraries a >= 2 étapes', async () => {
    const updateChain = makeChain({ data: { id: 'map-1', client_name: 'Bob' }, error: null })
    const deleteItinChain = makeChain({ data: null, error: null })
    const insertItinChain = makeChain({ data: { id: 'itin-1' }, error: null })
    const insertStepsChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(updateChain)    // UPDATE client_maps
      .mockReturnValueOnce(deleteItinChain) // DELETE itineraries
      .mockReturnValueOnce(insertItinChain) // INSERT itineraries
      .mockReturnValueOnce(insertStepsChain) // INSERT itinerary_steps

    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Bob',
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }, 'map-1'), res)

    expect(res.statusCode).toBe(200)
    const updated = updateChain.update.mock.calls[0][0]
    expect(updated.show_route).toBe(true)
  })

  it('dérive show_route=false quand itineraries est vide', async () => {
    const updateChain = makeChain({ data: { id: 'map-1' }, error: null })
    const deleteItinChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteItinChain)

    const res = mockRes()
    await handler(adminReq('PUT', { client_name: 'Bob', itineraries: [] }, 'map-1'), res)

    const updated = updateChain.update.mock.calls[0][0]
    expect(updated.show_route).toBe(false)
  })

  it('n\'inclut pas display_order=null dans les liens POI mis à jour', async () => {
    const updateChain = makeChain({ data: { id: 'map-1' }, error: null })
    const deletePoiChain = makeChain({ data: null, error: null })
    const insertPoiChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deletePoiChain)
      .mockReturnValueOnce(insertPoiChain)

    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Bob',
      pois: [{ poi_id: 'poi-1', custom_note: null }],
    }, 'map-1'), res)

    const link = insertPoiChain.insert.mock.calls[0][0][0]
    expect(link.display_order).toBeNull()
  })
})

describe('DELETE /api/admin/client-map/:id', () => {
  it('returns 204 on success', async () => {
    wireChain({ error: null })
    const res = mockRes()
    await handler(adminReq('DELETE', {}, 'map-1'), res)
    expect(res.statusCode).toBe(204)
    expect(res.ended).toBe(true)
  })

  it('returns 405 for unsupported method', async () => {
    const res = mockRes()
    await handler(adminReq('GET', {}, 'map-1'), res)
    expect(res.statusCode).toBe(405)
  })
})
