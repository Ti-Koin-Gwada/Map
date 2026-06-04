import { requireAdmin } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'
import crypto from 'crypto'

const BUCKET = 'spot-images'
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

// Issues a short-lived, single-use signed upload URL so the browser can upload
// directly to Supabase Storage WITHOUT the anon key having write access to the
// bucket. Only an authenticated admin can obtain one. MIME type and size are
// still enforced at the bucket level (allowed_mime_types + file_size_limit).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req, res)) return

  const { ext } = req.body ?? {}
  const clean = String(ext ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!ALLOWED_EXT.has(clean)) {
    return res.status(400).json({ error: 'invalid_extension' })
  }

  const path = `${Date.now()}-${crypto.randomUUID()}.${clean}`

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error) return res.status(500).json({ error: error.message })

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

  return res.status(200).json({
    path,
    token:     data.token,
    publicUrl: pub.publicUrl,
  })
}
