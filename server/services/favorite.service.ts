// Service — Favoritos ("Mi Lista"), ligados al usuario logueado
import { publicCoords } from '~~/server/lib/coords'

export async function toggleFavorite(userId: string, listingId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { favorited: false }
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { status: true, deletedAt: true } })
  if (listing?.status !== 'ACTIVE' || listing.deletedAt) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  await prisma.favorite.create({ data: { userId, listingId } })
  return { favorited: true }
}

export async function getUserFavoriteListings(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, listing: { status: 'ACTIVE', deletedAt: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        include: {
          photos: { orderBy: { order: 'asc' }, take: 1 },
          scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
        },
      },
    },
  })

  return favorites.map((f) => publicCoords(f.listing, userId))
}
