// GET /api/admin/listings?status=&q=&page= — Anuncios no borrados (admin)
import { z } from 'zod'

const Q = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'PAUSED', 'PENDING_REVIEW']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
})
const TAKE = 50

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { status, q, page } = parseOr400(Q, getQuery(event))
  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(q && { title: { contains: q, mode: 'insensitive' as const } }),
  }
  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        id: true, slug: true, title: true, status: true, createdAt: true, adminPausedAt: true, adminPausedReason: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TAKE,
      take: TAKE,
    }),
    prisma.listing.count({ where }),
  ])
  return { data, total, page, totalPages: Math.ceil(total / TAKE) }
})
