import { getListingBySlug, getListingById } from '~~/server/services/listing.service'
import { publicCoords, publicNearby } from '~~/server/lib/coords'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID o slug requerido' })
  }

  // Intentar buscar por slug primero (para URLs legibles)
  let listing = await getListingBySlug(id)

  // Si no se encuentra por slug, buscar por ID
  if (!listing) {
    listing = await getListingById(id)
  }

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  // Solo el dueño ve anuncios que no están ACTIVE
  const session = await auth.api.getSession({ headers: event.headers })
  const viewerId = session?.user?.id
  if (listing.status !== 'ACTIVE' && listing.ownerId !== viewerId) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  const out = publicCoords(listing, viewerId)
  return listing.ownerId === viewerId ? out : { ...out, nearbyPlaces: publicNearby(out.nearbyPlaces) }
})
