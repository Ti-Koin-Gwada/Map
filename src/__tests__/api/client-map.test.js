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
    supabaseAdmin.from.mockReturnValue(makeChain({ data: null, error: null }))
  })

  it('returns 400 when client_name is missing', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { forfait: 'essentiel' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'missing_client_name' })
  })

  it('creates a map without POIs and returns 201', async () => {
    const map = { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }
    supabaseAdmin.from.mockReturnValue(makeChain({ data: map, error: null }))
    const res = mockRes()
    await handler(adminReq('POST', { client_name: 'Bob', forfait: 'essentiel', pois: [] }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ client_name: 'Bob', slug: 'abc1234567' })
  })

  it('inserts POI links when pois array is non-empty', async () => {
    const map = { id: 'map-2', slug: 'abc1234567', client_name: 'Carol', is_active: true }
    supabaseAdmin.from.mockReturnValue(makeChain({ data: map, error: null }))
    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Carol',
      forfait: 'personnalise',
      pois: [{ poi_id: 'poi-1', custom_note: 'Super endroit' }],
    }), res)
    expect(res.statusCode).toBe(201)
  })
})

describe('POST /api/admin/client-map — itinéraires', () => {
  it('insère un itinéraire et ses étapes', async () => {
    const mapChain  = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }, error: null })
    const itinChain = makeChain({ data: { id: 'itin-1', client_map_id: 'map-1', name: 'Matin' }, error: null })
    const stepsChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(itinChain)
      .mockReturnValueOnce(stepsChain)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [],
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }), res)

    expect(res.statusCode).toBe(201)
    const itinInserted = itinChain.insert.mock.calls[0][0][0]
    expect(itinInserted.name).toBe('Matin')
    expect(itinInserted.client_map_id).toBe('map-1')

    const stepsInserted = stepsChain.insert.mock.calls[0][0]
    expect(stepsInserted).toHaveLength(2)
    expect(stepsInserted[0].poi_id).toBe('poi-1')
    expect(stepsInserted[0].step_order).toBe(0)
    expect(stepsInserted[1].poi_id).toBe('poi-2')
    expect(stepsInserted[1].step_order).toBe(1)
  })

  it('dérive show_route=true quand un itinéraire a >= 2 étapes', async () => {
    const mapChain   = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }, error: null })
    const itinChain  = makeChain({ data: { id: 'itin-1' }, error: null })
    const stepsChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(itinChain)
      .mockReturnValueOnce(stepsChain)

    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Bob',
      pois: [],
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2', 'poi-3'] }],
    }), res)

    const inserted = mapChain.insert.mock.calls[0][0][0]
    expect(inserted.show_route).toBe(true)
  })

  it('dérive show_route=false quand pas d\'itinéraires', async () => {
    const mapChain = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }, error: null })
    supabaseAdmin.from.mockReturnValueOnce(mapChain)

    const res = mockRes()
    await handler(adminReq('POST', { client_name: 'Bob', pois: [] }), res)
    const inserted = mapChain.insert.mock.calls[0][0][0]
    expect(inserted.show_route).toBe(false)
  })

  it('n\'inclut pas display_order dans les liens POI (toujours null)', async () => {
    const mapChain  = makeChain({ data: { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }, error: null })
    const poisChain = makeChain({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mapChain)
      .mockReturnValueOnce(poisChain)

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
