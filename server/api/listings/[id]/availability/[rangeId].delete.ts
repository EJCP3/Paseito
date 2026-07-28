// DELETE /api/listings/:id/availability/:rangeId — Elimina un rango de disponibilidad
import { deleteAvailabilityRange } from '~~/server/services/availability.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const rangeId = getRouterParam(event, 'rangeId')
  if (!id || !rangeId) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  await deleteAvailabilityRange(id, session.user.id, rangeId)
  return { success: true }
})
