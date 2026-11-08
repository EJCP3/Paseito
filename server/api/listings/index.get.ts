// GET /api/listings — Listar con filtros y paginación
import { ListingFiltersSchema } from '~~/shared/schemas/listing.schema'
import { getListings } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parsear y validar filtros (el status no es filtrable: siempre ACTIVE)
  const num = (v: unknown) => (v === undefined || v === '' ? undefined : Number(v))
  const filters = parseOr400(ListingFiltersSchema, {
    type: query.type || undefined,
    city: query.city || undefined,
    sector: query.sector || undefined,
    minPrice: num(query.minPrice),
    maxPrice: num(query.maxPrice),
    minBedrooms: num(query.minBedrooms),
    search: query.search || undefined,
    excludeId: query.excludeId || undefined,
    page: num(query.page) ?? 1,
    limit: num(query.limit) ?? 12,
  })

  return getListings(filters)
})
