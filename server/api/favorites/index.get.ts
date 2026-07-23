// GET /api/favorites — Anuncios guardados por el usuario logueado ("Mi Lista")
import { getUserFavoriteListings } from '~~/server/services/favorite.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  return getUserFavoriteListings(session.user.id)
})
