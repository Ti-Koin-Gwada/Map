import { describe, it, expect } from 'vitest'
import { CATEGORIES, CATEGORY_OPTIONS, TAG_OPTIONS, FORFAIT_OPTIONS, MAP_CENTER, MAP_ZOOM } from '../../lib/constants.js'

describe('CATEGORIES', () => {
  const EXPECTED_KEYS = ['plage', 'restaurant', 'randonnee', 'activite', 'spot_cache']

  it('has exactly 5 categories', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(5)
  })

  it('contains all expected category keys', () => {
    expect(Object.keys(CATEGORIES)).toEqual(expect.arrayContaining(EXPECTED_KEYS))
  })

  it.each(EXPECTED_KEYS)('category "%s" has required fields', (key) => {
    const cat = CATEGORIES[key]
    expect(cat).toHaveProperty('label')
    expect(cat).toHaveProperty('color')
    expect(cat).toHaveProperty('bgLight')
    expect(cat).toHaveProperty('icon')
    expect(typeof cat.label).toBe('string')
    expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

describe('CATEGORY_OPTIONS', () => {
  it('maps each CATEGORIES entry to { value, label, color }', () => {
    expect(CATEGORY_OPTIONS).toHaveLength(Object.keys(CATEGORIES).length)
    for (const opt of CATEGORY_OPTIONS) {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('color')
      expect(CATEGORIES[opt.value]).toBeDefined()
    }
  })
})

describe('TAG_OPTIONS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(TAG_OPTIONS)).toBe(true)
    expect(TAG_OPTIONS.length).toBeGreaterThan(0)
    for (const tag of TAG_OPTIONS) expect(typeof tag).toBe('string')
  })
})

describe('FORFAIT_OPTIONS', () => {
  it('has essentiel and personnalise options', () => {
    const values = FORFAIT_OPTIONS.map(f => f.value)
    expect(values).toContain('essentiel')
    expect(values).toContain('personnalise')
  })

  it('each option has value, label, desc', () => {
    for (const opt of FORFAIT_OPTIONS) {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('desc')
    }
  })
})

describe('MAP_CENTER / MAP_ZOOM', () => {
  it('centers on Guadeloupe', () => {
    expect(MAP_CENTER.lat).toBeCloseTo(16.265, 1)
    expect(MAP_CENTER.lng).toBeCloseTo(-61.551, 1)
  })

  it('has a reasonable zoom level', () => {
    expect(MAP_ZOOM).toBeGreaterThanOrEqual(8)
    expect(MAP_ZOOM).toBeLessThanOrEqual(14)
  })
})
