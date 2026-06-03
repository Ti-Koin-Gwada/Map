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

-- ── Storage : poi-images ──────────────────────────────────────
-- À créer dans l'interface Supabase Storage :
-- Bucket name : poi-images
-- Public : oui (CDN public)
-- Path format : /{poi_id}/{filename}

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
