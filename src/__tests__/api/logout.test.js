// @vitest-environment node
import { describe, it, expect } from 'vitest'

const handler = (await import('../../../api/admin/logout.js')).default

function mockReq(method = 'POST') {
  return { method }
}
function mockRes() {
  const r = { statusCode: 200, body: null, headers: {} }
  r.status    = (c) => { r.statusCode = c; return r }
  r.json      = (d) => { r.body = d; return r }
  r.setHeader = (k, v) => { r.headers[k] = v }
  return r
}

describe('POST /api/admin/logout', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = mockRes()
    await handler(mockReq('GET'), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 200 and clears the refresh cookie', async () => {
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    const cookie = res.headers['Set-Cookie'] ?? ''
    expect(cookie).toContain('tikoin_rt=')
    expect(cookie).toContain('Max-Age=0')
    expect(cookie).toContain('HttpOnly')
  })
})
