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

vi.mock('nanoid', () => ({ nanoid: () => 'abc1234567' }))

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

const handler = (await import('../../../api/admin/client-map.js')).default

function adminReq(method = 'GET', body = {}) {
  const token = jwt.sign({ role: 'admin' }, SECRET)
  return mockReq(method, body, {}, { authorization: `Bearer ${token}` })
}

describe('GET /api/admin/client-map', () => {
  it('returns 401 without token', async () => {
    const res = mockRes()
    await handler(mockReq('GET'), res)
    expect(res.statusCode).toBe(401)
  })

  it('returns the list of client maps', async () => {
    wireChain({ data: [{ id: '1', slug: 'abc', client_name: 'Alice' }], error: null })
    const res = mockRes()
    await handler(adminReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /api/admin/client-map', () => {
  beforeEach(() => {
    supabaseAdmin.from.mockReset()
    supabaseAdmin.from.mockReturnValue(makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }, error: null }))
  })

  it('returns 400 when client_name is missing', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { forfait: 'essentiel' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'missing_client_name' })
  })

  it('creates a map and returns 201', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { client_name: 'Bob', forfait: 'essentiel', pois: [] }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ client_name: 'Bob', slug: 'abc1234567' })
  })

  it('crée la carte en is_active=false au départ', async () => {
    const mapChain    = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: false }, error: null })
    const activateChain = makeChain({ data: { id: 'map-1', is_active: true }, error: null })
    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(activateChain)

    const res = mockRes()
    await handler(adminReq('POST', { client_name: 'Bob', pois: [] }), res)

    expect(res.statusCode).toBe(201)
    const inserted = mapChain.insert.mock.calls[0][0][0]
    expect(inserted.is_active).toBe(false)
  })

  it('supprime la carte si l\'insertion des POIs échoue (rollback)', async () => {
    const mapChain    = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: false }, error: null })
    const poisChain   = makeChain({ data: null, error: { message: 'poi_error' } })
    const deleteChain = makeChain({ data: null, error: null })
    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(poisChain)
      .mockReturnValueOnce(deleteChain)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [{ poi_id: 'poi-1', custom_note: null }],
    }), res)

    expect(res.statusCode).toBe(500)
    expect(deleteChain.delete.mock.calls.length).toBeGreaterThan(0)
  })

  it('supprime la carte si l\'insertion d\'un itinéraire échoue (rollback)', async () => {
    const mapChain    = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: false }, error: null })
    const itinChain   = makeChain({ data: null, error: { message: 'itin_error' } })
    const deleteChain = makeChain({ data: null, error: null })
    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)  // INSERT client_maps
      .mockReturnValueOnce(itinChain)  // INSERT itineraries → error
      .mockReturnValueOnce(deleteChain) // DELETE (rollback)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [],
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }), res)

    expect(res.statusCode).toBe(500)
    expect(deleteChain.delete.mock.calls.length).toBeGreaterThan(0)
  })

  it('dérive show_route=true quand un itinéraire a >= 2 étapes', async () => {
    const mapChain    = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: false }, error: null })
    const itinChain   = makeChain({ data: { id: 'itin-1' }, error: null })
    const stepsChain  = makeChain({ data: null, error: null })
    const activateChain = makeChain({ data: { id: 'map-1', is_active: true }, error: null })
    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(itinChain)
      .mockReturnValueOnce(stepsChain)
      .mockReturnValueOnce(activateChain)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [],
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }), res)

    const inserted = mapChain.insert.mock.calls[0][0][0]
    expect(inserted.show_route).toBe(true)
  })

  it('n\'inclut pas display_order dans les liens POI', async () => {
    const mapChain    = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: false }, error: null })
    const poisChain   = makeChain({ data: null, error: null })
    const activateChain = makeChain({ data: { id: 'map-1', is_active: true }, error: null })
    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(poisChain)
      .mockReturnValueOnce(activateChain)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [{ poi_id: 'poi-1', custom_note: null }],
    }), res)

    const link = poisChain.insert.mock.calls[0][0][0]
    expect(link.display_order).toBeNull()
  })
})

describe('Unsupported method', () => {
  it('returns 405 for PATCH', async () => {
    const res = mockRes()
    await handler(adminReq('PATCH'), res)
    expect(res.statusCode).toBe(405)
  })
})
