# Ti Koin Gwada

Cartes Guadeloupe personnalisées : Flo crée des cartes privées, chaque client
reçoit un lien unique `/map/:slug` n'affichant que ses spots sélectionnés.

## Commands
- `npm run dev` — Vite dev server
- `npm run test` — vitest (run once) · `npm run test:watch`
- `npm run lint` — eslint
- `npm run ci` — lint + test + build (= Vercel `buildCommand`)
- `vercel --prod` — déploiement production

## Architecture
- `src/pages/ClientMapPage.jsx` — carte publique `/map/:slug`
- `src/pages/AdminPage.jsx` — admin `/admin/*` (auth JWT)
- `src/components/{map,admin,poi,ui}/` — UI par domaine
- `src/hooks/` — useClientMap, usePois, useClientMaps, useAdmin, useGeocoder
- `src/lib/constants.js` — catégories, tags, forfaits, centre/zoom carte
- `api/map/[slug].js` — route publique GET
- `api/admin/*` — CRUD serverless, auth requise
- `api/_lib/` — `auth.js`, `supabase.js` (service_role), `rate-limit.js`
- `supabase/migrations.sql` — pois, client_maps, client_map_pois (RLS service_role)

## Gotchas
- **Carte = Google Maps** (`@vis.gl/react-google-maps`), pas Mapbox. Sans clé,
  `MapView` bascule sur un fallback SVG (`GuadeloupeSVG`).
- Front = clé Supabase *anon* ; les routes `api/` utilisent *service_role*
  (jamais exposée au bundle client).
- Auth admin = cookie **HttpOnly** `Set-Cookie` (`Path=/api/admin`), JWT
  access + refresh (`api/_lib/auth.js`). Pas de bearer token côté client.
- SPA rewrite : tout sauf `/api/*` → `index.html` (`vercel.json`).

## Env (voir `.env.example`)
- Local : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_GOOGLE_MAPS_KEY`, `VITE_GOOGLE_MAP_ID`
- Vercel only : `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `JWT_SECRET`
