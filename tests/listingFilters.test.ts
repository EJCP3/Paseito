import { describe, it, expect } from 'vitest'
import { ListingFiltersSchema, ListingModeSchema } from '../shared/schemas/listing.schema'

const ok = (input: unknown) => ListingFiltersSchema.safeParse(input).success

describe('ListingFiltersSchema', () => {
  it.each(['recent', 'price_asc', 'price_desc'])('acepta sort = %s y lo conserva', (sort) => {
    const r = ListingFiltersSchema.safeParse({ sort })
    expect(r.success).toBe(true)
    expect((r.data as any).sort).toBe(sort)
  })

  it("rechaza sort: 'foo'", () => {
    expect(ok({ sort: 'foo' })).toBe(false)
  })

  it('acepta limit = 48 y rechaza limit > 48', () => {
    expect(ok({ limit: 48 })).toBe(true)
    expect(ok({ limit: 49 })).toBe(false)
  })

  it('rechaza minArea negativo', () => {
    expect(ok({ minArea: -1 })).toBe(false)
  })

  it('rechaza maxArea negativo', () => {
    expect(ok({ maxArea: -1 })).toBe(false)
  })

  it('rechaza minBathrooms negativo', () => {
    expect(ok({ minBathrooms: -1 })).toBe(false)
  })

  it.each(ListingModeSchema.options)('acepta mode = %s y lo conserva', (mode) => {
    const r = ListingFiltersSchema.safeParse({ mode })
    expect(r.success).toBe(true)
    expect((r.data as any).mode).toBe(mode)
  })

  it('rechaza un mode fuera de ListingModeSchema', () => {
    expect(ok({ mode: 'LEASE' })).toBe(false)
  })

  it('conserva minArea, maxArea y minBathrooms válidos', () => {
    const r = ListingFiltersSchema.safeParse({ minArea: 0, maxArea: 300, minBathrooms: 1.5 })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({ minArea: 0, maxArea: 300, minBathrooms: 1.5 })
  })
})
