// POST /api/listings/nearby-places-preview — Preview de POIs cercanos sin
// persistir nada. Se usa durante la publicación, cuando el listado todavía
// no existe (el dueño está confirmando el pin en el mapa).
import { NearbyPlacesQuerySchema } from '~~/shared/schemas/nearbyPlace.schema'
import { searchNearbyPlaces } from '~~/server/services/nearbyPlaces.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const { lat, lng, excludeNames } = NearbyPlacesQuerySchema.parse(body)

  const places = await searchNearbyPlaces({ lat, lng })
  return excludeNames?.length ? places.filter((p) => !excludeNames.includes(p.name)) : places
})
