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

// --- mocks ---
vi.mock('../../../api/_lib/supabase.js', () => {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq:     vi.fn(),
    order:  vi.fn(),
    single: vi.fn(),
    then:    undefined,
    catch:   undefined,
    finally: undefined,
  }
  return { supabaseAdmin: { from: vi.fn().mockReturnValue(chain), _chain: chain } }
})

const { supabaseAdmin } = await import('../../../api/_lib/supabase.js')
const chain = supabaseAdmin._chain

function wireChain(result) {
  const c = makeChain(result)
  Object.assign(chain, c)
  supabaseAdmin.from.mockReturnValue(chain)
}

const handler = (await import('../../../api/admin/poi.js')).default

function adminReq(method = 'GET', body = {}) {
  const token = jwt.sign({ role: 'admin' }, SECRET)
  return mockReq(method, body, {}, { authorization: `Bearer ${token}` })
}

describe('GET /api/admin/poi', () => {
  it('returns 401 without a valid token', async () => {
    const res = mockRes()
    await handler(mockReq('GET'), res)
    expect(res.statusCode).toBe(401)
  })

  it('returns the list of POIs', async () => {
    wireChain({ data: [{ id: '1', name: 'Plage du Gosier' }], error: null })
    const res = mockRes()
    await handler(adminReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: '1', name: 'Plage du Gosier' }])
  })

  it('returns 500 when supabase errors', async () => {
    wireChain({ data: null, error: { message: 'db error' } })
    const res = mockRes()
    await handler(adminReq('GET'), res)
    expect(res.statusCode).toBe(500)
  })
})

describe('POST /api/admin/poi', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { name: 'Test' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'missing_fields' })
  })

  it('creates a POI and returns 201', async () => {
    const poi = { id: 'abc', name: 'La Soufrière', category: 'randonnee', latitude: 16.04, longitude: -61.66 }
    wireChain({ data: poi, error: null })
    const res = mockRes()
    await handler(adminReq('POST', { name: 'La Soufrière', category: 'randonnee', latitude: 16.04, longitude: -61.66 }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ name: 'La Soufrière' })
  })
})

describe('Unsupported method', () => {
  it('returns 405 for PATCH', async () => {
    const res = mockRes()
    await handler(adminReq('PATCH'), res)
    expect(res.statusCode).toBe(405)
  })
})

describe('POST /api/admin/poi — champs restaurant (menu_url / flo_reco)', () => {
  it('insère menu_url et flo_reco quand ils sont fournis', async () => {
    wireChain({ data: { id: 'r1', name: 'Chez Marcel', category: 'restaurant', latitude: 16, longitude: -61 }, error: null })
    const res = mockRes()
    await handler(adminReq('POST', {
      name: 'Chez Marcel', category: 'restaurant', latitude: 16, longitude: -61,
      menu_url: 'https://cdn.example.com/menu.jpg', flo_reco: 'Incontournable !',
    }), res)
    expect(res.statusCode).toBe(201)
    const inserted = chain.insert.mock.calls[0][0][0]
    expect(inserted.menu_url).toBe('https://cdn.example.com/menu.jpg')
    expect(inserted.flo_reco).toBe('Incontournable !')
  })

  it('convertit les chaînes vides en null', async () => {
    wireChain({ data: { id: 'r2', name: 'Plage Test', category: 'plage', latitude: 16, longitude: -61 }, error: null })
    const res = mockRes()
    await handler(adminReq('POST', {
      name: 'Plage Test', category: 'plage', latitude: 16, longitude: -61,
      menu_url: '', flo_reco: '',
    }), res)
    expect(res.statusCode).toBe(201)
    const inserted = chain.insert.mock.calls[0][0][0]
    expect(inserted.menu_url).toBeNull()
    expect(inserted.flo_reco).toBeNull()
  })

  it('stocke null quand menu_url et flo_reco sont absents', async () => {
    wireChain({ data: { id: 'r3', name: 'Randonnée', category: 'randonnee', latitude: 16, longitude: -61 }, error: null })
    const res = mockRes()
    await handler(adminReq('POST', { name: 'Randonnée', category: 'randonnee', latitude: 16, longitude: -61 }), res)
    const inserted = chain.insert.mock.calls[0][0][0]
    expect(inserted.menu_url).toBeNull()
    expect(inserted.flo_reco).toBeNull()
  })
})
