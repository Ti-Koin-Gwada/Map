import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { slug } = req.query

  // 1. Récupérer la carte
  const { data: map, error: mapErr } = await supabase
    .from('client_maps')
    .select('id, slug, client_name, forfait, is_active')
    .eq('slug', slug)
    .single()

  if (mapErr || !map) return res.status(404).json({ error: 'not_found' })
  if (!map.is_active)  return res.status(403).json({ error: 'inactive' })

  // 2. Récupérer les POIs liés (avec les notes)
  const { data: links, error: linksErr } = await supabase
    .from('client_map_pois')
    .select(`
      custom_note,
      display_order,
      pois (
        id, name, description, details, category,
        address, latitude, longitude,
        instagram_url, image_url, tags,
        menu_url, flo_reco
      )
    `)
    .eq('client_map_id', map.id)
    .order('display_order', { ascending: true, nullsFirst: false })

  if (linksErr) return res.status(500).json({ error: 'server_error' })

  // 3. Construire la réponse — les notes sont indexées par poi_id
  const pois = []
  const notes = {}

  for (const link of links ?? []) {
    if (!link.pois) continue
    pois.push(link.pois)
    if (link.custom_note) notes[link.pois.id] = link.custom_note
  }

  return res.status(200).json({
    client_name: map.client_name,
    forfait:     map.forfait,
    slug:        map.slug,
    pois,
    notes,
  })
}
