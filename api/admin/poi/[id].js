import { requireAdmin } from '../../_lib/auth.js'
import { supabaseAdmin } from '../../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const { id } = req.query

  if (req.method === 'PUT') {
    const { name, description, details, category, address, latitude, longitude,
      instagram_url, image_url, tags, is_active, menu_url, flo_reco } = req.body ?? {}
    const { data, error } = await supabaseAdmin
      .from('pois')
      .update({
        name, description, details, category, address, latitude, longitude,
        instagram_url, image_url, tags, is_active,
        menu_url: menu_url || null, flo_reco: flo_reco || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('pois').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
