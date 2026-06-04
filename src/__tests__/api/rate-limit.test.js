// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { rateLimit, clientIp, _reset } from '../../../api/_lib/rate-limit.js'

beforeEach(() => _reset())
afterEach(() => vi.useRealTimers())

describe('rateLimit', () => {
  it('allows up to `max` requests, then blocks', () => {
    const opts = { max: 3, windowMs: 60_000 }
    expect(rateLimit('a', opts).ok).toBe(true)
    expect(rateLimit('a', opts).ok).toBe(true)
    expect(rateLimit('a', opts).ok).toBe(true)
    const blocked = rateLimit('a', opts)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('tracks keys independently', () => {
    const opts = { max: 1, windowMs: 60_000 }
    expect(rateLimit('a', opts).ok).toBe(true)
    expect(rateLimit('a', opts).ok).toBe(false)
    expect(rateLimit('b', opts).ok).toBe(true) // different key unaffected
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    const opts = { max: 1, windowMs: 1000 }
    expect(rateLimit('a', opts).ok).toBe(true)
    expect(rateLimit('a', opts).ok).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(rateLimit('a', opts).ok).toBe(true) // window reset
  })

  it('reports decreasing remaining count', () => {
    const opts = { max: 3, windowMs: 60_000 }
    expect(rateLimit('a', opts).remaining).toBe(2)
    expect(rateLimit('a', opts).remaining).toBe(1)
    expect(rateLimit('a', opts).remaining).toBe(0)
  })
})

describe('clientIp', () => {
  it('extracts the first IP from x-forwarded-for', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    expect(clientIp({ headers: { 'x-real-ip': '9.9.9.9' } })).toBe('9.9.9.9')
  })

  it('returns "unknown" when no IP headers are present', () => {
    expect(clientIp({ headers: {} })).toBe('unknown')
  })
})
