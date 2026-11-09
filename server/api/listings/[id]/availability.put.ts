// PUT /api/listings/:id/availability — Crea o actualiza un rango de disponibilidad
import { UpsertAvailabilityRangeSchema } from '~~/shared/schemas/availability.schema'
import { upsertAvailabilityRange } from '~~/server/services/availability.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const session = await requireUser(event)

  const body = await readBody(event)
  const parsed = UpsertAvailabilityRangeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Datos inválidos',
      message: parsed.error.issues[0]?.message || 'Datos inválidos',
    })
  }

  return upsertAvailabilityRange(id, session.user.id, parsed.data)
})
