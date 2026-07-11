import { getListingBySlug, getListingById } from '~~/server/services/listing.service'

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
    throw createError({ statusCode: 404, statusMessage: 'Listado no encontrado' })
  }

  return listing
})
