// POST /api/listings/:id/publish — Publicar (DRAFT/PAUSED → ACTIVE). Exige contactConsent: true
import { z } from 'zod'
import { publishListing } from '~~/server/services/listing.service'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  if (!session.user.emailVerified) {
    throw createError({ statusCode: 403, statusMessage: 'Debes verificar tu correo antes de publicar' })
  }
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const body = parseOr400(z.object({ contactConsent: z.boolean().optional() }), await readBody(event))
  return publishListing(id, session.user.id, body.contactConsent === true)
})
