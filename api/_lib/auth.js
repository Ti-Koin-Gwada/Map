import jwt from 'jsonwebtoken'

export function verifyAdmin(req) {
  const auth = req.headers.authorization ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export function requireAdmin(req, res) {
  const payload = verifyAdmin(req)
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'unauthorized' })
    return false
  }
  return true
}
