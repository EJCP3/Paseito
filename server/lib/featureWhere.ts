// Fragmentos Prisma para destacados activos (la expiración es por fecha, sin cron)
import type { Prisma } from '@prisma/client'
import { buildListingWhere } from './listingWhere'

// Clave del advisory lock que serializa las comprobaciones de capacidad del Hero
export const HERO_LOCK_KEY = 7_001_008

// Debe ser la PRIMERA sentencia de la transacción; se libera sola al terminar (xact)
export const lockHero = (tx: Prisma.TransactionClient) => tx.$executeRaw`SELECT pg_advisory_xact_lock(${HERO_LOCK_KEY})`

// Features HERO que ocupan hueco: activos, no vencidos y con anuncio ACTIVE y no borrado
export const heroOccupiedWhere = (now: Date, excludeId?: string): Prisma.FeatureWhereInput => ({
  placement: 'HERO',
  status: 'ACTIVE',
  endsAt: { gt: now },
  ...(excludeId && { id: { not: excludeId } }),
  listing: buildListingWhere({}),
})

export const activeFeatureWhere = (now: Date, placements: ('HERO' | 'SIDEBAR' | 'BADGE')[]): Prisma.FeatureWhereInput => ({
  status: 'ACTIVE',
  startsAt: { lte: now },
  endsAt: { gt: now },
  placement: { in: placements },
})

// Select para listados públicos: solo el espacio, sin precios ni fechas
export const featuredSelect = (now: Date) => ({
  where: activeFeatureWhere(now, ['SIDEBAR', 'BADGE']),
  select: { placement: true },
  take: 2,
}) satisfies Prisma.Listing$featuresArgs

export function withFeatured<T extends { features?: { placement: string }[] }>(l: T) {
  const { features = [], ...rest } = l
  return { ...rest, featured: features.length > 0, featuredPlacements: features.map((f) => f.placement) }
}
