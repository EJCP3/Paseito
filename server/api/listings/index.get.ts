// GET /api/listings — Listar con filtros y paginación
import { ListingFiltersSchema } from '~~/shared/schemas/listing.schema'
import { getListings } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parsear y validar filtros (el status no es filtrable: siempre ACTIVE)
  const num = (v: unknown) => (v === undefined || v === '' ? undefined : Number(v))
  const filters = parseOr400(ListingFiltersSchema, {
    type: query.type || undefined,
    mode: query.mode || undefined,
    city: query.city || undefined,
    sector: query.sector || undefined,
    minPrice: num(query.minPrice),
    maxPrice: num(query.maxPrice),
    minBedrooms: num(query.minBedrooms),
    minBathrooms: num(query.minBathrooms),
    minArea: num(query.minArea),
    maxArea: num(query.maxArea),
    search: query.search || undefined,
    sort: query.sort || undefined,
    excludeId: query.excludeId || undefined,
    page: num(query.page) ?? 1,
    limit: num(query.limit) ?? 12,
  })

  return getListings(filters)
})
