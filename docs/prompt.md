# Ti Koin Gwada — Outil de Génération de Cartes Personnalisées
> Spécification complète du projet pour Claude Code

---

## 1. Vision & Objectif

**Ti Koin Gwada** est un outil professionnel permettant à Flo (@ti.koin.gwada) de créer des cartes de Guadeloupe personnalisées pour ses clients. Flo gère une base complète de points d'intérêt, puis sélectionne manuellement les spots adaptés à chaque client pour générer une carte privée et partageable par lien unique.

### Flux principal

```
[Flo ajoute ses spots]  →  [Client demande un planning]  →  [Flo sélectionne les spots]
        ↓                                                              ↓
  Base complète                                          [Génération d'une carte client]
  (admin only)                                                         ↓
                                                         [Lien unique envoyé au client]
                                                                       ↓
                                                           [Client consulte SA carte]
                                                            (aucun autre spot visible)
```

### Deux types d'utilisateurs

| Rôle | Accès | Capacités |
|---|---|---|
| **Flo (admin)** | `/admin` — mot de passe | Gérer tous les POIs, créer/modifier/désactiver des cartes clients |
| **Client** | `/map/:slug` — URL secrète | Consulter uniquement les POIs de sa carte |

---

## 2. Stack Technique

| Couche | Choix |
|---|---|
| Framework | **React 18** + Vite |
| Routing | **React Router v6** |
| Carte | **Mapbox GL JS** (via `react-map-gl`) |
| Base de données | **Supabase** (PostgreSQL + Storage pour images) |
| Styling | **Tailwind CSS** + CSS custom (thème Botanical Fresh) |
| Déploiement | **Vercel** |
| Auth admin | JWT signé via Vercel API Route (mot de passe en env var) |
| Géocodage | **Mapbox Geocoding API** (adresse → coordonnées GPS) |
| Génération slug | `nanoid` — URL courte, unique, non-devinable |

---

## 3. Structure du Projet

```
ti-koin-gwada/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.jsx             # Carte Mapbox réutilisable (admin + client)
│   │   │   ├── MarkerCluster.jsx       # Clustering des markers
│   │   │   ├── MarkerPin.jsx           # Pin custom par catégorie
│   │   │   └── MapFilters.jsx          # Filtre catégorie (admin uniquement)
│   │   ├── poi/
│   │   │   ├── PoiDrawer.jsx           # Fiche détail d'un POI (lecture)
│   │   │   └── InstagramEmbed.jsx      # Embed iframe + fallback lien
│   │   ├── admin/
│   │   │   ├── AdminLogin.jsx          # Page connexion admin
│   │   │   ├── AdminLayout.jsx         # Layout avec sidebar admin
│   │   │   ├── PoiManager.jsx          # Carte admin + liste POIs
│   │   │   ├── PoiForm.jsx             # Formulaire ajout / édition POI
│   │   │   ├── GeocoderInput.jsx       # Input adresse avec autocomplete
│   │   │   ├── MapSelector.jsx         # Mode sélection multi-POIs pour carte client
│   │   │   ├── ClientMapList.jsx       # Liste de toutes les cartes clients
│   │   │   └── ClientMapForm.jsx       # Formulaire création / édition carte client
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       └── Chip.jsx                # Chip sélectionnable (catégorie / POI)
│   ├── hooks/
│   │   ├── usePois.js                  # Fetch tous les POIs (admin)
│   │   ├── useClientMap.js             # Fetch carte client par slug
│   │   ├── useAdmin.js                 # Auth admin state + token
│   │   └── useGeocoder.js              # Appel Mapbox Geocoding
│   ├── lib/
│   │   ├── supabase.js                 # Client Supabase
│   │   └── constants.js               # Catégories, couleurs, design tokens
│   ├── pages/
│   │   ├── ClientMapPage.jsx           # Page publique /map/:slug
│   │   └── AdminPage.jsx              # Page admin /admin/*
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                      # CSS variables Botanical Fresh
├── api/
│   ├── admin/
│   │   ├── login.js                   # POST — auth, retourne JWT
│   │   ├── poi.js                     # POST — créer POI
│   │   ├── poi/[id].js                # PUT / DELETE — modifier / supprimer POI
│   │   ├── client-map.js              # POST — créer carte client
│   │   └── client-map/[id].js         # PUT / DELETE — modifier / désactiver carte
│   └── map/
│       └── [slug].js                  # GET public — retourne les POIs d'une carte par slug
├── .env.local
├── .env.example
├── vercel.json
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Modèle de Données (Supabase)

### Table `pois` — Base complète des points d'intérêt (admin only)

```sql
CREATE TABLE pois (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,                          -- description publique visible par le client
  details       TEXT,                          -- infos pratiques : accès, durée, difficulté...
  category      TEXT NOT NULL CHECK (category IN (
    'plage', 'restaurant', 'randonnee', 'activite', 'spot_cache'
  )),
  address       TEXT,
  latitude      FLOAT8 NOT NULL,
  longitude     FLOAT8 NOT NULL,
  instagram_url TEXT,
  image_url     TEXT,                          -- Supabase Storage
  tags          TEXT[],                        -- ex: ['sportif', 'famille', 'insolite']
  is_active     BOOLEAN DEFAULT true,          -- désactivé = masqué partout
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : aucune lecture publique directe — tout passe par les API Routes
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pois
  USING (auth.role() = 'service_role');
```

### Table `client_maps` — Cartes générées pour les clients

```sql
CREATE TABLE client_maps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,          -- ex: "martin-famille-juin25" (nanoid)
  client_name   TEXT NOT NULL,                 -- "Famille Martin"
  forfait       TEXT CHECK (forfait IN ('essentiel', 'personnalise')),
  notes         TEXT,                          -- notes internes de Flo (non visibles client)
  is_active     BOOLEAN DEFAULT true,          -- false = lien désactivé
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : aucun accès direct — tout via API Routes
ALTER TABLE client_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON client_maps
  USING (auth.role() = 'service_role');
```

### Table `client_map_pois` — Association carte ↔ POIs sélectionnés

```sql
CREATE TABLE client_map_pois (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_map_id  UUID NOT NULL REFERENCES client_maps(id) ON DELETE CASCADE,
  poi_id         UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  custom_note    TEXT,          -- note spécifique Flo pour CE client sur CE spot
  display_order  INTEGER,       -- ordre d'affichage suggéré (optionnel)
  UNIQUE(client_map_id, poi_id)
);

ALTER TABLE client_map_pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON client_map_pois
  USING (auth.role() = 'service_role');
```

### Supabase Storage

```
Bucket : poi-images (public CDN)
Path   : /{poi_id}/{filename}
```

---

## 5. API Routes Vercel

### Routes publiques (sans auth)

```
GET  /api/map/:slug
```
- Vérifie que `client_maps.is_active = true` pour ce slug
- Retourne : infos de la carte + liste des POIs sélectionnés (avec `custom_note`)
- Ne retourne **jamais** les POIs non sélectionnés
- Retourne 404 si slug inconnu, 403 si carte désactivée

### Routes admin (JWT requis dans `Authorization: Bearer <token>`)

```
POST   /api/admin/login              # Vérif mot de passe → JWT 24h
POST   /api/admin/poi                # Créer un POI
PUT    /api/admin/poi/:id            # Modifier un POI
DELETE /api/admin/poi/:id            # Supprimer un POI

POST   /api/admin/client-map         # Créer une carte client (génère le slug)
PUT    /api/admin/client-map/:id     # Modifier carte (POIs sélectionnés, notes, statut)
DELETE /api/admin/client-map/:id     # Désactiver / supprimer une carte
```

> Toutes les routes admin vérifient le JWT **avant** toute opération Supabase.
> Le `SUPABASE_SERVICE_ROLE_KEY` n'est jamais exposé côté client.

---

## 6. Variables d'Environnement

```bash
# .env.local (dev)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MAPBOX_TOKEN=pk.eyJ...

# Vercel env (prod) — jamais côté client
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=mot_de_passe_flo
JWT_SECRET=chaine_aleatoire_longue_min_32_chars
```

---

## 7. Identité Visuelle — Thème Botanical Fresh

> Thème choisi : **03 — Botanical Fresh**
> Blanc immaculé, vert végétation profond, typographie organique serif.

### Palette CSS Variables

```css
/* src/index.css */
:root {
  --color-bg:           #FAFAF7;
  --color-surface:      #FFFFFF;
  --color-border:       #E8EDE6;
  --color-border-mid:   #D0DDD0;

  --color-forest:       #2D5A3D;   /* CTA, accents primaires */
  --color-forest-dark:  #1A2E20;   /* Titres */
  --color-forest-mid:   #4A8A5A;   /* Hover, pins carte */
  --color-vegetation:   #90B898;   /* Fond carte */
  --color-mist:         #C8DEC8;   /* Fond carte clair */

  --color-text-primary:   #1A2E20;
  --color-text-secondary: #5A7A60;
  --color-text-muted:     #8AA890;

  /* Catégories */
  --color-plage:       #0EA5E9;
  --color-restaurant:  #F97316;
  --color-randonnee:   #22C55E;
  --color-activite:    #A855F7;
  --color-spot:        #EAB308;
}
```

### Typographie

```
Fraunces (Google Fonts) — serif organique, italique expressif
  → Logo, titres POI, compteurs clés

DM Sans (Google Fonts) — sans-serif propre
  → Navigation, labels, boutons, corps de texte

Import HTML :
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300;1,9..144,700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

### Catégories & Tokens

```js
// src/lib/constants.js
export const CATEGORIES = {
  plage:      { label: 'Plages & Mer',              color: '#0EA5E9', bgLight: '#E0F2FE', icon: '🏖️' },
  restaurant: { label: 'Restaurants & Bars',         color: '#F97316', bgLight: '#FFF0E6', icon: '🍽️' },
  randonnee:  { label: 'Randonnées & Nature',        color: '#22C55E', bgLight: '#DCFCE7', icon: '🌿' },
  activite:   { label: 'Activités & Expériences',    color: '#A855F7', bgLight: '#F3E8FF', icon: '🎯' },
  spot_cache: { label: 'Spots Cachés & Insolites',   color: '#EAB308', bgLight: '#FEF9C3', icon: '✨' },
}

export const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12'
```

---

## 8. Fonctionnalités Détaillées

### 8.1 Page Client `/map/:slug`

**Comportement :**
- Au chargement : appel `GET /api/map/:slug`
- Si slug invalide → page 404 élégante ("Cette carte n'existe pas")
- Si carte désactivée → page 403 ("Cette carte n'est plus disponible")
- Sinon : affichage de la carte avec **uniquement** les POIs sélectionnés

**Interface :**
```
┌────────────────────────────────────────────────────┐
│  Ti Koin Gwada    Carte de [Prénom client]          │  ← navbar sobre
├────────────────────────────────────────────────────┤
│                                                    │
│              [ CARTE MAPBOX ]                      │  ← plein écran
│         pins des POIs sélectionnés                 │
│                                                    │
└────────────────────────────────────────────────────┘
```
- Clic sur un pin → PoiDrawer (fiche complète)
- Pas de filtres catégorie (la sélection est déjà faite par Flo)
- Pas de barre de recherche
- Bouton "Y aller" → Google Maps
- Bouton "Voir sur Instagram" si lien disponible
- Si `custom_note` présente : affichée dans un bloc distinct "Note de Flo 💬"
- Carte responsive, mobile-first

### 8.2 Interface Admin `/admin`

#### Login
- Formulaire mot de passe simple
- Appel `POST /api/admin/login` → JWT stocké en `sessionStorage`
- Expiration 24h

#### Layout Admin
```
┌─────────────────┬──────────────────────────────────┐
│   SIDEBAR       │                                  │
│                 │         CONTENU PRINCIPAL        │
│  📍 Mes spots   │                                  │
│  🗺️ Mes cartes  │                                  │
│                 │                                  │
│  [Déconnexion]  │                                  │
└─────────────────┴──────────────────────────────────┘
```

#### Vue "Mes spots" (gestion des POIs)
- Carte Mapbox plein-cadre avec TOUS les POIs actifs
- Filtres catégorie en chips (pour naviguer dans la base)
- Clic sur un pin → fiche avec boutons "Modifier" et "Supprimer"
- Bouton flottant "+ Ajouter un spot" → ouvre PoiForm

**PoiForm (ajout / édition) :**
- Nom, Catégorie, Description (publique), Détails pratiques (accès, durée, difficulté...)
- **3 modes de géolocalisation (tabs)** :
  1. Adresse — autocomplete Mapbox Geocoding
  2. Coordonnées GPS — deux champs lat / lng
  3. À la main — mini-carte cliquable
- URL Instagram, Upload image (drag & drop → Supabase Storage)
- Tags (chips input : `sportif`, `famille`, `romantique`, `insolite`...)
- Toggle "Actif"

#### Vue "Mes cartes" (gestion des cartes clients)
- Liste de toutes les cartes créées
- Colonnes : nom client, forfait, nb spots, date création, statut (active / désactivée), lien
- Actions : modifier, copier le lien, désactiver / réactiver, supprimer
- Bouton "+ Nouvelle carte" → flux de création

**Flux de création d'une carte client :**

**Étape 1 — Infos client**
```
Nom du client    : [Famille Martin          ]
Forfait          : ( ) Essentiel  (•) Personnalisé
Notes internes   : [Sportifs, aiment la rando, 2 enfants...]
```

**Étape 2 — Sélection des spots sur la carte**
```
┌──────────────────────────────────────────────────────┐
│  [ Filtres catégorie ]    Spots sélectionnés : 8/42  │
│                                                      │
│         [ CARTE MAPBOX — MODE SÉLECTION ]            │
│                                                      │
│  Pin non sélectionné = gris                          │
│  Pin sélectionné     = couleur catégorie + ✓         │
│  Clic = toggle sélection                             │
│                                                      │
│  Panel droit : liste des spots sélectionnés          │
│  avec drag-to-reorder + champ "note pour ce client"  │
└──────────────────────────────────────────────────────┘
```

**Étape 3 — Confirmation & génération**
```
Résumé :
  Client    : Famille Martin
  Forfait   : Personnalisé
  Spots     : 8 sélectionnés (3 plages, 2 randos, 2 restos, 1 activité)

[ Générer la carte ]
  → Création en base
  → Génération du slug unique (nanoid 10 chars)
  → URL : tikoin-gwada.fr/map/a3kFpQ9xLm
  → Bouton "Copier le lien" + bouton "Voir la carte"
```

---

## 9. Logique de Sécurité & Isolation

| Risque | Protection |
|---|---|
| Client accède à tous les POIs | `GET /api/map/:slug` ne retourne **que** les POIs liés à ce slug via `client_map_pois` |
| Slug devinable | `nanoid(10)` — 10^17 combinaisons, non-séquentiel |
| Carte partagée indésirable | Flo peut désactiver manuellement → 403 immédiat |
| Accès admin | JWT signé `HS256` avec `JWT_SECRET`, expiration 24h, stocké en `sessionStorage` |
| Service role key exposée | Jamais dans le bundle client — uniquement dans les Vercel API Routes (Node.js) |
| RLS Supabase | Toutes les tables en `service_role only` — aucune requête directe possible depuis le client |

---

## 10. Plan de Développement par Phases (pour Claude Code)

### Phase 1 — Setup & Infrastructure
1. Init projet Vite + React + Tailwind
2. Config CSS variables Botanical Fresh + import fonts
3. Setup Supabase : créer les 3 tables (`pois`, `client_maps`, `client_map_pois`), RLS, Storage bucket `poi-images`
4. Config variables d'environnement (`.env.local` + `.env.example`)
5. Setup React Router : routes `/map/:slug`, `/admin`, `/admin/*`
6. Deploy Vercel initial avec CI/CD

### Phase 2 — Page Client (carte publique)
1. Vercel API Route `GET /api/map/[slug].js` avec logique sécurité
2. Hook `useClientMap(slug)` — fetch + gestion états (loading / 404 / 403 / ok)
3. Page `ClientMapPage` avec carte Mapbox centrée Guadeloupe
4. Affichage markers des POIs reçus (MarkerPin par catégorie)
5. Clustering (supercluster)
6. Composant `PoiDrawer` — fiche complète avec `custom_note` ("Note de Flo 💬")
7. Pages d'erreur 404 et 403 élégantes

### Phase 3 — Admin Auth & Layout
1. Page `AdminLogin` + Vercel API Route `POST /api/admin/login`
2. Hook `useAdmin` — gestion JWT sessionStorage + protection routes
3. Composant `AdminLayout` avec sidebar (Mes spots / Mes cartes)
4. Guards de route : redirect vers login si non authentifié

### Phase 4 — Gestion des Spots (admin)
1. Hook `usePois` — fetch tous les POIs via API Route admin
2. Vue "Mes spots" : carte Mapbox + filtres catégorie + liste latérale
3. Composant `PoiForm` — formulaire complet
   - `GeocoderInput` avec autocomplete Mapbox
   - Tab GPS, tab carte cliquable
   - Upload image → Supabase Storage
4. API Routes : `POST /api/admin/poi`, `PUT /api/admin/poi/[id]`, `DELETE /api/admin/poi/[id]`
5. Toast feedback (succès / erreur)

### Phase 5 — Génération de Cartes Clients (admin)
1. Vue "Mes cartes" : tableau des cartes avec statuts et actions
2. Composant `ClientMapForm` — étape 1 : infos client
3. Composant `MapSelector` — étape 2 : carte en mode sélection multi-POIs
   - Toggle pin (sélectionné / non sélectionné)
   - Panel latéral : liste des spots sélectionnés + champ note par spot + drag-to-reorder
4. Étape 3 : confirmation + génération slug (nanoid) + affichage URL finale
5. API Routes : `POST /api/admin/client-map`, `PUT /api/admin/client-map/[id]`, `DELETE /api/admin/client-map/[id]`
6. Actions tableau : copier lien, désactiver / réactiver, modifier

### Phase 6 — Polish & Production
1. SEO : meta Open Graph (preview lien propre quand Flo partage par WhatsApp/Instagram)
2. Loading skeletons + error boundaries
3. Responsive final — test iPhone Safari (prioritaire pour les clients)
4. Optimisation images (lazy loading, WebP)
5. README du projet
6. Checklist déploiement production

---

## 11. Points d'Attention & Décisions Techniques

| Sujet | Décision | Raison |
|---|---|---|
| Accès client | URL secrète avec slug `nanoid` | Zéro friction — pas de compte, pas de code — juste un lien |
| Sécurité POIs | RLS `service_role only` + isolation en API Route | Le client ne peut pas requêter Supabase directement |
| Durée carte | Contrôle manuel par Flo (`is_active`) | Flexibilité totale — Flo désactive si le client revient l'année suivante |
| Modification post-génération | `PUT /api/admin/client-map/:id` met à jour `client_map_pois` | La carte client reflète les changements en temps réel |
| Slug | `nanoid(10)` | Court, URL-safe, non-devinable, lisible |
| Clustering | `supercluster` + `react-map-gl` | Léger, performant, adapté à ~100 POIs |
| State management | **TanStack React Query** | Cache + invalidation propre après mutations admin |
| Auth admin | JWT `HS256` maison via API Route | Un seul utilisateur — pas besoin de Supabase Auth |
| Style carte Mapbox | `outdoors-v12` | Cohérent avec l'univers nature/voyage, topographie visible |

---

## 12. Commandes de Démarrage Rapide

```bash
# 1. Créer le projet
npm create vite@latest ti-koin-gwada -- --template react
cd ti-koin-gwada

# 2. Dépendances
npm install react-map-gl mapbox-gl @supabase/supabase-js
npm install react-router-dom @tanstack/react-query
npm install supercluster use-supercluster
npm install tailwindcss @tailwindcss/vite autoprefixer
npm install lucide-react nanoid
npm install jsonwebtoken bcryptjs        # côté API Routes Vercel (Node.js)

# 3. Fonts dans index.html (<head>)
# <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300;1,9..144,700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

# 4. Dev
npm run dev

# 5. Deploy
vercel --prod
```

---

## 13. Checklist Finale Avant Mise en Production

- [ ] 3 tables Supabase créées avec RLS activée
- [ ] Bucket `poi-images` en mode public
- [ ] Variables d'environnement configurées sur Vercel (5 variables)
- [ ] `JWT_SECRET` changé (min 32 caractères aléatoires)
- [ ] `ADMIN_PASSWORD` changé (mot de passe fort)
- [ ] Test complet flux création carte → lien client → consultation
- [ ] Test désactivation carte → vérification 403 côté client
- [ ] Test modification POIs d'une carte existante → reflet immédiat
- [ ] Meta Open Graph testés (aperçu WhatsApp propre)
- [ ] Test mobile iPhone Safari (prioritaire — clientèle cible)
- [ ] Test isolation : vérifier qu'un slug ne donne accès qu'à SES POIs
- [ ] README rédigé pour Flo (comment ajouter un spot, créer une carte)

---

*Généré pour le projet Ti Koin Gwada — @ti.koin.gwada*