// PATCH /api/listings/:id — Actualizar listado
import { UpdateListingSchema } from '~~/shared/schemas/listing.schema'
import { updateListing } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  // TODO: Obtener usuario autenticado
  const ownerId = 'demo-user-001'

  const body = await readBody(event)
  const data = UpdateListingSchema.parse(body)

  return updateListing(id, data, ownerId)
})
