// POST /api/listings — Crear nuevo listado
import { CreateListingSchema } from '~~/shared/schemas/listing.schema'
import { createListing } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  // TODO: Obtener usuario autenticado con Better Auth
  // const session = await getSession(event)
  // if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  // const ownerId = session.user.id

  // Placeholder: usuario demo
  const ownerId = 'demo-user-001'

  const body = await readBody(event)
  const data = CreateListingSchema.parse(body)

  const listing = await createListing(data, ownerId)

  setResponseStatus(event, 201)
  return listing
})
