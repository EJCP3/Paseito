// POST /api/uploads — Sube una imagen (foto de portada o panorámica) a Cloudinary
import { uploadImage } from '~~/server/services/storage.service'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((p) => p.name === 'file' && p.data?.length)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo requerido' })
  }

  const listingId = parts?.find((p) => p.name === 'listingId')?.data.toString() || 'misc'

  return uploadImage(filePart.data, `paseito/listings/${listingId}`)
})
