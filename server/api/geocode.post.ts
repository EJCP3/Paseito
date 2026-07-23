// POST /api/geocode — Convierte una dirección de texto en coordenadas.
// Uso único: centrar el mini-mapa al elegir ciudad/sector al publicar.
import { GeocodeSchema } from '~~/shared/schemas/geocode.schema'
import { geocodeAddress } from '~~/server/services/geocoding.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const { address } = GeocodeSchema.parse(body)

  return geocodeAddress(address)
})
