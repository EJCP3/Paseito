// GET /api/listings/mine — Anuncios del usuario autenticado (cualquier estado)
import { getListingsByOwner } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  return getListingsByOwner(session.user.id)
})
