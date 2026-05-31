import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body ?? {}
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'invalid_password' })
  }

  const token = jwt.sign(
    { role: 'admin' },
    (process.env.JWT_SECRET ?? '').trim(),
    { expiresIn: '24h' },
  )

  return res.status(200).json({ token })
}
