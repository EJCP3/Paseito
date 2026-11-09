// Where de Prisma para el listado público. Siempre ACTIVE: el status no es filtrable.
import type { Prisma } from '@prisma/client'
import type { ListingFiltersInput } from '../../shared/schemas/listing.schema'

export function buildListingOrderBy(sort?: ListingFiltersInput['sort']): Prisma.ListingOrderByWithRelationInput[] {
  if (sort === 'price_asc') return [{ price: 'asc' }, { createdAt: 'desc' }]
  if (sort === 'price_desc') return [{ price: 'desc' }, { createdAt: 'desc' }]
  return [{ createdAt: 'desc' }]
}

export function buildListingWhere(f: Partial<ListingFiltersInput>): Prisma.ListingWhereInput {
  const { type, mode, city, sector, minPrice, maxPrice, minBedrooms, minBathrooms, minArea, maxArea, search, excludeId } = f
  const price = {
    ...(minPrice !== undefined && { gte: minPrice }),
    ...(maxPrice !== undefined && { lte: maxPrice }),
  }
  const areaM2 = {
    ...(minArea !== undefined && { gte: minArea }),
    ...(maxArea !== undefined && { lte: maxArea }),
  }
  return {
    status: 'ACTIVE',
    deletedAt: null,
    ...(excludeId && { id: { not: excludeId } }),
    // ponytail: VEHICLE sigue declarado en el enum de Prisma a propósito (RQ-SCOPE-02, evita migrar filas); se excluye aquí
    type: type ?? { in: ['APARTMENT', 'HOUSE', 'VILLA'] },
    ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
    ...(sector && { sector: { contains: sector, mode: 'insensitive' as const } }),
    ...(Object.keys(price).length > 0 && { price }),
    ...(mode && { mode }),
    ...(Object.keys(areaM2).length > 0 && { areaM2 }),
    ...(minBedrooms !== undefined && { bedrooms: { gte: minBedrooms } }),
    ...(minBathrooms !== undefined && { bathrooms: { gte: minBathrooms } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
        { sector: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }
}
