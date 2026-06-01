// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
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
  it('returns 400 when client_name is missing', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { forfait: 'essentiel' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'missing_client_name' })
  })

  it('creates a map without POIs and returns 201', async () => {
    const map = { id: 'map-1', slug: 'abc1234567', client_name: 'Bob', is_active: true }
    wireChain({ data: map, error: null })
    const res = mockRes()
    await handler(adminReq('POST', { client_name: 'Bob', forfait: 'essentiel', pois: [] }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ client_name: 'Bob', slug: 'abc1234567' })
  })

  it('inserts POI links when pois array is non-empty', async () => {
    const map = { id: 'map-2', slug: 'abc1234567', client_name: 'Carol', is_active: true }
    // First call (map insert), second call (links insert)
    wireChain({ data: map, error: null })
    const res = mockRes()
    await handler(adminReq('POST', {
      client_name: 'Carol',
      forfait: 'personnalise',
      pois: [{ poi_id: 'poi-1', custom_note: 'Super endroit' }],
    }), res)
    expect(res.statusCode).toBe(201)
  })
})
