// Service — Puntos de interés cercanos (búsqueda vía Overpass API + persistencia)
import type { NearbyPlaceResult, NearbyPlaceCategory } from '~~/shared/schemas/nearbyPlace.schema'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const USER_AGENT = 'Paseito/1.0 (contacto@paseito.com)'
const DEFAULT_RADIUS_M = 800
const MAX_RESULTS = 30

interface OverpassElement {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

/**
 * Construye la query Overpass QL: busca nodes y ways con los tags relevantes
 * (supermercados, colmados/tiendas, farmacias, escuelas, bancos, paradas de
 * transporte público) dentro de un radio "around:radiusM,lat,lng" alrededor
 * del punto del listado.
 */
function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  const around = `around:${radiusM},${lat},${lng}`
  const filters = [
    '["shop"="supermarket"]',
    '["shop"="convenience"]',
    '["amenity"="pharmacy"]',
    '["amenity"="school"]',
    '["amenity"="bank"]',
    '["highway"="bus_stop"]',
    '["public_transport"]',
  ]

  const clauses = filters
    .map((tag) => `  node${tag}(${around});\n  way${tag}(${around});`)
    .join('\n')

  // "out center tags" resuelve además un lat/lon para los ways (centro del
  // polígono), así los nodos y los ways se procesan de forma uniforme.
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags;`
}

/**
 * Mapea los tags de OpenStreetMap a las categorías del enum de Paseito.
 * Devuelve null si el elemento no corresponde a ninguna categoría soportada.
 */
function mapTagsToCategory(tags: Record<string, string>): NearbyPlaceCategory | null {
  if (tags.shop === 'supermarket') return 'supermarket'
  if (tags.shop === 'convenience') return 'store'
  if (tags.amenity === 'pharmacy') return 'pharmacy'
  if (tags.amenity === 'school') return 'school'
  if (tags.amenity === 'bank') return 'bank'
  if (tags.highway === 'bus_stop') return 'transit'
  if (tags.public_transport) return 'transit'
  return null
}

/**
 * Distancia real entre dos coordenadas, en metros (fórmula de Haversine).
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_M = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * OSM suele mapear el mismo lugar físico con varios nodos (p. ej. una parada
 * de bus con un nodo por sentido, o un comercio con nodo + way superpuestos).
 * Deduplicamos por nombre+categoría, quedándonos con la instancia más cercana.
 */
function dedupePlaces(places: NearbyPlaceResult[]): NearbyPlaceResult[] {
  const closest = new Map<string, NearbyPlaceResult>()

  for (const place of places) {
    const key = `${place.category}|${place.name.toLowerCase()}`
    const existing = closest.get(key)
    if (!existing || place.distanceM < existing.distanceM) {
      closest.set(key, place)
    }
  }

  return [...closest.values()]
}

/**
 * Busca los puntos de interés cercanos a una coordenada usando Overpass API.
 * Si Overpass falla, está caído o tarda demasiado, devuelve un arreglo vacío
 * en vez de lanzar — la publicación del listado nunca debe romperse por esto.
 */
export async function searchNearbyPlaces(params: { lat: number; lng: number; radiusM?: number }): Promise<NearbyPlaceResult[]> {
  const { lat, lng, radiusM = DEFAULT_RADIUS_M } = params
  const query = buildOverpassQuery(lat, lng, radiusM)

  try {
    const response = await $fetch<OverpassResponse>(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 20000,
    })

    const results: NearbyPlaceResult[] = []

    for (const el of response.elements ?? []) {
      const name = el.tags?.name?.trim()
      if (!name) continue // descartamos POIs sin nombre

      const category = mapTagsToCategory(el.tags ?? {})
      if (!category) continue

      const poiLat = el.lat ?? el.center?.lat
      const poiLng = el.lon ?? el.center?.lon
      if (poiLat === undefined || poiLng === undefined) continue

      results.push({
        name,
        category,
        distanceM: Math.round(haversineDistance(lat, lng, poiLat, poiLng)),
        lat: poiLat,
        lng: poiLng,
      })
    }

    return dedupePlaces(results).sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_RESULTS)
  } catch (error) {
    console.error('[NearbyPlaces Service] Error consultando Overpass, se continúa sin POIs:', error)
    return []
  }
}

/**
 * Reemplaza los NearbyPlace guardados de un listado: borra los anteriores e
 * inserta los nuevos. Permite re-detección si el dueño mueve el pin.
 */
export async function saveNearbyPlaces(listingId: string, places: NearbyPlaceResult[]) {
  return prisma.$transaction(async (tx) => {
    await tx.nearbyPlace.deleteMany({ where: { listingId } })

    return Promise.all(
      places.map((p) =>
        tx.nearbyPlace.create({
          data: { name: p.name, category: p.category, distanceM: p.distanceM, lat: p.lat, lng: p.lng, listingId },
        })
      )
    )
  })
}

/**
 * Detecta y guarda los POIs cercanos de un listado ya existente, verificando
 * que quien llama sea el dueño del anuncio. `excludeNames` son los POIs que
 * el dueño descartó a mano en el preview del mapa.
 */
export async function detectAndSaveNearbyPlaces(
  listingId: string,
  ownerId: string,
  lat: number,
  lng: number,
  excludeNames: string[] = []
) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } })
  if (!listing || listing.ownerId !== ownerId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permiso para editar este anuncio' })
  }

  const found = await searchNearbyPlaces({ lat, lng })
  const filtered = excludeNames.length ? found.filter((p) => !excludeNames.includes(p.name)) : found

  return saveNearbyPlaces(listingId, filtered)
}

/**
 * Obtiene los POIs guardados de un listado, ordenados por distancia.
 */
export async function getNearbyPlacesByListingId(listingId: string) {
  return prisma.nearbyPlace.findMany({
    where: { listingId },
    orderBy: { distanceM: 'asc' },
  })
}
