import { requireAdmin } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('pois')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, description, details, category, address, latitude, longitude,
      instagram_url, image_url, tags, is_active } = req.body ?? {}

    if (!name || !category || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    const { data, error } = await supabaseAdmin
      .from('pois')
      .insert([{ name, description, details, category, address, latitude, longitude,
        instagram_url, image_url, tags, is_active: is_active ?? true }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
