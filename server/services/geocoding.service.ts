// Service — Geocoding (dirección de texto -> coordenadas) vía Nominatim
// Solo se usa para centrar el mini-mapa cuando el dueño elige ciudad/sector;
// nunca para autocompletar mientras escribe (lo prohíbe la política de uso
// de Nominatim: https://operations.osmfoundation.org/policies/nominatim/).
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'Paseito/1.0 (contacto@paseito.com)'
const MIN_INTERVAL_MS = 1000 // Nominatim exige máximo 1 request/segundo

interface NominatimResult {
  lat: string
  lon: string
}

// Cola simple: cada llamada encadena a la anterior y espera lo que falte
// para completar 1 segundo desde el último request, sin importar cuántas
// geocodificaciones se disparen casi al mismo tiempo.
let queue: Promise<void> = Promise.resolve()
let lastRequestAt = 0

function throttle(): Promise<void> {
  const next = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt)
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    lastRequestAt = Date.now()
  })
  queue = next.catch(() => {})
  return next
}

/**
 * Convierte una dirección de texto en coordenadas. Devuelve null si
 * Nominatim no encuentra ningún resultado o si la consulta falla.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  await throttle()

  try {
    const results = await $fetch<NominatimResult[]>(NOMINATIM_URL, {
      query: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
    })

    const first = results?.[0]
    if (!first) return null

    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
  } catch (error) {
    console.error('[Geocoding Service] Error consultando Nominatim:', error)
    return null
  }
}

// Solo seguimos el link si es de un dominio de Google Maps — si no, este
// endpoint sería un proxy abierto para pedir cualquier URL desde el servidor.
const ALLOWED_MAPS_HOSTS = ['maps.app.goo.gl', 'goo.gl', 'google.com', 'www.google.com', 'maps.google.com']

// Google puede servir redirects distintos a un bot; con UA de navegador el link
// corto resuelve a la URL con coordenadas (verificado contra maps.app.goo.gl).
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

export function isAllowedMapsUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== 'https:') return false
    return ALLOWED_MAPS_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/**
 * Extrae lat/lng de una URL de Google Maps. Soporta varios formatos, en orden
 * de preferencia:
 *   1. `!3d<lat>!4d<lng>` — el punto exacto marcado (dentro del blob `data=`).
 *   2. `@<lat>,<lng>,<zoom>z` — centro del viewport.
 *   3. `?q=`/`?ll=`/`/search/`/`/place/`/`/dir/` — coordenadas en query o ruta,
 *      donde Google codifica el separador como coma + `+`/espacio (ej.
 *      `/maps/search/19.79,+-70.69`, adonde resuelven los links cortos).
 * Valida rangos (lat ∈ [-90,90], lng ∈ [-180,180]) para no confundir un par de
 * números cualquiera de la URL con coordenadas reales.
 */
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  // Google codifica el espacio del par "lat, lng" como '+' o '%20'.
  let decoded = url
  try { decoded = decodeURIComponent(url) } catch { /* URL mal formada: usa la cruda */ }
  decoded = decoded.replace(/\+/g, ' ')

  const build = (m: RegExpMatchArray | null) => {
    if (!m) return null
    const lat = parseFloat(m[1]!)
    const lng = parseFloat(m[2]!)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return { lat, lng }
  }

  return (
    build(url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)) ||
    build(url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)) ||
    // Primer par "lat, lng" con decimales tras normalizar el espacio (cubre
    // ?q=, ?ll=, /search/, /place/, /dir/ … y los links cortos ya resueltos).
    build(decoded.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/))
  )
}

/**
 * Resuelve un link de Google Maps (corto o completo) a coordenadas. Los links
 * cortos (`maps.app.goo.gl`) no exponen coordenadas hasta seguir su redirect,
 * y el navegador no puede seguirlo cross-origin — por eso se hace en servidor.
 *
 * Sigue los redirects manualmente (máx. 5 saltos): así valida el host de cada
 * salto antes de pedirlo (no es un proxy abierto) e intenta extraer las
 * coordenadas de cada URL intermedia, que es justo donde aparecen (el link
 * corto redirige a `/maps/search/<lat>,<lng>`), sin descargar el HTML del mapa.
 * Devuelve null si no es un link de Google, si falla, o si no hay coordenadas.
 */
export async function resolveGoogleMapsLink(inputUrl: string): Promise<{ lat: number; lng: number } | null> {
  if (!isAllowedMapsUrl(inputUrl)) return null

  // Por si ya es un link largo con coordenadas embebidas: sin pedir red.
  const direct = extractCoordsFromUrl(inputUrl)
  if (direct) return direct

  let currentUrl = inputUrl
  try {
    for (let hop = 0; hop < 5; hop++) {
      const response = await fetch(currentUrl, {
        redirect: 'manual',
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(8000),
      })

      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        const nextUrl = new URL(location, currentUrl).toString()
        const coords = extractCoordsFromUrl(nextUrl)
        if (coords) return coords
        // No seguir fuera de los dominios de Google (evita proxy abierto).
        if (!isAllowedMapsUrl(nextUrl)) return null
        currentUrl = nextUrl
        continue
      }

      // Respuesta final (sin más redirects): último intento con la URL final.
      return extractCoordsFromUrl(response.url || currentUrl)
    }
    return null
  } catch (error) {
    console.error('[Geocoding Service] Error resolviendo link de Google Maps:', error)
    return null
  }
}
