import { deleteListing } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  // TODO: Obtener usuario autenticado
  const ownerId = 'demo-user-001'

  await deleteListing(id, ownerId)

  return { success: true }
})
