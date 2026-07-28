// POST /api/geocode-maps-link — Resuelve un link de Google Maps a coordenadas.
// Uso único: autocompletar el pin del mini-mapa al publicar sin arrastrarlo a mano.
import { GoogleMapsLinkSchema } from '~~/shared/schemas/geocode.schema'
import { resolveGoogleMapsLink } from '~~/server/services/geocoding.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const { url } = GoogleMapsLinkSchema.parse(body)

  const coords = await resolveGoogleMapsLink(url)
  if (!coords) {
    throw createError({ statusCode: 422, statusMessage: 'No pudimos leer coordenadas de ese link de Google Maps' })
  }

  return coords
})
