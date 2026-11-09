// Service — Disponibilidad de villas (alquiler por día)
// Rangos editables por el dueño desde el AvailabilityEditor.
import type { UpsertAvailabilityRangeInput } from '~~/shared/schemas/availability.schema'

/** Público solo para anuncios ACTIVE no borrados; el dueño ve también los suyos pausados/borrador */
export async function getAvailability(listingId: string, viewerId?: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { status: true, deletedAt: true, ownerId: true } })
  if (!listing || listing.deletedAt || (listing.status !== 'ACTIVE' && listing.ownerId !== viewerId)) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }
  return prisma.availabilityRange.findMany({
    where: { listingId },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * Crea un rango nuevo, o actualiza uno existente si `data.id` viene presente
 * (mover fechas o cambiar de estado desde el popover del editor).
 */
export async function upsertAvailabilityRange(listingId: string, ownerId: string, data: UpsertAvailabilityRangeInput) {
  await requireOwnedListing(listingId, ownerId)

  if (data.id) {
    const range = await prisma.availabilityRange.findUnique({ where: { id: data.id }, select: { listingId: true } })
    if (!range || range.listingId !== listingId) {
      throw createError({ statusCode: 404, statusMessage: 'Rango de disponibilidad no encontrado' })
    }
    return prisma.availabilityRange.update({
      where: { id: data.id },
      data: { startDate: data.startDate, endDate: data.endDate, status: data.status },
    })
  }

  return prisma.availabilityRange.create({
    data: { listingId, startDate: data.startDate, endDate: data.endDate, status: data.status },
  })
}

export async function deleteAvailabilityRange(listingId: string, ownerId: string, rangeId: string) {
  await requireOwnedListing(listingId, ownerId)

  const range = await prisma.availabilityRange.findUnique({ where: { id: rangeId }, select: { listingId: true } })
  if (!range || range.listingId !== listingId) {
    throw createError({ statusCode: 404, statusMessage: 'Rango de disponibilidad no encontrado' })
  }

  return prisma.availabilityRange.delete({ where: { id: rangeId } })
}
