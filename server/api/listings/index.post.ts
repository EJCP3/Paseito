// POST /api/listings — Crear nuevo listado
import { CreateListingSchema } from '~~/shared/schemas/listing.schema'
import { createListing } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  if (!session.user.emailVerified) {
    throw createError({ statusCode: 403, statusMessage: 'Debes verificar tu correo antes de publicar' })
  }
  const ownerId = session.user.id

  const body = await readBody(event)
  const parsed = CreateListingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Datos inválidos',
      message: parsed.error.issues[0]?.message || 'Datos inválidos',
    })
  }

  const listing = await createListing(parsed.data, ownerId)

  setResponseStatus(event, 201)
  return listing
})
