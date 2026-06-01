// @vitest-environment node
import { vi } from 'vitest'

export function mockReq(method = 'GET', body = {}, query = {}, headers = {}) {
  return { method, body, query, headers }
}

export function mockRes() {
  const r = { statusCode: 200, body: null, ended: false }
  r.status = (c) => { r.statusCode = c; return r }
  r.json   = (d) => { r.body = d; return r }
  r.end    = ()  => { r.ended = true; return r }
  return r
}

/**
 * Returns a Supabase-like chainable builder that resolves to `result`
 * at any awaited point in the chain.
 */
export function makeChain(result) {
  const self = {}
  self.select = vi.fn().mockReturnValue(self)
  self.insert = vi.fn().mockReturnValue(self)
  self.update = vi.fn().mockReturnValue(self)
  self.delete = vi.fn().mockReturnValue(self)
  self.eq     = vi.fn().mockReturnValue(self)
  self.order  = vi.fn().mockReturnValue(self)
  self.single = vi.fn().mockResolvedValue(result)
  // Make builder thenable so `await chain`, `await chain.eq(...)` etc. resolve
  self.then    = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  self.catch   = (fn) => Promise.resolve(result).catch(fn)
  self.finally = (fn) => Promise.resolve(result).finally(fn)
  return self
}
