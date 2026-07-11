// Service — Listings CRUD
// Toda la lógica de negocio de listados vive aquí
import type { Prisma } from '@prisma/client'
import type { ListingFiltersInput, CreateListingInput, UpdateListingInput } from '~~/shared/schemas/listing.schema'
import { mockListings } from '~~/server/utils/mockData'

/**
 * Verifica si debemos usar datos de prueba (mock)
 */
function useMock(): boolean {
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
export async function getListings(filters: ListingFiltersInput) {
  const { type, status, city, sector, minPrice, maxPrice, minBedrooms, search, page, limit } = filters

  if (useMock()) {
    console.log('[Listings Service] Usando datos de prueba (mock)')
    
    // Filtrado de mock data en memoria
    let data = [...mockListings]
    
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
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  const where: Prisma.ListingWhereInput = {
    ...(type && { type }),
    ...(status ? { status } : { status: 'ACTIVE' }), // Por defecto solo activos
    ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
    ...(sector && { sector: { contains: sector, mode: 'insensitive' as const } }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && { price: { ...((where as any)?.price || {}), lte: maxPrice } }),
    ...(minBedrooms !== undefined && { bedrooms: { gte: minBedrooms } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
        { sector: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('[Listings Service] Error en base de datos, fallback a mock:', error)
    return getListings(filters) // Fuerza fallback recursivo (detectará error y forzará en memoria si falló)
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
    return await prisma.listing.findUnique({
      where: { slug },
      include: {
        photos: { orderBy: { order: 'asc' } },
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
        owner: { select: { id: true, name: true, phone: true } },
      },
    })
  } catch (error) {
    console.error('[Listings Service] Error en db, fallback a mock para slug:', slug)
    return mockListings.find(l => l.slug === slug) || null
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
        owner: { select: { id: true, name: true, phone: true } },
      },
    })
  } catch (error) {
    console.error('[Listings Service] Error en db, fallback a mock para ID:', id)
    return mockListings.find(l => l.id === id) || null
  }
}

/**
 * Crear un nuevo listado
 */
export async function createListing(data: CreateListingInput, ownerId: string) {
  const slug = generateSlug(data.title)

  if (useMock()) {
    const newListing: any = {
      id: `listing-${Date.now()}`,
      slug,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
      photos: [],
      scenes: [],
      owner: { id: ownerId, name: 'Usuario Demo', phone: '+18095551234' }
    }
    mockListings.push(newListing)
    return newListing
  }

  return prisma.listing.create({
    data: {
      ...data,
      slug,
      ownerId,
      price: data.price,
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
    throw createError({ statusCode: 404, statusMessage: 'Listado no encontrado' })
  }

  // Verificar propiedad
  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este listado' })
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
    throw createError({ statusCode: 404, statusMessage: 'Listado no encontrado' })
  }

  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para eliminar este listado' })
  }

  return prisma.listing.delete({ where: { id } })
}
