// PATCH /api/admin/reports/:id { action: 'resolve'|'dismiss' } — con AuditLog
import { z } from 'zod'

const Body = z.object({ action: z.enum(['resolve', 'dismiss']) })

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  const { action } = parseOr400(Body, await readBody(event))

  const report = await prisma.report.findUnique({ where: { id }, select: { status: true } })
  if (!report) throw createError({ statusCode: 404, statusMessage: 'Reporte no encontrado' })
  if (report.status !== 'OPEN') throw createError({ statusCode: 400, statusMessage: 'El reporte ya fue gestionado' })

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.report.updateMany({
      where: { id, status: 'OPEN' },
      data: { status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED', resolvedAt: new Date(), resolvedById: session.user.id },
    })
    if (count === 0) throw createError({ statusCode: 409, statusMessage: 'El reporte ya fue gestionado' })
    await tx.auditLog.create({
      data: { actorId: session.user.id, action: `report.${action}`, targetType: 'Report', targetId: id },
    })
    return tx.report.findUniqueOrThrow({ where: { id }, select: { id: true, status: true, resolvedAt: true } })
  })
})
