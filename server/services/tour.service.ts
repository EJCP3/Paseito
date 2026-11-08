// Service — Tours (escenas 360° y hotspots)
import type { CreateSceneInput, UpdateSceneInput, UpdateHotspotsInput } from '~~/shared/schemas/tour.schema'
import { mockListings } from '~~/server/utils/mockData'

/**
 * Verifica si debemos usar datos de prueba (mock)
 */
function useMock(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const url = process.env.DATABASE_URL
  return !url || url.includes('user:password')
}

/**
 * Crear una nueva escena para un listado
 */
export async function createScene(data: CreateSceneInput) {
  if (useMock()) {
    const listing = mockListings.find(l => l.id === data.listingId)
    if (!listing) {
      throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
    }

    const newScene = {
      id: `scene-${Date.now()}`,
      name: data.name,
      panoramaUrl: data.panoramaUrl,
      previewUrl: data.previewUrl,
      order: data.order,
      initialYaw: data.initialYaw,
      listingId: data.listingId,
      hotspots: []
    }
    listing.scenes.push(newScene)
    return newScene
  }

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
 * Obtener todas las escenas de un listado con hotspots
 */
export async function getScenesByListingId(listingId: string) {
  if (useMock()) {
    const listing = mockListings.find(l => l.id === listingId)
    return listing ? listing.scenes : []
  }

  return prisma.scene.findMany({
    where: { listingId },
    include: { hotspots: true },
    orderBy: { order: 'asc' },
  })
}

/**
 * Actualizar los hotspots de una escena
 */
export async function updateHotspots(data: UpdateHotspotsInput, userId: string) {
  const { sceneId, hotspots } = data

  if (useMock()) {
    // Buscar la escena en todos los listados de prueba
    for (const listing of mockListings) {
      const scene = listing.scenes.find(s => s.id === sceneId)
      if (scene) {
        if (listing.ownerId !== userId) {
          throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar esta escena' })
        }
        scene.hotspots = hotspots.map((h, i) => ({
          id: h.id || `hotspot-${sceneId}-${Date.now()}-${i}`,
          type: h.type as any,
          yaw: h.yaw,
          pitch: h.pitch,
          title: h.title || null,
          text: h.text || null,
          targetSceneId: h.targetSceneId || null,
          sceneId
        }))
        return scene.hotspots
      }
    }
    throw createError({ statusCode: 404, statusMessage: 'Escena no encontrada' })
  }

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
  if (useMock()) {
    for (const listing of mockListings) {
      const idx = listing.scenes.findIndex(s => s.id === sceneId)
      if (idx !== -1) {
        listing.scenes.splice(idx, 1)
        return { success: true }
      }
    }
    throw createError({ statusCode: 404, statusMessage: 'Escena no encontrada' })
  }

  return prisma.scene.delete({ where: { id: sceneId } })
}

/**
 * Reordenar escenas de un listado
 */
export async function reorderScenes(listingId: string, sceneIds: string[]) {
  if (useMock()) {
    const listing = mockListings.find(l => l.id === listingId)
    if (listing) {
      listing.scenes.forEach(s => {
        const index = sceneIds.indexOf(s.id)
        if (index !== -1) {
          s.order = index
        }
      })
      listing.scenes.sort((a, b) => a.order - b.order)
      return listing.scenes
    }
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  return prisma.$transaction(
    sceneIds.map((id, index) =>
      prisma.scene.update({
        where: { id },
        data: { order: index },
      })
    )
  )
}
