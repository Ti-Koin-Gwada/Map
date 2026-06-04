import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const SECRET = () => (process.env.JWT_SECRET ?? '').trim()

// Constant-time string comparison. Hashing both sides to a fixed length first
// keeps timingSafeEqual happy (it requires equal-length buffers) and also avoids
// leaking the secret's length through the comparison.
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}
const COOKIE = 'tikoin_rt'
const ACCESS_TTL  = '15m'
const REFRESH_TTL = '7d'

// ── Token generation ───────────────────────────────────────────

export function makeAccessToken() {
  return jwt.sign({ role: 'admin' }, SECRET(), { expiresIn: ACCESS_TTL })
}

export function makeRefreshToken() {
  return jwt.sign({ role: 'admin', type: 'refresh' }, SECRET(), { expiresIn: REFRESH_TTL })
}

// ── Verification ───────────────────────────────────────────────

export function verifyAdmin(req) {
  const auth  = req.headers.authorization ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    const p = jwt.verify(token, SECRET())
    return p.role === 'admin' ? p : null
  } catch { return null }
}

export function requireAdmin(req, res) {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return false
  }
  return true
}

// ── Cookie helpers ─────────────────────────────────────────────

export function setRefreshCookie(res, token) {
  const secure = process.env.VERCEL_ENV === 'production'
  const cookie = [
    `${COOKIE}=${token}`,
    `HttpOnly`,
    `SameSite=Strict`,
    `Path=/api/admin`,
    `Max-Age=${7 * 24 * 3600}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ')
  res.setHeader('Set-Cookie', cookie)
}

export function clearRefreshCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0`)
}

export function getRefreshToken(req) {
  const raw = req.headers.cookie ?? ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k.trim() === COOKIE) return v.join('=')
  }
  return null
}

export function verifyRefreshToken(token) {
  try {
    const p = jwt.verify(token, SECRET())
    return p.role === 'admin' && p.type === 'refresh' ? p : null
  } catch { return null }
}
