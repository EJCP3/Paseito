// GET /api/admin/users?q=&page= — Usuarios no eliminados (admin)
import { z } from 'zod'

const Q = z.object({ q: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1) })
const TAKE = 50

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { q, page } = parseOr400(Q, getQuery(event))
  const where = {
    deletedAt: null,
    ...(q && {
      OR: [
        { email: { contains: q, mode: 'insensitive' as const } },
        { name: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, suspended: true, createdAt: true,
        _count: { select: { listings: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TAKE,
      take: TAKE,
    }),
    prisma.user.count({ where }),
  ])
  return { data, total, page, totalPages: Math.ceil(total / TAKE) }
})
