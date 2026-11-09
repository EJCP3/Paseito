// DELETE /api/features/:id — el vendedor cancela su solicitud PENDING
import { nextFeatureAction } from '~~/server/lib/features'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  const f = await prisma.feature.findUnique({ where: { id }, select: { status: true, listing: { select: { ownerId: true } } } })
  if (!f || f.listing.ownerId !== session.user.id) throw createError({ statusCode: 404, statusMessage: 'Solicitud no encontrada' })
  if (f.status !== 'PENDING') throw createError({ statusCode: 400, statusMessage: 'Solo puedes cancelar solicitudes pendientes de pago' })
  const next = nextFeatureAction(f.status, 'cancel')
  if (!next.ok) throw createError({ statusCode: 400, statusMessage: next.reason })

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.feature.updateMany({ where: { id, status: 'PENDING' }, data: { status: next.status } })
    if (count === 0) throw createError({ statusCode: 409, statusMessage: 'La solicitud cambió; recarga' })
    await tx.auditLog.create({ data: { actorId: session.user.id, action: 'feature.cancel_by_owner', targetType: 'Feature', targetId: id } })
  })
  return { id, status: next.status }
})
