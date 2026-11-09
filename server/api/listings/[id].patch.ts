// PATCH /api/listings/:id — Actualizar listado
import { UpdateListingSchema } from '~~/shared/schemas/listing.schema'
import { updateListing } from '~~/server/services/listing.service'


export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const session = await requireUser(event)
  const ownerId = session.user.id

  const body = await readBody(event)
  const data = parseOr400(UpdateListingSchema, body)

  return updateListing(id, data, ownerId)
})
