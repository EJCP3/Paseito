// Service — Disponibilidad de villas (alquiler por día)
// Rangos editables por el dueño desde el AvailabilityEditor.
import type { UpsertAvailabilityRangeInput } from '~~/shared/schemas/availability.schema'

async function assertOwner(listingId: string, ownerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }
}

export async function getAvailability(listingId: string) {
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
  await assertOwner(listingId, ownerId)

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
  await assertOwner(listingId, ownerId)

  const range = await prisma.availabilityRange.findUnique({ where: { id: rangeId }, select: { listingId: true } })
  if (!range || range.listingId !== listingId) {
    throw createError({ statusCode: 404, statusMessage: 'Rango de disponibilidad no encontrado' })
  }

  return prisma.availabilityRange.delete({ where: { id: rangeId } })
}
