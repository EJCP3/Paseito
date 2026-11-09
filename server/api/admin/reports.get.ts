// GET /api/admin/reports?status=OPEN&page= — Reportes (admin)
import { z } from 'zod'

const Q = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
})
const TAKE = 50

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { status, page } = parseOr400(Q, getQuery(event))
  const where = status ? { status } : {}
  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        listing: { select: { id: true, slug: true, title: true, status: true, deletedAt: true, adminPausedAt: true } },
        reporter: { select: { name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // OPEN primero (orden del enum)
      skip: (page - 1) * TAKE,
      take: TAKE,
    }),
    prisma.report.count({ where }),
  ])
  return { data, total, page, totalPages: Math.ceil(total / TAKE) }
})
