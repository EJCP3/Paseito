// Service — Perfil público del vendedor
import type { SellerProfile } from '~~/shared/types/listing'

export async function getUserProfile(userId: string): Promise<SellerProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, verificationTier: true, createdAt: true },
  })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const [activeListings, totalSaved] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: userId, status: 'ACTIVE' },
      include: {
        photos: { orderBy: { order: 'asc' }, take: 1 },
        scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Guardados sumados de todos sus anuncios (tabla Favorite, ver schema.prisma)
    prisma.favorite.count({ where: { listing: { ownerId: userId } } }),
  ])

  return {
    user: { ...user, createdAt: user.createdAt.toISOString() },
    activeListings: activeListings as any,
    totalSaved,
  }
}
