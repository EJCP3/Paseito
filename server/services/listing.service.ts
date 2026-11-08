// Service — Listings CRUD
// Toda la lógica de negocio de listados vive aquí
import type { ListingFiltersInput, CreateListingInput, UpdateListingInput } from '~~/shared/schemas/listing.schema'
import { mockListings } from '~~/server/utils/mockData'
import { buildListingWhere } from '~~/server/lib/listingWhere'
import { publicCoords } from '~~/server/lib/coords'

/**
 * Verifica si debemos usar datos de prueba (mock)
 */
function useMock(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const url = process.env.DATABASE_URL
  return !url || url.includes('user:password')
}

/**
 * Genera un slug legible a partir del título
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '')

  // Añadir sufijo aleatorio para unicidad
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

/**
 * Obtener listados con filtros y paginación
 */
function getMockListings(filters: ListingFiltersInput) {
  const { type, city, sector, minPrice, maxPrice, search, excludeId, page, limit } = filters

  // Filtrado de mock data en memoria
  let data = [...mockListings]

  if (excludeId) {
    data = data.filter(l => l.id !== excludeId)
  }
  if (type) {
    data = data.filter(l => l.type === type)
  }
  if (city) {
    data = data.filter(l => l.city?.toLowerCase().includes(city.toLowerCase()))
  }
  if (sector) {
    data = data.filter(l => l.sector?.toLowerCase().includes(sector.toLowerCase()))
  }
  if (minPrice !== undefined) {
    data = data.filter(l => Number(l.price) >= minPrice)
  }
  if (maxPrice !== undefined) {
    data = data.filter(l => Number(l.price) <= maxPrice)
  }
  if (search) {
    const q = search.toLowerCase()
    data = data.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.sector?.toLowerCase().includes(q)
    )
  }

  const total = data.length
  const paginatedData = data.slice((page - 1) * limit, page * limit)

  return {
    data: paginatedData.map((l) => publicCoords(l as any)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getListings(filters: ListingFiltersInput) {
  const { page, limit } = filters

  if (useMock()) {
    console.log('[Listings Service] Usando datos de prueba (mock)')
    return getMockListings(filters)
  }

  const where = buildListingWhere(filters)

  try {
    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          photos: { orderBy: { order: 'asc' }, take: 1 },
          scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
          owner: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    return {
      data: data.map((l) => publicCoords(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('[Listings Service] Error en base de datos:', error)
    throw error
  }
}

/**
 * Obtener un listado por slug con todas sus relaciones
 */
export async function getListingBySlug(slug: string) {
  if (useMock()) {
    return mockListings.find(l => l.slug === slug) || null
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { slug },
      include: {
        photos: { orderBy: { order: 'asc' } },
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
        nearbyPlaces: { orderBy: { distanceM: 'asc' } },
        availability: { orderBy: { startDate: 'asc' } },
        owner: {
          select: {
            id: true, name: true, phone: true, image: true, verificationTier: true,
            _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
    })
    if (!listing) return null

    const { _count, ...owner } = listing.owner
    return { ...listing, owner: { ...owner, activeListingsCount: _count.listings } }
  } catch (error) {
    console.error('[Listings Service] Error en db al buscar por slug:', slug, error)
    throw error
  }
}

/**
 * Obtener un listado por ID
 */
export async function getListingById(id: string) {
  if (useMock()) {
    return mockListings.find(l => l.id === id) || null
  }

  try {
    return await prisma.listing.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
        nearbyPlaces: { orderBy: { distanceM: 'asc' } },
        owner: { select: { id: true, name: true, phone: true } },
      },
    })
  } catch (error) {
    console.error('[Listings Service] Error en db al buscar por ID:', id, error)
    throw error
  }
}

/**
 * Obtener todos los anuncios de un usuario (cualquier estado, para "Mi cuenta")
 */
export async function getListingsByOwner(ownerId: string) {
  if (useMock()) {
    return mockListings.filter(l => l.ownerId === ownerId)
  }

  try {
    return await prisma.listing.findMany({
      where: { ownerId },
      include: {
        photos: { orderBy: { order: 'asc' }, take: 1 },
        scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('[Listings Service] Error en db al listar anuncios del dueño:', ownerId, error)
    throw error
  }
}

/**
 * Crear un nuevo listado
 */
export async function createListing(data: CreateListingInput, ownerId: string) {
  const slug = generateSlug(data.title)
  // Las villas siempre son alquiler por día — no lo elige el usuario en el form.
  const mode = data.type === 'VILLA' ? 'RENT_DAILY' : (data as any).mode

  if (useMock()) {
    const newListing: any = {
      id: `listing-${Date.now()}`,
      slug,
      ownerId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
      mode,
      photos: [],
      scenes: [],
      owner: { id: ownerId, name: 'Usuario Demo', phone: '+18095551234' }
    }
    mockListings.push(newListing)
    return newListing
  }

  // No hay paso de moderación/aprobación: el listado queda visible de inmediato.
  // `data` es la unión discriminada (apartamento/casa/villa/vehículo): cada
  // rama trae solo sus propios campos, todos columnas opcionales del modelo.
  return prisma.listing.create({
    data: {
      ...(data as any),
      mode,
      slug,
      ownerId,
      price: data.price,
      status: 'ACTIVE',
    },
  })
}

/**
 * Actualizar un listado (solo el dueño)
 */
export async function updateListing(id: string, data: UpdateListingInput, ownerId: string) {
  if (useMock()) {
    const idx = mockListings.findIndex(l => l.id === id)
    if (idx !== -1) {
      mockListings[idx] = { ...mockListings[idx], ...data } as any
      return mockListings[idx]
    }
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  // Verificar propiedad
  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  return prisma.listing.update({
    where: { id },
    data,
  })
}

/**
 * Eliminar un listado (solo el dueño)
 */
export async function deleteListing(id: string, ownerId: string) {
  if (useMock()) {
    const idx = mockListings.findIndex(l => l.id === id)
    if (idx !== -1) {
      mockListings.splice(idx, 1)
      return { success: true }
    }
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para eliminar este anuncio' })
  }

  return prisma.listing.delete({ where: { id } })
}

/**
 * Agregar una foto a un anuncio (solo el dueño)
 */
export async function addPhoto(listingId: string, ownerId: string, data: { url: string; thumbUrl: string; name: string | null; order: number }) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  return prisma.photo.create({
    data: { listingId, url: data.url, thumbUrl: data.thumbUrl, name: data.name, order: data.order },
  })
}

export async function renamePhoto(photoId: string, ownerId: string, name: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { listing: { select: { ownerId: true } } } })
  if (!photo || photo.listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar esta foto' })
  }

  return prisma.photo.update({ where: { id: photoId }, data: { name: name.trim() || null } })
}
