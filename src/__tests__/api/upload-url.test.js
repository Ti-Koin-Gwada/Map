// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'
import { mockReq, mockRes } from './_helpers.js'

const SECRET = 'test-secret'
beforeAll(() => {
  process.env.JWT_SECRET = SECRET
  process.env.VITE_SUPABASE_URL         = 'http://localhost'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'key'
})

// --- mock Supabase storage ---
const createSignedUploadUrl = vi.fn()
const getPublicUrl          = vi.fn()
vi.mock('../../../api/_lib/supabase.js', () => ({
  supabaseAdmin: {
    storage: { from: vi.fn(() => ({ createSignedUploadUrl, getPublicUrl })) },
  },
}))

const handler = (await import('../../../api/admin/upload-url.js')).default

function adminReq(method = 'POST', body = {}) {
  const token = jwt.sign({ role: 'admin' }, SECRET)
  return mockReq(method, body, {}, { authorization: `Bearer ${token}` })
}

describe('POST /api/admin/upload-url', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = mockRes()
    await handler(adminReq('GET'), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 without a valid admin token', async () => {
    const res = mockRes()
    await handler(mockReq('POST', { ext: 'jpg' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for a disallowed extension', async () => {
    const res = mockRes()
    await handler(adminReq('POST', { ext: 'php' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('invalid_extension')
  })

  it('returns 400 when extension is missing', async () => {
    const res = mockRes()
    await handler(adminReq('POST', {}), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns a signed token, path and publicUrl for a valid request', async () => {
    createSignedUploadUrl.mockResolvedValue({ data: { token: 'signed-tok', path: 'p' }, error: null })
    getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/spot-images/x.jpg' } })

    const res = mockRes()
    await handler(adminReq('POST', { ext: 'JPG' }), res) // uppercase ext gets normalised
    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBe('signed-tok')
    expect(res.body.publicUrl).toBe('https://cdn/spot-images/x.jpg')
    expect(res.body.path).toMatch(/^\d+-[0-9a-f-]+\.jpg$/) // timestamp-uuid.jpg
  })

  it('returns 500 when Supabase fails to sign', async () => {
    createSignedUploadUrl.mockResolvedValue({ data: null, error: { message: 'storage down' } })
    const res = mockRes()
    await handler(adminReq('POST', { ext: 'png' }), res)
    expect(res.statusCode).toBe(500)
  })
})
