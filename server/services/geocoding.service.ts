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
