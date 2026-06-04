// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

const SECRET = 'test-jwt-secret'
beforeAll(() => { process.env.JWT_SECRET = SECRET })

// Dynamic import after env is set
const { verifyAdmin, requireAdmin, safeEqual } = await import('../../../api/_lib/auth.js')

function mockReq(authHeader = '') {
  return { headers: { authorization: authHeader } }
}

function mockRes() {
  const r = { statusCode: 200, body: null }
  r.status = (c) => { r.statusCode = c; return r }
  r.json   = (d) => { r.body = d; return r }
  return r
}

describe('verifyAdmin', () => {
  it('returns null when no Authorization header', () => {
    expect(verifyAdmin(mockReq())).toBeNull()
  })

  it('returns null for an invalid token', () => {
    expect(verifyAdmin(mockReq('Bearer bad.token.here'))).toBeNull()
  })

  it('returns null for a token signed with a different secret', () => {
    const bad = jwt.sign({ role: 'admin' }, 'wrong-secret')
    expect(verifyAdmin(mockReq(`Bearer ${bad}`))).toBeNull()
  })

  it('returns the payload for a valid admin token', () => {
    const token = jwt.sign({ role: 'admin' }, SECRET)
    const payload = verifyAdmin(mockReq(`Bearer ${token}`))
    expect(payload).not.toBeNull()
    expect(payload.role).toBe('admin')
  })

  it('returns null for a token with a non-admin role', () => {
    const token = jwt.sign({ role: 'user' }, SECRET)
    expect(verifyAdmin(mockReq(`Bearer ${token}`))).toBeNull()
  })
})

describe('requireAdmin', () => {
  it('sends 401 and returns false when no token', () => {
    const req = mockReq()
    const res = mockRes()
    const result = requireAdmin(req, res)
    expect(result).toBe(false)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('sends 401 and returns false when token role is not admin', () => {
    const token = jwt.sign({ role: 'user' }, SECRET)
    const req = mockReq(`Bearer ${token}`)
    const res = mockRes()
    expect(requireAdmin(req, res)).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('returns true and does not touch res when admin token is valid', () => {
    const token = jwt.sign({ role: 'admin' }, SECRET)
    const req = mockReq(`Bearer ${token}`)
    const res = mockRes()
    expect(requireAdmin(req, res)).toBe(true)
    expect(res.statusCode).toBe(200) // untouched
  })
})

describe('safeEqual (constant-time comparison)', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('coucoucestflo', 'coucoucestflo')).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(safeEqual('coucoucestflo', 'wrong')).toBe(false)
  })

  it('returns false for different-length strings without throwing', () => {
    // Hashing both sides to a fixed length avoids the timingSafeEqual length error
    expect(() => safeEqual('a', 'a-much-longer-password')).not.toThrow()
    expect(safeEqual('a', 'a-much-longer-password')).toBe(false)
  })

  it('handles empty strings', () => {
    expect(safeEqual('', '')).toBe(true)
    expect(safeEqual('', 'x')).toBe(false)
  })
})
