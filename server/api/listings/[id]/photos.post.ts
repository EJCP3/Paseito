// POST /api/listings/:id/photos — Agregar foto de portada al anuncio (solo el dueño)
import { addPhoto } from '~~/server/services/listing.service'
import { isListingAssetUrl } from '~~/server/lib/assetUrl'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const listingId = getRouterParam(event, 'id')
  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido' })
  }

  const body = await readBody<{ url: string; thumbUrl: string; name?: string; order?: number }>(event)
  if (!body?.url || !body?.thumbUrl) {
    throw createError({ statusCode: 400, statusMessage: 'url y thumbUrl son requeridos' })
  }

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
