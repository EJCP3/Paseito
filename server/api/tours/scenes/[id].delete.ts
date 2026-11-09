// DELETE /api/tours/scenes/:id — Eliminar una escena (solo el dueño del anuncio)
import { deleteScene } from '~~/server/services/tour.service'
import { deleteImage } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const id = getRouterParam(event, 'id')!
  const scene = await prisma.scene.findUnique({
    where: { id },
    select: { panoramaUrl: true, listingId: true },
  })
  if (!scene) throw createError({ statusCode: 404, statusMessage: 'Escena no encontrada' })
  await requireOwnedListing(scene.listingId, session.user.id)

  await deleteScene(id)
  // Best-effort: limpiar la panorámica del storage (no bloquea la respuesta)
  deleteImage(scene.panoramaUrl, scene.listingId)

  return { success: true }
})
