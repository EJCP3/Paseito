import { describe, it, expect } from 'vitest'
import { buildListingWhere, buildListingOrderBy } from '../server/lib/listingWhere'

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

describe('buildListingWhere — filtros de la Fase 5', () => {
  it('mode filtra por igualdad', () => {
    expect(buildListingWhere({ mode: 'SALE' } as any).mode).toBe('SALE')
  })

  it('sin mode no añade el campo', () => {
    expect(buildListingWhere({}).mode).toBeUndefined()
  })

  it('minBathrooms construye bathrooms: { gte }', () => {
    expect(buildListingWhere({ minBathrooms: 2 } as any).bathrooms).toEqual({ gte: 2 })
  })

  it('minBathrooms = 0 se respeta', () => {
    expect(buildListingWhere({ minBathrooms: 0 } as any).bathrooms).toEqual({ gte: 0 })
  })

  it('minArea + maxArea se combinan en un solo objeto areaM2', () => {
    expect(buildListingWhere({ minArea: 50, maxArea: 200 } as any).areaM2).toEqual({ gte: 50, lte: 200 })
  })

  it('solo minArea construye areaM2: { gte }', () => {
    expect(buildListingWhere({ minArea: 80 } as any).areaM2).toEqual({ gte: 80 })
  })

  it('solo maxArea construye areaM2: { lte }', () => {
    expect(buildListingWhere({ maxArea: 120 } as any).areaM2).toEqual({ lte: 120 })
  })

  it('sin minArea ni maxArea, areaM2 queda undefined', () => {
    expect(buildListingWhere({ city: 'Santiago' } as any).areaM2).toBeUndefined()
  })

  it('los filtros nuevos no quitan ACTIVE ni deletedAt', () => {
    const where = buildListingWhere({ mode: 'RENT_DAILY', minBathrooms: 1, minArea: 10 } as any)
    expect(where.status).toBe('ACTIVE')
    expect(where.deletedAt).toBeNull()
  })
})

describe('buildListingOrderBy', () => {
  it('sin sort ordena por más reciente', () => {
    expect(buildListingOrderBy(undefined)).toEqual([{ createdAt: 'desc' }, { id: 'desc' }])
  })

  it("'recent' ordena por más reciente", () => {
    expect(buildListingOrderBy('recent')).toEqual([{ createdAt: 'desc' }, { id: 'desc' }])
  })

  it("'price_asc' ordena por precio ascendente y desempata por fecha e id", () => {
    expect(buildListingOrderBy('price_asc')).toEqual([{ price: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }])
  })

  it("'price_desc' ordena por precio descendente y desempata por fecha e id", () => {
    expect(buildListingOrderBy('price_desc')).toEqual([{ price: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }])
  })

  it('un valor desconocido cae en recent', () => {
    expect(buildListingOrderBy('foo' as any)).toEqual([{ createdAt: 'desc' }, { id: 'desc' }])
  })
})
