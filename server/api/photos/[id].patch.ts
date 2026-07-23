// PATCH /api/photos/:id — Renombrar una foto de un anuncio (solo el dueño)
import { renamePhoto } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string }>(event)

  return renamePhoto(id, session.user.id, body?.name ?? '')
})
