// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'secret123'
  process.env.JWT_SECRET     = 'test-jwt-secret'
})

const handler = (await import('../../../api/admin/login.js')).default

function mockReq(method = 'POST', body = {}) {
  return { method, body }
}
function mockRes() {
  const r = { statusCode: 200, body: null }
  r.status = (c) => { r.statusCode = c; return r }
  r.json   = (d) => { r.body = d; return r }
  return r
}

describe('POST /api/admin/login', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = mockRes()
    await handler(mockReq('GET'), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 when password is missing', async () => {
    const res = mockRes()
    await handler(mockReq('POST', {}), res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'invalid_password' })
  })

  it('returns 401 for wrong password', async () => {
    const res = mockRes()
    await handler(mockReq('POST', { password: 'wrong' }), res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'invalid_password' })
  })

  it('returns 200 with a JWT token for correct password', async () => {
    const res = mockRes()
    await handler(mockReq('POST', { password: 'secret123' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
    const payload = jwt.verify(res.body.token, 'test-jwt-secret')
    expect(payload.role).toBe('admin')
  })
})
