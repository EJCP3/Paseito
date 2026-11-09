// GET /api/admin/audit — Últimas 100 acciones de moderación
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return prisma.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
})
