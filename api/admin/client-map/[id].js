import { requireAdmin } from '../../_lib/auth.js'
import { supabaseAdmin } from '../../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const { id } = req.query

  if (req.method === 'PUT') {
    const { client_name, forfait, notes, is_active, pois } = req.body ?? {}

    const { data: map, error: mapErr } = await supabaseAdmin
      .from('client_maps')
      .update({ client_name, forfait, notes, is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (mapErr) return res.status(500).json({ error: mapErr.message })

    // Remplacer les POIs si fournis
    if (pois) {
      await supabaseAdmin.from('client_map_pois').delete().eq('client_map_id', id)
      if (pois.length > 0) {
        const links = pois.map((p, i) => ({
          client_map_id: id,
          poi_id:        p.poi_id,
          custom_note:   p.custom_note || null,
          display_order: i,
        }))
        const { error: linksErr } = await supabaseAdmin.from('client_map_pois').insert(links)
        if (linksErr) return res.status(500).json({ error: linksErr.message })
      }
    }

    return res.status(200).json(map)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('client_maps').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
