import { describe, it, expect } from 'vitest'
import { buildListingWhere } from '../server/lib/listingWhere'

describe('buildListingWhere', () => {
  it('sin filtros solo devuelve status ACTIVE', () => {
    const where = buildListingWhere({})
    expect(where.status).toBe('ACTIVE')
    expect(where.price).toBeUndefined()
  })

  it('solo maxPrice construye price: { lte }', () => {
    const where = buildListingWhere({ maxPrice: 100000 })
    expect(where.price).toEqual({ lte: 100000 })
    expect(where.status).toBe('ACTIVE')
  })

  it('solo minPrice construye price: { gte }', () => {
    expect(buildListingWhere({ minPrice: 5000 }).price).toEqual({ gte: 5000 })
  })

  it('minPrice + maxPrice se combinan en un solo objeto price', () => {
    const where = buildListingWhere({ minPrice: 1000, maxPrice: 2000 })
    expect(where.price).toEqual({ gte: 1000, lte: 2000 })
  })

  it('minPrice = 0 se respeta como gte: 0', () => {
    expect(buildListingWhere({ minPrice: 0 }).price).toEqual({ gte: 0 })
    expect(buildListingWhere({ minPrice: 0, maxPrice: 500 }).price).toEqual({ gte: 0, lte: 500 })
  })

  it('siempre fuerza ACTIVE aunque se cuele un status en la entrada', () => {
    const where = buildListingWhere({ status: 'DRAFT' } as any)
    expect(where.status).toBe('ACTIVE')
  })

  it('siempre fuerza ACTIVE con cualquier combinación de filtros', () => {
    const where = buildListingWhere({
      type: 'HOUSE',
      city: 'Santo Domingo',
      sector: 'Piantini',
      minBedrooms: 2,
      search: 'piscina',
      excludeId: 'abc',
      maxPrice: 300000,
    } as any)
    expect(where.status).toBe('ACTIVE')
    expect(where.price).toEqual({ lte: 300000 })
  })

  it('no añade filtros vacíos para campos ausentes', () => {
    const where = buildListingWhere({ city: 'Santiago' } as any)
    expect(where.city).toBeDefined()
    expect(where.sector).toBeUndefined()
    expect(where.type).toEqual({ in: ['APARTMENT', 'HOUSE', 'VILLA'] })
  })

  it('excludeId excluye ese id', () => {
    const where = buildListingWhere({ excludeId: 'abc' })
    expect(JSON.stringify(where)).toContain('abc')
    expect(where.id).toEqual({ not: 'abc' })
  })

  it('siempre excluye anuncios borrados (deletedAt: null), con y sin filtros', () => {
    expect(buildListingWhere({}).deletedAt).toBeNull()
    expect(buildListingWhere({ city: 'Santiago', maxPrice: 1000, excludeId: 'abc' } as any).deletedAt).toBeNull()
  })
})
