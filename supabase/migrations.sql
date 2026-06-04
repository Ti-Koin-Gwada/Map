-- ══════════════════════════════════════════════════════════════
-- Ti Koin Gwada — Migrations Supabase
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- ══════════════════════════════════════════════════════════════

-- ── Table : pois ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pois (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  details       TEXT,
  access        TEXT,
  duration      TEXT,
  difficulty    TEXT,
  category      TEXT NOT NULL CHECK (category IN (
    'plage', 'restaurant', 'randonnee', 'activite', 'spot_cache'
  )),
  address       TEXT,
  latitude      FLOAT8 NOT NULL,
  longitude     FLOAT8 NOT NULL,
  instagram_url TEXT,
  image_url     TEXT,
  tags          TEXT[],
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pois
  USING (auth.role() = 'service_role');

-- ── Table : client_maps ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_maps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  client_name   TEXT NOT NULL,
  forfait       TEXT CHECK (forfait IN ('essentiel', 'personnalise')),
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON client_maps
  USING (auth.role() = 'service_role');

-- ── Table : client_map_pois ───────────────────────────────────
CREATE TABLE IF NOT EXISTS client_map_pois (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_map_id  UUID NOT NULL REFERENCES client_maps(id) ON DELETE CASCADE,
  poi_id         UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  custom_note    TEXT,
  display_order  INTEGER,
  UNIQUE(client_map_id, poi_id)
);

ALTER TABLE client_map_pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON client_map_pois
  USING (auth.role() = 'service_role');

-- ── Storage : spot-images ─────────────────────────────────────
-- Bucket : spot-images
--   public            : true (lecture CDN)
--   file_size_limit   : 5242880 (5 Mo)
--   allowed_mime_types: image/jpeg, image/png, image/webp, image/gif
--
-- Sécurité écriture : pas de policy INSERT/DELETE pour anon. Les uploads
-- passent par des signed upload URLs émises côté serveur (service_role) via
-- /api/admin/upload-url, qui bypassent les RLS. Seul le SELECT public reste.
DROP POLICY IF EXISTS "Admin upload spot-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete spot-images" ON storage.objects;
CREATE POLICY "Public read spot-images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'spot-images');

-- ── Colonnes restaurant : menu + reco de Flo ────────────────
ALTER TABLE pois ADD COLUMN IF NOT EXISTS menu_url  TEXT;
ALTER TABLE pois ADD COLUMN IF NOT EXISTS flo_reco  TEXT;

-- ── Tracé de route sur les cartes clients ───────────────────
-- Colonne appliquée en prod via execute_sql (MCP) — IF NOT EXISTS protège les réexécutions
ALTER TABLE client_maps ADD COLUMN IF NOT EXISTS show_route BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Trigger : updated_at automatique ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pois_updated_at
  BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER client_maps_updated_at
  BEFORE UPDATE ON client_maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Itinéraires multiples par carte client ────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_map_id  UUID NOT NULL REFERENCES client_maps(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'Itinéraire',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON itineraries
  USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS itinerary_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id  UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  poi_id        UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  step_order    INTEGER NOT NULL,
  UNIQUE(itinerary_id, poi_id)
);

ALTER TABLE itinerary_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON itinerary_steps
  USING (auth.role() = 'service_role');

-- ── RPC : remplacement atomique du contenu d'une carte ────────
CREATE OR REPLACE FUNCTION replace_map_content(
  p_map_id uuid,
  p_pois jsonb,
  p_itineraries jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_itin jsonb;
  v_itin_id uuid;
  v_step text;
  v_step_order int;
BEGIN
  DELETE FROM client_map_pois WHERE client_map_id = p_map_id;
  DELETE FROM itineraries WHERE client_map_id = p_map_id;

  IF jsonb_array_length(p_pois) > 0 THEN
    INSERT INTO client_map_pois (client_map_id, poi_id, custom_note, display_order)
    SELECT
      p_map_id,
      (elem->>'poi_id')::uuid,
      NULLIF(elem->>'custom_note', ''),
      NULL
    FROM jsonb_array_elements(p_pois) AS elem;
  END IF;

  FOR v_itin IN SELECT value FROM jsonb_array_elements(p_itineraries) LOOP
    INSERT INTO itineraries (client_map_id, name)
    VALUES (p_map_id, v_itin->>'name')
    RETURNING id INTO v_itin_id;

    v_step_order := 0;
    FOR v_step IN SELECT value FROM jsonb_array_elements_text(v_itin->'steps') LOOP
      INSERT INTO itinerary_steps (itinerary_id, poi_id, step_order)
      VALUES (v_itin_id, v_step::uuid, v_step_order);
      v_step_order := v_step_order + 1;
    END LOOP;
  END LOOP;
END;
$$;
