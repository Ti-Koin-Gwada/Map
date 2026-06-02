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

const handler = (await import('../../../api/admin/poi/[id].js')).default

function adminReq(method = 'PUT', body = {}, id = 'poi-1') {
  const token = jwt.sign({ role: 'admin' }, SECRET)
  return mockReq(method, body, { id }, { authorization: `Bearer ${token}` })
}

describe('PUT /api/admin/poi/:id', () => {
  it('returns 401 without token', async () => {
    const res = mockRes()
    await handler(mockReq('PUT', {}, { id: '1' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('updates a POI and returns 200', async () => {
    const updated = { id: 'poi-1', name: 'Updated Name', updated_at: new Date().toISOString() }
    wireChain({ data: updated, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { name: 'Updated Name' }, 'poi-1'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ id: 'poi-1' })
  })

  it('returns 500 when supabase errors on update', async () => {
    wireChain({ data: null, error: { message: 'constraint violation' } })
    const res = mockRes()
    await handler(adminReq('PUT', { name: 'x' }, 'poi-1'), res)
    expect(res.statusCode).toBe(500)
  })
})

describe('PUT /api/admin/poi/:id — whitelist et champs restaurant', () => {
  it('passe menu_url et flo_reco au UPDATE', async () => {
    wireChain({ data: { id: 'poi-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { menu_url: 'https://cdn.example.com/menu.jpg', flo_reco: 'Top !' }, 'poi-1'), res)
    expect(res.statusCode).toBe(200)
    const updated = chain.update.mock.calls[0][0]
    expect(updated.menu_url).toBe('https://cdn.example.com/menu.jpg')
    expect(updated.flo_reco).toBe('Top !')
  })

  it('convertit les chaînes vides en null', async () => {
    wireChain({ data: { id: 'poi-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { name: 'X', menu_url: '', flo_reco: '' }, 'poi-1'), res)
    const updated = chain.update.mock.calls[0][0]
    expect(updated.menu_url).toBeNull()
    expect(updated.flo_reco).toBeNull()
  })

  it("n'envoie pas de champs arbitraires à Supabase", async () => {
    wireChain({ data: { id: 'poi-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { name: 'X', is_admin: true, __proto__: {}, password: 'secret' }, 'poi-1'), res)
    const updated = chain.update.mock.calls[0][0]
    expect(updated).not.toHaveProperty('is_admin')
    expect(updated).not.toHaveProperty('password')
  })

  it('inclut updated_at dans le UPDATE', async () => {
    wireChain({ data: { id: 'poi-1' }, error: null })
    const res = mockRes()
    await handler(adminReq('PUT', { name: 'Test' }, 'poi-1'), res)
    const updated = chain.update.mock.calls[0][0]
    expect(updated).toHaveProperty('updated_at')
    expect(typeof updated.updated_at).toBe('string')
  })
})

describe('DELETE /api/admin/poi/:id', () => {
  it('returns 204 on successful delete', async () => {
    wireChain({ error: null })
    const res = mockRes()
    await handler(adminReq('DELETE', {}, 'poi-1'), res)
    expect(res.statusCode).toBe(204)
    expect(res.ended).toBe(true)
  })

  it('returns 405 for unsupported methods', async () => {
    const res = mockRes()
    await handler(adminReq('GET', {}, 'poi-1'), res)
    expect(res.statusCode).toBe(405)
  })
})
