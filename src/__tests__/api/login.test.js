// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { _reset } from '../../../api/_lib/rate-limit.js'

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'secret123'
  process.env.JWT_SECRET     = 'test-jwt-secret'
  process.env.VERCEL_ENV     = 'production'
})

// Rate limiter keeps module-level state — reset between tests
beforeEach(() => _reset())

const handler = (await import('../../../api/admin/login.js')).default

let ipCounter = 0
function mockReq(method = 'POST', body = {}) {
  // Unique IP per request so independent tests don't share a rate-limit bucket
  return { method, body, headers: { 'x-forwarded-for': `10.0.0.${ipCounter++ % 250}` } }
}
function mockRes() {
  const r = { statusCode: 200, body: null, headers: {} }
  r.status    = (c) => { r.statusCode = c; return r }
  r.json      = (d) => { r.body = d; return r }
  r.setHeader = (k, v) => { r.headers[k] = v }
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

  it('returns 200 with a short-lived access token for correct password', async () => {
    const res = mockRes()
    await handler(mockReq('POST', { password: 'secret123' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
    const payload = jwt.verify(res.body.token, 'test-jwt-secret')
    expect(payload.role).toBe('admin')
    // Access token expires in ~15min (900s), not 7 days
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(900)
  })

  it('sets an HttpOnly refresh cookie on success', async () => {
    const res = mockRes()
    await handler(mockReq('POST', { password: 'secret123' }), res)
    const cookie = res.headers['Set-Cookie'] ?? ''
    expect(cookie).toContain('tikoin_rt=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/api/admin')
    // Verify the refresh token JWT is valid
    const raw = cookie.split(';')[0].replace('tikoin_rt=', '')
    const p   = jwt.verify(raw, 'test-jwt-secret')
    expect(p.role).toBe('admin')
    expect(p.type).toBe('refresh')
  })
})

describe('POST /api/admin/login — rate limiting', () => {
  it('returns 429 after 5 attempts from the same IP within the window', async () => {
    const ip = '203.0.113.7'
    const req = (body) => ({ method: 'POST', body, headers: { 'x-forwarded-for': ip } })

    // 5 allowed attempts (all wrong password → 401)
    for (let i = 0; i < 5; i++) {
      const res = mockRes()
      await handler(req({ password: 'wrong' }), res)
      expect(res.statusCode).toBe(401)
    }

    // 6th attempt is throttled, even with the CORRECT password
    const res = mockRes()
    await handler(req({ password: 'secret123' }), res)
    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({ error: 'too_many_attempts' })
    expect(res.headers['Retry-After']).toBeDefined()
  })
})
