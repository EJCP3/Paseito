// POST /api/tours/upload-url — Generar URL firmada para subida a R2
import { UploadUrlRequestSchema } from '~~/shared/schemas/tour.schema'
import { generateUploadUrl } from '~~/server/services/storage.service'


export default defineEventHandler(async (event) => {
  // TODO: Verificar autenticación
  const body = await readBody(event)
  const data = UploadUrlRequestSchema.parse(body)

  const result = await generateUploadUrl(data)

  return result
})
