// Service — Tours (escenas 360° y hotspots)
import type { CreateSceneInput, UpdateSceneInput, UpdateHotspotsInput } from '~~/shared/schemas/tour.schema'

/**
 * Crear una nueva escena para un listado
 */
export async function createScene(data: CreateSceneInput) {
  // Verificar que el listado existe
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    select: { id: true },
  })

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  return prisma.scene.create({ data })
}

/**
 * Renombrar una escena (solo el dueño del anuncio)
 */
export async function updateScene(id: string, ownerId: string, data: UpdateSceneInput) {
  const scene = await prisma.scene.findUnique({
    where: { id },
    select: { listing: { select: { ownerId: true } } },
  })

  if (!scene || scene.listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar esta escena' })
  }

  return prisma.scene.update({ where: { id }, data })
}

/**
 * Actualizar los hotspots de una escena
 */
export async function updateHotspots(data: UpdateHotspotsInput, userId: string) {
  const { sceneId, hotspots } = data


  // La escena debe existir y ser de un anuncio del usuario
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { listingId: true, listing: { select: { ownerId: true } } },
  })

  if (!scene || scene.listing.ownerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar esta escena' })
  }

  // Cada targetSceneId debe ser una escena del mismo anuncio
  const targets = [...new Set(hotspots.map((h) => h.targetSceneId).filter((t): t is string => !!t))]
  if (targets.length) {
    const found = await prisma.scene.count({ where: { id: { in: targets }, listingId: scene.listingId } })
    if (found !== targets.length) {
      throw createError({ statusCode: 400, statusMessage: 'Una escena destino no pertenece a este anuncio' })
    }
  }

  // Transacción: borrar existentes + crear nuevos (el cliente necesita los ids reales)
  return prisma.$transaction(async (tx) => {
    await tx.hotspot.deleteMany({ where: { sceneId } })
    await tx.hotspot.createMany({
      data: hotspots.map((h) => ({
        type: h.type,
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.title || null,
        text: h.text || null,
        targetSceneId: h.targetSceneId || null,
        sceneId,
      })),
    })
    return tx.hotspot.findMany({ where: { sceneId }, orderBy: { id: 'asc' } })
  })
}

/**
 * Eliminar una escena y sus hotspots (cascade)
 */
export async function deleteScene(sceneId: string) {
  return prisma.scene.delete({ where: { id: sceneId } })
}
