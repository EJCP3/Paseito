// GET /api/admin/features?status= — destacados (pendientes primero) + resumen de ingresos (admin)
import { z } from 'zod'
import { featureRef } from '~~/shared/config/featurePricing'
import { revenueSummary } from '~~/server/lib/features'

const Q = z.object({ status: z.enum(['PENDING', 'ACTIVE', 'CANCELLED']).optional() })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { status } = parseOr400(Q, getQuery(event))
  const [rows, confirmed] = await Promise.all([
    prisma.feature.findMany({
      where: status ? { status } : {},
      select: {
        id: true, placement: true, status: true, startsAt: true, endsAt: true, priceCents: true, currency: true, paymentRef: true, createdAt: true,
        listing: { select: { id: true, slug: true, title: true, owner: { select: { name: true, email: true } } } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // PENDING primero (orden del enum)
      take: 200,
    }),
    // ingreso = cualquier destacado con referencia de pago (un cancelado ya cobrado sigue contando); startsAt es la fecha de confirmación
    prisma.feature.findMany({ where: { paymentRef: { not: null } }, select: { placement: true, priceCents: true, startsAt: true, status: true } }),
  ])
  const cancelledPaidCents = confirmed.filter((c) => c.status === 'CANCELLED').reduce((t, c) => t + c.priceCents, 0)

  // Dos features con la misma referencia corta (8 caracteres): el vendedor no podría distinguirlos en el pago
  const refCount = new Map<string, number>()
  if (rows.length) {
    const prefixes = [...new Set(rows.map((r) => featureRef(r.id)))]
    const all = await prisma.feature.findMany({ where: { OR: prefixes.map((p) => ({ id: { startsWith: p, mode: 'insensitive' as const } })) }, select: { id: true } })
    for (const a of all) refCount.set(featureRef(a.id), (refCount.get(featureRef(a.id)) ?? 0) + 1)
  }
  return {
    data: rows.map((r) => ({ ...r, ref: featureRef(r.id), refDuplicated: (refCount.get(featureRef(r.id)) ?? 0) > 1 })),
    revenue: { ...revenueSummary(confirmed.map((c) => ({ placement: c.placement, priceCents: c.priceCents, confirmedAt: c.startsAt }))), cancelledPaidCents },
  }
})
