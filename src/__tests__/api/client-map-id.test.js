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
  const rpc = vi.fn().mockResolvedValue({ error: null })
  return { supabaseAdmin: { from: vi.fn().mockReturnValue(chain), rpc, _chain: chain } }
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
  beforeEach(() => {
    supabaseAdmin.rpc.mockResolvedValue({ error: null })
  })

  it('returns 401 without token', async () => {
    const res = mockRes()
    await handler(mockReq('PUT', {}, { id: '1' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('met à jour les métadonnées sans appeler le RPC si pois/itineraries absents', async () => {
    wireChain({ data: { id: 'map-1', client_name: 'Updated', is_active: true }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { client_name: 'Updated', is_active: true }, 'map-1'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ id: 'map-1' })
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
  })

  it('appelle replace_map_content quand pois est fourni', async () => {
    wireChain({ data: { id: 'map-1', client_name: 'Carol' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Carol',
      pois: [{ poi_id: 'poi-2', custom_note: null }],
    }, 'map-1'), res)
    expect(res.statusCode).toBe(200)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('replace_map_content', {
      p_map_id:      'map-1',
      p_pois:        [{ poi_id: 'poi-2', custom_note: null }],
      p_itineraries: [],
    })
  })

  it('appelle replace_map_content avec itineraries quand fournis', async () => {
    wireChain({ data: { id: 'map-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Bob',
      pois: [],
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }, 'map-1'), res)
    expect(res.statusCode).toBe(200)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('replace_map_content', {
      p_map_id:      'map-1',
      p_pois:        [],
      p_itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    })
  })

  it('retourne 500 si le RPC échoue', async () => {
    wireChain({ data: { id: 'map-1' }, error: null })
    supabaseAdmin.rpc.mockResolvedValueOnce({ error: { message: 'rpc_error' } })
    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Bob',
      pois: [{ poi_id: 'poi-1', custom_note: null }],
    }, 'map-1'), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'rpc_error' })
  })

  it('dérive show_route=true quand itineraries a >= 2 étapes', async () => {
    wireChain({ data: { id: 'map-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', {
      client_name: 'Bob',
      itineraries: [{ name: 'Matin', steps: ['poi-1', 'poi-2'] }],
    }, 'map-1'), res)
    const updated = chain.update.mock.calls[0][0]
    expect(updated.show_route).toBe(true)
  })

  it('dérive show_route=false quand itineraries est vide', async () => {
    wireChain({ data: { id: 'map-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { client_name: 'Bob', itineraries: [] }, 'map-1'), res)
    const updated = chain.update.mock.calls[0][0]
    expect(updated.show_route).toBe(false)
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
