// GET /api/listings — Listar con filtros y paginación
import { ListingFiltersSchema } from '~~/shared/schemas/listing.schema'
import { getListings } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parsear y validar filtros
  const filters = ListingFiltersSchema.parse({
    type: query.type || undefined,
    status: query.status || undefined,
    city: query.city || undefined,
    sector: query.sector || undefined,
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    minBedrooms: query.minBedrooms ? Number(query.minBedrooms) : undefined,
    search: query.search || undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 12,
  })

  return getListings(filters)
})
