import { getRefreshToken, verifyRefreshToken, makeAccessToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const raw = getRefreshToken(req)
  if (!raw) return res.status(401).json({ error: 'no_session' })

  const payload = verifyRefreshToken(raw)
  if (!payload) return res.status(401).json({ error: 'invalid_session' })

  return res.status(200).json({ token: makeAccessToken() })
}
