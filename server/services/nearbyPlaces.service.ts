// Service — Puntos de interés cercanos (búsqueda vía Overpass API + persistencia)
import type { NearbyPlaceResult, NearbyPlaceCategory } from '~~/shared/schemas/nearbyPlace.schema'

// El servidor público de Overpass es poco fiable (504/429); probamos varios
// mirrors en orden hasta que uno responda.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const USER_AGENT = 'Paseito/1.0 (contacto@paseito.com)'
const DEFAULT_RADIUS_M = 800
const MAX_RESULTS = 30

// Caché en memoria por zona (lat/lng redondeados ~100m + radio) para no repetir
// la misma consulta a Overpass y aliviar el rate-limit. TTL de 1h.
// ponytail: caché en memoria, por instancia; si hay varias instancias o se
// necesita persistencia, mover a Redis/tabla. Suficiente para el MVP.
const CACHE_TTL_MS = 60 * 60 * 1000
const nearbyCache = new Map<string, { at: number; places: NearbyPlaceResult[] }>()

function cacheKey(lat: number, lng: number, radiusM: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`
}

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
 * Consulta Overpass probando cada mirror en orden, con un reintento y backoff
 * por endpoint (más largo ante 429). Lanza si TODOS los mirrors fallan, para
 * que quien llama pueda distinguir "servicio caído" de "no hay lugares".
 */
async function fetchOverpassElements(query: string): Promise<OverpassElement[]> {
  let lastError: unknown

  for (const url of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await $fetch<OverpassResponse>(url, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 20000,
        })
        return response.elements ?? []
      } catch (error: any) {
        lastError = error
        const status = error?.response?.status ?? error?.statusCode
        // 429 (rate limit) espera más antes de reintentar; el resto, backoff corto.
        const backoffMs = status === 429 ? 1500 * (attempt + 1) : 500 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
      }
    }
  }

  throw lastError ?? new Error('Overpass no disponible')
}

/**
 * Busca los puntos de interés cercanos a una coordenada usando Overpass API.
 * Devuelve un arreglo (posiblemente vacío = no hay POIs) en caso de éxito, o
 * LANZA si el servicio está caído tras probar todos los mirrors — así el
 * endpoint de preview puede avisar al usuario en vez de mostrar "no hay lugares".
 * Los resultados se cachean por zona para no repetir la consulta.
 */
export async function searchNearbyPlaces(params: { lat: number; lng: number; radiusM?: number }): Promise<NearbyPlaceResult[]> {
  const { lat, lng, radiusM = DEFAULT_RADIUS_M } = params

  const key = cacheKey(lat, lng, radiusM)
  const cached = nearbyCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.places

  const query = buildOverpassQuery(lat, lng, radiusM)
  const elements = await fetchOverpassElements(query) // lanza si todo falla

  const results: NearbyPlaceResult[] = []
  for (const el of elements) {
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

  const places = dedupePlaces(results).sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_RESULTS)
  nearbyCache.set(key, { at: Date.now(), places })
  return places
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

  // Al publicar, un Overpass caído no debe romper el flujo: se guarda sin POIs.
  let found: NearbyPlaceResult[] = []
  try {
    found = await searchNearbyPlaces({ lat, lng })
  } catch (error) {
    console.error('[NearbyPlaces Service] Overpass no disponible al publicar, se guarda sin POIs:', error)
  }
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
