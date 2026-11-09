// PATCH /api/photos/:id — Renombrar una foto de un anuncio (solo el dueño)
import { renamePhoto } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string }>(event)

  return renamePhoto(id, session.user.id, body?.name ?? '')
})
