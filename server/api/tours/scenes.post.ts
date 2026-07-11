// POST /api/tours/scenes — Crear escena para un listado
import { CreateSceneSchema } from '~~/shared/schemas/tour.schema'
import { createScene } from '~~/server/services/tour.service'


export default defineEventHandler(async (event) => {
  // TODO: Verificar autenticación y propiedad del listado
  const body = await readBody(event)
  const data = CreateSceneSchema.parse(body)

  const scene = await createScene(data)

  setResponseStatus(event, 201)
  return scene
})
