// Where de Prisma para el listado público. Siempre ACTIVE: el status no es filtrable.
import type { Prisma } from '@prisma/client'
import type { ListingFiltersInput } from '../../shared/schemas/listing.schema'

export function buildListingWhere(f: Partial<ListingFiltersInput>): Prisma.ListingWhereInput {
  const { type, city, sector, minPrice, maxPrice, minBedrooms, search, excludeId } = f
  const price = {
    ...(minPrice !== undefined && { gte: minPrice }),
    ...(maxPrice !== undefined && { lte: maxPrice }),
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
    ...(minBedrooms !== undefined && { bedrooms: { gte: minBedrooms } }),
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
