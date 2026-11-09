// POST /api/listings/:id/photos — Agregar foto de portada al anuncio (solo el dueño)
import { addPhoto } from '~~/server/services/listing.service'
import { isListingAssetUrl } from '~~/server/lib/assetUrl'
import { z } from 'zod'

const PhotoSchema = z.object({
  url: z.string().min(1).max(1000),
  thumbUrl: z.string().min(1).max(1000),
  name: z.string().max(80).optional(),
  order: z.number().int().min(0).max(100).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)

  const listingId = getRouterParam(event, 'id')
  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido' })
  }

  const body = parseOr400(PhotoSchema, await readBody(event))

  const { cloudName } = useRuntimeConfig()
  if (
    !isListingAssetUrl(body.url, cloudName, listingId) ||
    !isListingAssetUrl(body.thumbUrl, cloudName, listingId)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'URL de imagen no permitida' })
  }

  return addPhoto(listingId, session.user.id, {
    url: body.url,
    thumbUrl: body.thumbUrl,
    name: body.name?.trim() || null,
    order: body.order ?? 0,
  })
})
