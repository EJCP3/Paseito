import { describe, it, expect } from 'vitest'
import { CreateListingSchema } from '../shared/schemas/listing.schema'
import locations from '../shared/data/rd-locations.json'

const base = {
  title: 'Anuncio de prueba',
  description: 'Descripción de prueba suficientemente larga.',
  city: locations[0]!.city,
  sector: locations[0]!.sectors[0],
  price: 1000,
}

describe('CreateListingSchema', () => {
  it('rechaza type VEHICLE', () => {
    const r = CreateListingSchema.safeParse({
      ...base, type: 'VEHICLE', brand: 'Toyota', model: 'Corolla', year: 2020,
    })
    expect(r.success).toBe(false)
  })

  it('acepta un apartamento válido', () => {
    expect(CreateListingSchema.safeParse({ ...base, type: 'APARTMENT', mode: 'SALE' }).success).toBe(true)
  })

  it('acepta una casa válida', () => {
    expect(CreateListingSchema.safeParse({ ...base, type: 'HOUSE', mode: 'RENT_LONG_TERM' }).success).toBe(true)
  })

  it('acepta una villa válida', () => {
    expect(CreateListingSchema.safeParse({ ...base, type: 'VILLA', pricePerDay: 200 }).success).toBe(true)
  })
})
