// GET /api/listings/:id/availability — Lista los rangos de disponibilidad de un listado
import { getAvailability } from '~~/server/services/availability.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  // Sesión opcional: el dueño puede ver la disponibilidad de su anuncio no publicado
  const session = await auth.api.getSession({ headers: event.headers }).catch(() => null)
  return getAvailability(id, session?.user?.id)
})
