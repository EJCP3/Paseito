// POST /api/favorites/toggle — Guardar/quitar un anuncio de "Mi Lista" (requiere sesión)
import { ToggleFavoriteSchema } from '~~/shared/schemas/favorite.schema'
import { toggleFavorite } from '~~/server/services/favorite.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const body = parseOr400(ToggleFavoriteSchema, await readBody(event))
  return toggleFavorite(session.user.id, body.listingId)
})
