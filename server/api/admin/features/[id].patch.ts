// PATCH /api/admin/features/:id { action: 'confirm', paymentRef } | { action: 'cancel', reason } — con AuditLog
import { AdminFeatureActionSchema } from '~~/shared/schemas/feature.schema'
import { heroCapacity, nextFeatureAction } from '~~/server/lib/features'
import { heroOccupiedWhere, lockHero } from '~~/server/lib/featureWhere'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  const body = parseOr400(AdminFeatureActionSchema, await readBody(event))

  // El espacio no cambia nunca: se lee fuera para decidir si hace falta el lock del Hero al abrir la transacción
  const pre = await prisma.feature.findUnique({ where: { id }, select: { placement: true } })
  if (!pre) throw createError({ statusCode: 404, statusMessage: 'Destacado no encontrado' })

  try {
    return await prisma.$transaction(async (tx) => {
      if (body.action === 'confirm' && pre.placement === 'HERO') await lockHero(tx) // serializa la capacidad
      const f = await tx.feature.findUnique({ where: { id }, select: { status: true, placement: true, startsAt: true, endsAt: true, listing: { select: { deletedAt: true, status: true } } } })
      if (!f) throw createError({ statusCode: 404, statusMessage: 'Destacado no encontrado' })
      const next = nextFeatureAction(f.status, body.action)
      if (!next.ok) throw createError({ statusCode: 400, statusMessage: next.reason })

      let data: Record<string, unknown> = { status: next.status }
      if (body.action === 'confirm') {
        if (f.listing.deletedAt || f.listing.status !== 'ACTIVE') throw createError({ statusCode: 409, statusMessage: 'El anuncio no está activo' })
        const now = new Date()
        if (f.placement === 'HERO') {
          const active = await tx.feature.findMany({ where: heroOccupiedWhere(now, id), select: { endsAt: true } })
          const cap = heroCapacity(active.map((a) => a.endsAt), now)
          if (!cap.available) throw createError({ statusCode: 409, statusMessage: 'El Hero está lleno', data: { freeAt: cap.freeAt } })
        }
        const days = Math.round((f.endsAt.getTime() - f.startsAt.getTime()) / 86_400_000)
        data = { ...data, startsAt: now, endsAt: new Date(now.getTime() + days * 86_400_000), paymentRef: body.paymentRef }
      }

      const { count } = await tx.feature.updateMany({ where: { id, status: f.status }, data })
      if (count === 0) throw createError({ statusCode: 409, statusMessage: 'El destacado ya fue gestionado' })
      await tx.auditLog.create({
        data: {
          actorId: session.user.id, action: `feature.${body.action}`, targetType: 'Feature', targetId: id,
          metadata: body.action === 'confirm' ? { paymentRef: body.paymentRef } : { reason: body.reason },
        },
      })
      return tx.feature.findUniqueOrThrow({ where: { id }, select: { id: true, status: true, startsAt: true, endsAt: true } })
    }, { isolationLevel: 'Serializable' })
  } catch (e: any) {
    if (e?.code === 'P2034') throw createError({ statusCode: 409, statusMessage: 'Conflicto al confirmar, inténtalo de nuevo' })
    if (e?.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Referencia ya usada' })
    throw e
  }
})
