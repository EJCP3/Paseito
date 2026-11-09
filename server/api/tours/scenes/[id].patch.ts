// PATCH /api/tours/scenes/:id — Renombrar una escena (solo el dueño del anuncio)
import { UpdateSceneSchema } from '~~/shared/schemas/tour.schema'
import { updateScene } from '~~/server/services/tour.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de escena requerido' })
  }

  const body = await readBody(event)
  const data = parseOr400(UpdateSceneSchema, body)

  return updateScene(id, session.user.id, data)
})
