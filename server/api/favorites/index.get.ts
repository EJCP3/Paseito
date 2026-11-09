// GET /api/favorites — Anuncios guardados por el usuario logueado ("Mi Lista")
import { getUserFavoriteListings } from '~~/server/services/favorite.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  return getUserFavoriteListings(session.user.id)
})
