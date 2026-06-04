// Best-effort in-memory rate limiter.
//
// NOTE: serverless functions are stateless across cold starts and can run on
// many instances in parallel, so this only throttles bursts hitting the same
// warm instance. It's a cheap first line of defence against brute-force on the
// single-admin login. For production-grade, distributed limiting, back this
// with Vercel KV / Upstash Redis (same interface, swap the Map for a store).

const buckets = new Map() // key -> { count, resetAt }

export function rateLimit(key, { max = 5, windowMs = 60_000 } = {}) {
  const now = Date.now()

  // Opportunistic cleanup so the Map doesn't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k)
  }

  const rec = buckets.get(key)
  if (!rec || now > rec.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfter: 0 }
  }

  rec.count += 1
  if (rec.count > max) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((rec.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: max - rec.count, retryAfter: 0 }
}

export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for']
  if (xff) return xff.split(',')[0].trim()
  return req.headers?.['x-real-ip'] || 'unknown'
}

// Test helper — reset internal state between tests
export function _reset() { buckets.clear() }
