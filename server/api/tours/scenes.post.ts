// POST /api/tours/scenes — Crear escena para un listado
import { CreateSceneSchema } from '~~/shared/schemas/tour.schema'
import { createScene } from '~~/server/services/tour.service'


export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const data = CreateSceneSchema.parse(body)

  const listing = await prisma.listing.findUnique({ where: { id: data.listingId }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  const scene = await createScene(data)

  setResponseStatus(event, 201)
  return scene
})
