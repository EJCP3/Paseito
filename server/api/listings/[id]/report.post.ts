// POST /api/listings/:id/report — Reportar un anuncio activo (sesión opcional). Rate limit en middleware.
import { ReportInputSchema } from '~~/shared/schemas/report.schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  const body = parseOr400(ReportInputSchema, await readBody(event))

  const listing = await prisma.listing.findUnique({ where: { id }, select: { status: true, deletedAt: true } })
  if (!listing || listing.deletedAt || listing.status !== 'ACTIVE') {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  const session = await auth.api.getSession({ headers: event.headers }).catch(() => null)
  const reporterId = session?.user?.id ?? null
  // Idempotente: un usuario con sesión no acumula reportes abiertos del mismo anuncio
  if (reporterId && await prisma.report.findFirst({ where: { listingId: id, reporterId, status: 'OPEN' }, select: { id: true } })) {
    return { ok: true }
  }
  await prisma.report.create({
    data: { listingId: id, reporterId, reason: body.reason, details: body.details || null },
  })
  setResponseStatus(event, 201)
  return { ok: true }
})
