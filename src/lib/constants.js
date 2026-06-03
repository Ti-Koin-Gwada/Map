export const CATEGORIES = {
  plage:      { label: 'Plages & Mer',             color: '#0EA5E9', bgLight: '#E0F2FE', icon: '🏖️' },
  restaurant: { label: 'Restaurants & Bars',        color: '#F97316', bgLight: '#FFF0E6', icon: '🍽️' },
  randonnee:  { label: 'Randonnées & Nature',       color: '#22C55E', bgLight: '#DCFCE7', icon: '🌿' },
  activite:   { label: 'Activités & Expériences',   color: '#A855F7', bgLight: '#F3E8FF', icon: '🎯' },
  spot_cache: { label: 'Spots Cachés & Insolites',  color: '#EAB308', bgLight: '#FEF9C3', icon: '✨' },
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([value, c]) => ({
  value,
  label: c.label,
  color: c.color,
}))

export const TAG_OPTIONS = [
  'sportif', 'famille', 'romantique', 'insolite',
  'nature', 'gastronomie', 'culture', 'baignade', 'snorkeling',
]

export const FORFAIT_OPTIONS = [
  { value: 'essentiel',    label: 'Essentiel',    desc: "Jusqu'à 6 spots" },
  { value: 'personnalise', label: 'Personnalisé',  desc: "Jusqu'à 20 spots + notes" },
]

export const MAP_CENTER = { lat: 16.265, lng: -61.551 } // Guadeloupe
export const MAP_ZOOM   = 10

export const ROUTE_COLORS = ['#2D5A3D', '#B45309', '#1D4ED8', '#7C3AED', '#B91C1C']
