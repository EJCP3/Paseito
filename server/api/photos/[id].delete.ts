// DELETE /api/photos/:id — Eliminar una foto de un anuncio (solo el dueño)
import { deleteImage } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const id = getRouterParam(event, 'id')!
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { url: true, listingId: true },
  })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'Foto no encontrada' })
  await requireOwnedListing(photo.listingId, session.user.id)

  await prisma.photo.delete({ where: { id } })
  // Best-effort: limpiar del storage (no bloquea la respuesta)
  deleteImage(photo.url, photo.listingId)

  return { success: true }
})
