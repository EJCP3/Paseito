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
  // Vistas y contactos de los últimos 30 días (agregado en BD, solo los anuncios de la página)
  const counts = await prisma.listingEvent.groupBy({
    by: ['listingId', 'type'],
    where: { listingId: { in: data.map((l) => l.id) }, type: { in: ['VIEW', 'CONTACT_CLICK'] }, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    _count: { _all: true },
  })
  const stat = (id: string, type: string) => counts.find((c) => c.listingId === id && c.type === type)?._count._all ?? 0
  const withStats = data.map((l) => ({ ...l, views30: stat(l.id, 'VIEW'), contacts30: stat(l.id, 'CONTACT_CLICK') }))
  return { data: withStats, total, page, totalPages: Math.ceil(total / TAKE) }
})
