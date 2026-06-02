import { nanoid } from 'nanoid'
import { requireAdmin } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('client_maps')
      .select(`
        *,
        client_map_pois (count)
      `)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { client_name, forfait, notes, show_route, pois = [] } = req.body ?? {}
    if (!client_name) return res.status(400).json({ error: 'missing_client_name' })

    const slug = nanoid(10)

    const { data: map, error: mapErr } = await supabaseAdmin
      .from('client_maps')
      .insert([{ slug, client_name, forfait, notes, show_route: !!show_route, is_active: true }])
      .select()
      .single()
    if (mapErr) return res.status(500).json({ error: mapErr.message })

    // Insérer les POIs sélectionnés
    if (pois.length > 0) {
      const links = pois.map((p, i) => ({
        client_map_id: map.id,
        poi_id:        p.poi_id,
        custom_note:   p.custom_note || null,
        display_order: i,
      }))
      const { error: linksErr } = await supabaseAdmin.from('client_map_pois').insert(links)
      if (linksErr) return res.status(500).json({ error: linksErr.message })
    }

    return res.status(201).json(map)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
