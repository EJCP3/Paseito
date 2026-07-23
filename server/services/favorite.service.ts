// Service — Favoritos ("Mi Lista"), ligados al usuario logueado
export async function toggleFavorite(userId: string, listingId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { favorited: false }
  }

  await prisma.favorite.create({ data: { userId, listingId } })
  return { favorited: true }
}

export async function getUserFavoriteListings(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
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

  return favorites.map((f) => f.listing)
}
