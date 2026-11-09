// GET /api/features/mine — destacados de mis anuncios: pendientes, vigentes y, últimos 90 días, vencidos o cancelados
import { featureRef } from '~~/shared/config/featurePricing'

const RECENT_DAYS = 90

type State = 'pending' | 'active' | 'expired' | 'cancelled'

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const now = new Date()
  const since = new Date(now.getTime() - RECENT_DAYS * 86_400_000)
  const rows = await prisma.feature.findMany({
    where: {
      listing: { ownerId: session.user.id, deletedAt: null },
      OR: [
        { status: 'PENDING' },
        { status: 'ACTIVE', endsAt: { gt: since } }, // vigentes y vencidos recientes
        { status: 'CANCELLED', createdAt: { gt: since } }, // sin fecha de cancelación en el esquema: se usa la de solicitud
      ],
    },
    select: { id: true, listingId: true, placement: true, status: true, priceCents: true, currency: true, startsAt: true, endsAt: true, listing: { select: { title: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Motivo de la cancelación del admin (sin esquema nuevo): del AuditLog, solo se devuelve al dueño
  const cancelledIds = rows.filter((r) => r.status === 'CANCELLED').map((r) => r.id)
  const reasons = new Map<string, string>()
  if (cancelledIds.length) {
    const logs = await prisma.auditLog.findMany({
      where: { targetType: 'Feature', targetId: { in: cancelledIds }, action: 'feature.cancel' },
      select: { targetId: true, metadata: true },
      orderBy: { createdAt: 'asc' }, // el último gana
    })
    for (const l of logs) {
      const reason = (l.metadata as { reason?: unknown } | null)?.reason
      if (typeof reason === 'string' && reason.trim()) reasons.set(l.targetId, reason)
    }
  }

  return rows.map((r) => {
    const state: State = r.status === 'PENDING' ? 'pending'
      : r.status === 'CANCELLED' ? 'cancelled'
        : r.endsAt > now ? 'active' : 'expired'
    return { ...r, state, ref: featureRef(r.id), ...(state === 'cancelled' && { cancelReason: reasons.get(r.id) ?? null }) }
  })
})
