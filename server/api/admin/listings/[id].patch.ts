// PATCH /api/admin/listings/:id { action: 'pause'|'unpause'|'delete', reason? } — con AuditLog
import { z } from 'zod'
import { adminListingAction } from '~~/server/lib/adminRules'

const Body = z.object({ action: z.enum(['pause', 'unpause', 'delete']), reason: z.string().max(300).optional() })

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  const { action, reason } = parseOr400(Body, await readBody(event))

  const listing = await prisma.listing.findUnique({ where: { id }, select: { status: true, deletedAt: true, adminPausedAt: true } })
  if (!listing) throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  const r = adminListingAction(listing, action, { reason })
  if (!r.ok) throw createError({ statusCode: 400, statusMessage: r.reason })

  // Condición del updateMany = precondición verificada arriba (evita carreras entre admins)
  const guard = { id, deletedAt: null, adminPausedAt: action === 'unpause' ? { not: null } : action === 'pause' ? null : undefined }
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.listing.updateMany({ where: guard, data: r.data })
    if (count === 0) throw createError({ statusCode: 409, statusMessage: 'El anuncio cambió; recarga e inténtalo de nuevo' })
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `listing.${action}`,
        targetType: 'Listing',
        targetId: id,
        metadata: action !== 'unpause' ? { reason: reason?.trim() } : undefined,
      },
    })
    return tx.listing.findUniqueOrThrow({
      where: { id },
      select: { id: true, status: true, adminPausedAt: true, adminPausedReason: true, deletedAt: true },
    })
  })
})
