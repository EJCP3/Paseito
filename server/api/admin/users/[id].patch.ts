// PATCH /api/admin/users/:id { action: 'suspend'|'reactivate' } — con AuditLog
import { z } from 'zod'
import { canModerateUser } from '~~/server/lib/adminRules'

const Body = z.object({ action: z.enum(['suspend', 'reactivate']) })

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  const { action } = parseOr400(Body, await readBody(event))

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, deletedAt: true } })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  const can = canModerateUser(session.user, target)
  if (!can.ok) throw createError({ statusCode: 400, statusMessage: can.reason })

  await prisma.$transaction(async (tx) => {
    const suspend = action === 'suspend'
    const { count } = await tx.user.updateMany({
      where: { id, suspended: !suspend, deletedAt: null },
      data: suspend ? { suspended: true, suspendedAt: new Date() } : { suspended: false, suspendedAt: null },
    })
    if (count === 0) throw createError({ statusCode: 409, statusMessage: suspend ? 'El usuario ya está suspendido' : 'El usuario no está suspendido' })
    if (suspend) {
      await tx.session.deleteMany({ where: { userId: id } })
      await tx.listing.updateMany({ where: { ownerId: id, status: 'ACTIVE', deletedAt: null }, data: { status: 'PAUSED' } })
    }
    await tx.auditLog.create({
      data: { actorId: session.user.id, action: `user.${action}`, targetType: 'User', targetId: id },
    })
  })
  return { id, suspended: action === 'suspend' }
})
