// POST /api/listings/:id/status — Pausar / reanudar (solo el dueño)
import { z } from 'zod'
import { changeListingStatus } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const { action } = parseOr400(z.object({ action: z.enum(['pause', 'resume']) }), await readBody(event))
  return changeListingStatus(id, session.user.id, action)
})
