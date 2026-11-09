// POST /api/listings/:id/nearby-places — (Re)detecta y guarda los POIs
// cercanos de un listado ya creado. Borra los anteriores antes de insertar
// los nuevos, para permitir re-detección si el dueño mueve el pin.
import { NearbyPlacesQuerySchema } from '~~/shared/schemas/nearbyPlace.schema'
import { detectAndSaveNearbyPlaces } from '~~/server/services/nearbyPlaces.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const session = await requireUser(event)

  const body = await readBody(event)
  const { lat, lng, excludeNames } = NearbyPlacesQuerySchema.parse(body)

  return detectAndSaveNearbyPlaces(id, session.user.id, lat, lng, excludeNames)
})
