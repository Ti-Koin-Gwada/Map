// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

const SECRET = 'test-jwt-secret'
beforeAll(() => {
  process.env.JWT_SECRET = SECRET
  process.env.VERCEL_ENV = 'production'
})

const handler = (await import('../../../api/admin/refresh.js')).default

function mockReq(cookieHeader = '') {
  return { method: 'POST', headers: { cookie: cookieHeader } }
}
function mockRes() {
  const r = { statusCode: 200, body: null, headers: {} }
  r.status    = (c) => { r.statusCode = c; return r }
  r.json      = (d) => { r.body = d; return r }
  r.setHeader = (k, v) => { r.headers[k] = v }
  return r
}

function makeRefreshCookie(overrides = {}) {
  const payload = { role: 'admin', type: 'refresh', ...overrides }
  const token = jwt.sign(payload, SECRET, { expiresIn: '7d' })
  return `tikoin_rt=${token}`
}

describe('POST /api/admin/refresh', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = mockRes()
    await handler({ method: 'GET', headers: {} }, res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 when no cookie is present', async () => {
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('no_session')
  })

  it('returns 401 for an invalid/tampered refresh token', async () => {
    const res = mockRes()
    await handler(mockReq('tikoin_rt=bad.token.here'), res)
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('invalid_session')
  })

  it('returns 401 when token type is not refresh', async () => {
    const token = jwt.sign({ role: 'admin' }, SECRET) // no type: 'refresh'
    const res = mockRes()
    await handler(mockReq(`tikoin_rt=${token}`), res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for an expired refresh token', async () => {
    const token = jwt.sign({ role: 'admin', type: 'refresh' }, SECRET, { expiresIn: '-1s' })
    const res = mockRes()
    await handler(mockReq(`tikoin_rt=${token}`), res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with a new short-lived access token for a valid cookie', async () => {
    const res = mockRes()
    await handler(mockReq(makeRefreshCookie()), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
    const payload = jwt.verify(res.body.token, SECRET)
    expect(payload.role).toBe('admin')
    expect(payload.type).toBeUndefined() // access token has no type field
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(900) // ≤15min
  })
})
