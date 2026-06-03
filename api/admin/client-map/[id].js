import { requireAdmin } from '../../_lib/auth.js'
import { supabaseAdmin } from '../../_lib/supabase.js'

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const { id } = req.query

  if (req.method === 'PUT') {
    const { client_name, forfait, notes, is_active, pois, itineraries } = req.body ?? {}
    const show_route = (itineraries ?? []).some(it => it.steps?.length >= 2)

    const { data: map, error: mapErr } = await supabaseAdmin
      .from('client_maps')
      .update({ client_name, forfait, notes, is_active, show_route, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (mapErr) return res.status(500).json({ error: mapErr.message })

    // Atomically replace POIs and itineraries via RPC when content is provided
    if (pois !== undefined || itineraries !== undefined) {
      const { error: rpcErr } = await supabaseAdmin.rpc('replace_map_content', {
        p_map_id:       id,
        p_pois:         pois ?? [],
        p_itineraries:  itineraries ?? [],
      })
      if (rpcErr) return res.status(500).json({ error: rpcErr.message })
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
