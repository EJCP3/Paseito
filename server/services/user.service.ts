// Service — Perfil público del vendedor
import { publicCoords } from '~~/server/lib/coords'
import type { SellerProfile } from '~~/shared/types/listing'

export async function getUserProfile(userId: string): Promise<SellerProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, verificationTier: true, createdAt: true, deletedAt: true },
  })
  if (!user || user.deletedAt) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const [activeListings, totalSaved] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: userId, status: 'ACTIVE', deletedAt: null },
      include: {
        photos: { orderBy: { order: 'asc' }, take: 1 },
        scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Guardados sumados de todos sus anuncios (tabla Favorite, ver schema.prisma)
    prisma.favorite.count({ where: { listing: { ownerId: userId, deletedAt: null } } }),
  ])

  return {
    user: { id: user.id, name: user.name, image: user.image, verificationTier: user.verificationTier, createdAt: user.createdAt.toISOString() },
    activeListings: activeListings.map((l) => publicCoords(l)) as any,
    totalSaved,
  }
}
