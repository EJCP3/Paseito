// POST /api/uploads — Sube una imagen (foto de portada o panorámica) a Cloudinary
import { uploadImage } from '~~/server/services/storage.service'
import { checkImage, type ImageKind } from '~~/server/lib/imageCheck'

const MAX_BYTES = 40 * 1024 * 1024

const tooLarge = () => createError({ statusCode: 413, statusMessage: 'La imagen supera el máximo de 40 MB' })

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  // Rechazo temprano, antes de leer el cuerpo
  const len = getRequestHeader(event, 'content-length')
  if (!len) throw createError({ statusCode: 411, statusMessage: 'Content-Length requerido' })
  if (Number(len) > MAX_BYTES) throw tooLarge()

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((p) => p.name === 'file' && p.data?.length)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo requerido' })
  }
  if (filePart.data.length > MAX_BYTES) throw tooLarge()

  const field = (name: string) => parts?.find((p) => p.name === name)?.data.toString().trim()

  const listingId = field('listingId')
  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'listingId requerido' })
  }
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  const kind = field('kind') || 'photo'
  if (kind !== 'photo' && kind !== 'panorama') {
    throw createError({ statusCode: 400, statusMessage: 'kind debe ser photo o panorama' })
  }

  const check = await checkImage(filePart.data, kind as ImageKind)
  if (!check.ok) {
    throw createError({ statusCode: check.status, statusMessage: check.message })
  }

  return uploadImage(filePart.data, `paseito/listings/${listingId}`)
})
