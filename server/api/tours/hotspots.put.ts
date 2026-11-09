// PUT /api/tours/hotspots — Actualizar hotspots de una escena (solo el dueño del anuncio)
import { UpdateHotspotsSchema } from '~~/shared/schemas/tour.schema'
import { updateHotspots } from '~~/server/services/tour.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const data = parseOr400(UpdateHotspotsSchema, await readBody(event))

  return updateHotspots(data, session.user.id)
})
