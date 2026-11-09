// POST /api/geocode — Convierte una dirección de texto en coordenadas.
// Uso único: centrar el mini-mapa al elegir ciudad/sector al publicar.
import { GeocodeSchema } from '~~/shared/schemas/geocode.schema'
import { geocodeAddress } from '~~/server/services/geocoding.service'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readBody(event)
  const { address } = parseOr400(GeocodeSchema, body)

  return geocodeAddress(address)
})
