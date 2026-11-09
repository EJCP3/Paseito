// GET /api/hero-listings — 8 anuncios para el hero: destacados HERO vigentes y, si faltan, recientes con imagen
import { buildListingWhere } from '~~/server/lib/listingWhere'
import { activeFeatureWhere } from '~~/server/lib/featureWhere'
import { pickHeroListings } from '~~/server/lib/features'

const select = {
  id: true, slug: true, title: true,
  photos: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
  scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
} as const

type Row = { id: string; slug: string; title: string; photos: { url: string }[]; scenes: { previewUrl: string }[] }
const toItem = (l: Row, startsAt?: Date) => ({
  id: l.id, slug: l.slug, title: l.title, startsAt,
  coverUrl: cld(l.photos[0]?.url || l.scenes[0]?.previewUrl, 'f_auto,q_auto,c_limit,w_800'),
})

// Caché de 60 s: tras confirmar un HERO el anuncio aparece en la portada como mucho 60 s después (retraso aceptado).
export default defineCachedEventHandler(async () => {
  const now = new Date()
  const base = buildListingWhere({})
  const [featured, recent] = await Promise.all([
    prisma.feature.findMany({
      where: { ...activeFeatureWhere(now, ['HERO']), listing: base },
      select: { startsAt: true, listing: { select } },
      orderBy: { startsAt: 'desc' },
      take: 8,
    }),
    prisma.listing.findMany({
      where: { ...base, OR: [{ photos: { some: {} } }, { scenes: { some: {} } }] },
      select, orderBy: { createdAt: 'desc' }, take: 16,
    }),
  ])
  return pickHeroListings(featured.map((f) => toItem(f.listing, f.startsAt)), recent.map((l) => toItem(l)))
    .map(({ id, slug, title, coverUrl }) => ({ id, slug, title, coverUrl }))
}, { maxAge: 60, name: 'hero-listings', getKey: () => 'v1' })
