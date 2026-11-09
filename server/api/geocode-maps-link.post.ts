// POST /api/geocode-maps-link — Resuelve un link de Google Maps a coordenadas.
// Uso único: autocompletar el pin del mini-mapa al publicar sin arrastrarlo a mano.
import { GoogleMapsLinkSchema } from '~~/shared/schemas/geocode.schema'
import { resolveGoogleMapsLink } from '~~/server/services/geocoding.service'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readBody(event)
  const { url } = parseOr400(GoogleMapsLinkSchema, body)

  const coords = await resolveGoogleMapsLink(url)
  if (!coords) {
    throw createError({ statusCode: 422, statusMessage: 'No pudimos leer coordenadas de ese link de Google Maps' })
  }

  return coords
})
