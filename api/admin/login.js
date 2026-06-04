import { makeAccessToken, makeRefreshToken, setRefreshCookie, safeEqual } from '../_lib/auth.js'
import { rateLimit, clientIp } from '../_lib/rate-limit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Throttle brute-force: 5 attempts / minute / IP
  const { ok, retryAfter } = rateLimit(`login:${clientIp(req)}`, { max: 5, windowMs: 60_000 })
  if (!ok) {
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({ error: 'too_many_attempts' })
  }

  const { password } = req.body ?? {}
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

  if (!password || !safeEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'invalid_password' })
  }

  setRefreshCookie(res, makeRefreshToken())
  return res.status(200).json({ token: makeAccessToken() })
}
