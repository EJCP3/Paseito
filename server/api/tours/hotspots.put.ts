// PUT /api/tours/hotspots — Actualizar hotspots de una escena
import { UpdateHotspotsSchema } from '~~/shared/schemas/tour.schema'
import { updateHotspots } from '~~/server/services/tour.service'


export default defineEventHandler(async (event) => {
  // TODO: Verificar autenticación y propiedad
  const body = await readBody(event)
  const data = UpdateHotspotsSchema.parse(body)

  const hotspots = await updateHotspots(data)

  return hotspots
})
