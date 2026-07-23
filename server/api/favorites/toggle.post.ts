// POST /api/favorites/toggle — Guardar/quitar un anuncio de "Mi Lista" (requiere sesión)
import { ToggleFavoriteSchema } from '~~/shared/schemas/favorite.schema'
import { toggleFavorite } from '~~/server/services/favorite.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = ToggleFavoriteSchema.parse(await readBody(event))
  return toggleFavorite(session.user.id, body.listingId)
})
