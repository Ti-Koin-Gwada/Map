import { nanoid } from 'nanoid'
import { requireAdmin } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('client_maps')
      .select(`*, client_map_pois (count)`)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { client_name, forfait, notes, pois = [], itineraries = [] } = req.body ?? {}
    if (!client_name) return res.status(400).json({ error: 'missing_client_name' })

    const slug = nanoid(10)
    const show_route = itineraries.some(it => it.steps?.length >= 2)

    const { data: map, error: mapErr } = await supabaseAdmin
      .from('client_maps')
      .insert([{ slug, client_name, forfait, notes, show_route, is_active: true }])
      .select()
      .single()
    if (mapErr) return res.status(500).json({ error: mapErr.message })

    if (pois.length > 0) {
      const links = pois.map(p => ({
        client_map_id: map.id,
        poi_id:        p.poi_id,
        custom_note:   p.custom_note || null,
        display_order: null,
      }))
      const { error: linksErr } = await supabaseAdmin.from('client_map_pois').insert(links)
      if (linksErr) return res.status(500).json({ error: linksErr.message })
    }

    for (const it of itineraries) {
      if (!it.steps?.length) continue
      const { data: itin, error: itinErr } = await supabaseAdmin
        .from('itineraries')
        .insert([{ client_map_id: map.id, name: it.name || 'Itinéraire' }])
        .select()
        .single()
      if (itinErr) return res.status(500).json({ error: itinErr.message })

      const steps = it.steps.map((poi_id, i) => ({ itinerary_id: itin.id, poi_id, step_order: i }))
      const { error: stepsErr } = await supabaseAdmin.from('itinerary_steps').insert(steps)
      if (stepsErr) return res.status(500).json({ error: stepsErr.message })
    }

    return res.status(201).json(map)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
