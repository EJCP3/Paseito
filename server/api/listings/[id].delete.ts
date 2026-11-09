import { deleteListing } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const session = await requireUser(event)
  const ownerId = session.user.id

  await deleteListing(id, ownerId)

  return { success: true }
})
