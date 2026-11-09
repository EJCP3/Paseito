// POST /api/tours/scenes — Crear escena para un listado
import { CreateSceneSchema } from '~~/shared/schemas/tour.schema'
import { createScene } from '~~/server/services/tour.service'
import { isListingAssetUrl } from '~~/server/lib/assetUrl'


export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const body = await readBody(event)
  const data = parseOr400(CreateSceneSchema, body)

  await requireOwnedListing(data.listingId, session.user.id)

  const { cloudName } = useRuntimeConfig()
  if (
    !isListingAssetUrl(data.panoramaUrl, cloudName, data.listingId) ||
    !isListingAssetUrl(data.previewUrl, cloudName, data.listingId)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'URL de imagen no permitida' })
  }

  const scene = await createScene(data)

  setResponseStatus(event, 201)
  return scene
})
