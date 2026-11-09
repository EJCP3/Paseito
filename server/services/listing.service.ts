// Service — Listings CRUD
// Toda la lógica de negocio de listados vive aquí
import type { ListingFiltersInput, CreateListingInput, UpdateListingInput } from '~~/shared/schemas/listing.schema'
import { buildListingWhere, buildListingOrderBy } from '~~/server/lib/listingWhere'
import { publicCoords } from '~~/server/lib/coords'
import { activeFeatureWhere, featuredSelect, withFeatured } from '~~/server/lib/featureWhere'
import { canPublish, nextOwnerStatus } from '~~/server/lib/listingRules'

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
  const { page, limit } = filters

  const where = buildListingWhere(filters)
  const now = new Date()
  const select = {
    id: true, slug: true, type: true, mode: true, title: true, price: true, currency: true,
    city: true, sector: true, bedrooms: true, bathrooms: true, areaM2: true,
    latitude: true, longitude: true, ownerId: true, createdAt: true,
    photos: { orderBy: { order: 'asc' }, take: 1, select: { thumbUrl: true, url: true } },
    scenes: { orderBy: { order: 'asc' }, take: 1, select: { previewUrl: true } },
    features: featuredSelect(now),
  } as const
  const skip = (page - 1) * limit

  try {
    // Con orden "recent" y featuredFirst: primero los anuncios con ese espacio activo y luego el resto,
    // en dos consultas (Prisma no ordena por una relación condicional). La ventana [skip, skip+limit)
    // se reparte entre el tramo destacado (nFeatured anuncios) y el resto, sin repetir ni saltar.
    const prio = filters.featuredFirst && (!filters.sort || filters.sort === 'recent') ? filters.featuredFirst : null
    const fetchPage = async () => {
      if (!prio) {
        return prisma.listing.findMany({ where, select, orderBy: buildListingOrderBy(filters.sort), skip, take: limit })
      }
      const cond = activeFeatureWhere(now, [prio])
      const orderBy = buildListingOrderBy('recent')
      const featuredWhere = { AND: [where, { features: { some: cond } }] }
      const nFeatured = await prisma.listing.count({ where: featuredWhere })
      const head = skip < nFeatured
        ? await prisma.listing.findMany({ where: featuredWhere, select, orderBy, skip, take: limit })
        : []
      if (head.length >= limit) return head
      const tail = await prisma.listing.findMany({
        where: { AND: [where, { features: { none: cond } }] },
        select, orderBy, skip: Math.max(0, skip - nFeatured), take: limit - head.length,
      })
      return [...head, ...tail]
    }
    const [data, total] = await Promise.all([fetchPage(), prisma.listing.count({ where })])

    return {
      data: data.map((l) => publicCoords(withFeatured(l))),
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
  try {
    const listing = await prisma.listing.findUnique({
      where: { slug, deletedAt: null },
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
            _count: { select: { listings: { where: { status: 'ACTIVE', deletedAt: null } } } },
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
  try {
    return await prisma.listing.findUnique({
      where: { id, deletedAt: null },
      include: {
        photos: { orderBy: { order: 'asc' } },
        scenes: {
          orderBy: { order: 'asc' },
          include: { hotspots: true },
        },
        nearbyPlaces: { orderBy: { distanceM: 'asc' } },
        availability: { orderBy: { startDate: 'asc' } },
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
  try {
    return await prisma.listing.findMany({
      where: { ownerId, deletedAt: null },
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


  // Nace como borrador: se publica (ACTIVE) con publishListing, tras aceptar el contacto público.
  // `data` es la unión discriminada (apartamento/casa/villa): cada
  // rama trae solo sus propios campos, todos columnas opcionales del modelo.
  return prisma.listing.create({
    data: {
      ...(data as any),
      mode,
      slug,
      ownerId,
      price: data.price,
      status: 'DRAFT',
    },
  })
}

/**
 * Actualizar un listado (solo el dueño)
 */
export async function updateListing(id: string, data: UpdateListingInput, ownerId: string) {
  // Verificar propiedad
  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, deletedAt: true } })
  if (!listing || listing.deletedAt || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  return prisma.listing.update({
    where: { id },
    data,
  })
}

/**
 * Eliminar un listado (solo el dueño). Borrado lógico: se conservan pagos, denuncias y eventos.
 */
export async function deleteListing(id: string, ownerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, deletedAt: true } })
  if (!listing || listing.deletedAt || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para eliminar este anuncio' })
  }

  return prisma.listing.update({ where: { id }, data: { deletedAt: new Date() } })
}

async function ownedListingForStatus(id: string, ownerId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      ownerId: true, slug: true, deletedAt: true, status: true, contactConsentAt: true, adminPausedAt: true,
      _count: { select: { photos: true, scenes: true } },
    },
  })
  if (!listing || listing.deletedAt || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }
  return listing
}

/**
 * Publicar (DRAFT/PAUSED → ACTIVE). Exige consentimiento de contacto público (RQ-LEGAL-02).
 */
export async function publishListing(id: string, ownerId: string, contactConsent: boolean) {
  const listing = await ownedListingForStatus(id, ownerId)
  const check = canPublish({
    status: listing.status,
    photosCount: listing._count.photos,
    scenesCount: listing._count.scenes,
    contactConsentAt: contactConsent ? new Date() : listing.contactConsentAt,
    adminPausedAt: listing.adminPausedAt,
  })
  if (!check.ok) throw createError({ statusCode: 400, statusMessage: check.reason })
  const next = nextOwnerStatus(listing.status, 'publish')
  if (!next.ok) throw createError({ statusCode: 400, statusMessage: next.reason })

  const { count } = await prisma.listing.updateMany({
    where: { id, adminPausedAt: null, deletedAt: null, status: listing.status },
    data: {
      status: next.status as 'ACTIVE',
      ...(contactConsent && { contactConsentAt: new Date() }),
    },
  })
  if (count === 0) throw createError({ statusCode: 409, statusMessage: 'El anuncio cambió; recarga e inténtalo de nuevo' })
  return { id, slug: listing.slug, status: next.status }
}

/**
 * Pausar / reanudar (solo el dueño)
 */
export async function changeListingStatus(id: string, ownerId: string, action: 'pause' | 'resume') {
  const listing = await ownedListingForStatus(id, ownerId)
  // Reanudar publica de nuevo: mismos requisitos que publicar (fotos/escenas y consentimiento)
  if (action === 'resume') {
    const check = canPublish({
      status: listing.status,
      photosCount: listing._count.photos,
      scenesCount: listing._count.scenes,
      contactConsentAt: listing.contactConsentAt,
      adminPausedAt: listing.adminPausedAt,
    })
    if (!check.ok) throw createError({ statusCode: 400, statusMessage: check.reason })
  }
  const next = nextOwnerStatus(listing.status, action)
  if (!next.ok) throw createError({ statusCode: 400, statusMessage: next.reason })

  const { count } = await prisma.listing.updateMany({
    where: { id, adminPausedAt: null, deletedAt: null, status: listing.status },
    data: { status: next.status as 'ACTIVE' | 'PAUSED' },
  })
  if (count === 0) throw createError({ statusCode: 409, statusMessage: 'El anuncio cambió; recarga e inténtalo de nuevo' })
  return { id, slug: listing.slug, status: next.status }
}

/**
 * Agregar una foto a un anuncio (solo el dueño)
 */
export async function addPhoto(listingId: string, ownerId: string, data: { url: string; thumbUrl: string; name: string | null; order: number }) {
  await requireOwnedListing(listingId, ownerId)

  return prisma.photo.create({
    data: { listingId, url: data.url, thumbUrl: data.thumbUrl, name: data.name, order: data.order },
  })
}

export async function renamePhoto(photoId: string, ownerId: string, name: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { listingId: true } })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'Foto no encontrada' })
  await requireOwnedListing(photo.listingId, ownerId)

  return prisma.photo.update({ where: { id: photoId }, data: { name: name.trim() || null } })
}
