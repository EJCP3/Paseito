// DELETE /api/tours/scenes/:id — Eliminar una escena (solo el dueño del anuncio)
import { deleteScene } from '~~/server/services/tour.service'
import { deleteImage } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const id = getRouterParam(event, 'id')!
  const scene = await prisma.scene.findUnique({
    where: { id },
    select: { panoramaUrl: true, listing: { select: { ownerId: true } } },
  })
  if (!scene || scene.listing.ownerId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para eliminar esta escena' })
  }

  await deleteScene(id)
  // Best-effort: limpiar la panorámica del storage (no bloquea la respuesta)
  deleteImage(scene.panoramaUrl)

  return { success: true }
})
