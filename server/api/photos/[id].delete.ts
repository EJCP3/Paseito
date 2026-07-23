// DELETE /api/photos/:id — Eliminar una foto de un anuncio (solo el dueño)
import { deleteImage } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const id = getRouterParam(event, 'id')!
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { url: true, listing: { select: { ownerId: true } } },
  })
  if (!photo || photo.listing.ownerId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para eliminar esta foto' })
  }

  await prisma.photo.delete({ where: { id } })
  // Best-effort: limpiar del storage (no bloquea la respuesta)
  deleteImage(photo.url)

  return { success: true }
})
