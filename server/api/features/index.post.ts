// POST /api/features { listingId, placement, plan } — solicitud de destacado (PENDING, pago manual)
import { CreateFeatureSchema } from '~~/shared/schemas/feature.schema'
import { featureRef } from '~~/shared/config/featurePricing'
import { heroCapacity, quote } from '~~/server/lib/features'
import { heroOccupiedWhere, lockHero } from '~~/server/lib/featureWhere'

const MAX_PENDING_PER_USER = 5
const MAX_RETRIES = 2

export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const { listingId, placement, plan } = parseOr400(CreateFeatureSchema, await readBody(event))
  await requireOwnedListing(listingId, session.user.id)

  const q = quote(placement, plan)
  if (!q.ok) throw createError({ statusCode: 400, statusMessage: q.reason })

  for (let attempt = 0; ; attempt++) {
    try {
      const feature = await prisma.$transaction(async (tx) => {
        if (placement === 'HERO') await lockHero(tx) // serializa la comprobación de capacidad
        const now = new Date()
        const listing = await tx.listing.findUnique({ where: { id: listingId }, select: { status: true, deletedAt: true } })
        if (!listing || listing.deletedAt || listing.status !== 'ACTIVE') {
          throw createError({ statusCode: 400, statusMessage: 'Solo puedes promocionar anuncios activos' })
        }
        const pending = await tx.feature.count({ where: { status: 'PENDING', listing: { ownerId: session.user.id } } })
        if (pending >= MAX_PENDING_PER_USER) {
          throw createError({ statusCode: 429, statusMessage: `Tienes ${MAX_PENDING_PER_USER} solicitudes pendientes de pago; cancela o espera a que se confirmen` })
        }
        const dup = await tx.feature.findFirst({
          where: { listingId, placement, OR: [{ status: 'PENDING' }, { status: 'ACTIVE', endsAt: { gt: now } }] },
          select: { id: true },
        })
        if (dup) throw createError({ statusCode: 409, statusMessage: 'Ya tienes una solicitud o un destacado vigente en este espacio' })

        if (placement === 'HERO') {
          const active = await tx.feature.findMany({ where: heroOccupiedWhere(now), select: { endsAt: true } })
          const cap = heroCapacity(active.map((a) => a.endsAt), now)
          if (!cap.available) {
            throw createError({ statusCode: 409, statusMessage: 'El Hero está lleno', data: { freeAt: cap.freeAt } })
          }
        }
        return tx.feature.create({
          data: { listingId, placement, status: 'PENDING', priceCents: q.priceCents, currency: q.currency, startsAt: now, endsAt: new Date(now.getTime() + q.days * 86_400_000) },
          select: { id: true, placement: true, status: true, priceCents: true, currency: true, listingId: true },
        })
      }, { isolationLevel: 'Serializable' })
      return { ...feature, ref: featureRef(feature.id) }
    } catch (e: any) {
      if (e?.code === 'P2034') {
        if (attempt < MAX_RETRIES) continue
        throw createError({ statusCode: 409, statusMessage: 'Conflicto al reservar; inténtalo de nuevo' })
      }
      throw e
    }
  }
})
