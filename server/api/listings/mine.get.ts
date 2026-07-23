// GET /api/listings/mine — Anuncios del usuario autenticado (cualquier estado)
import { getListingsByOwner } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  return getListingsByOwner(session.user.id)
})
