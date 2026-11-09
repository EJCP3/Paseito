import { ListingFiltersSchema } from '~~/shared/schemas/listing.schema'

// Filtros de búsqueda sincronizados con la URL (?city=&type=&…). Compartible y
// con back/forward: cada filtro crea una entrada de historial; el texto (con debounce)
// la reemplaza para no llenar el historial con cada pulsación.
const NUMERIC_KEYS = new Set<string>(['minPrice', 'maxPrice', 'minBedrooms', 'minBathrooms', 'minArea', 'maxArea'])

export const SEARCH_KEYS = [
  'type', 'mode', 'city', 'sector', 'minPrice', 'maxPrice',
  'minBedrooms', 'minBathrooms', 'minArea', 'maxArea', 'search', 'sort',
] as const
export type SearchKey = (typeof SEARCH_KEYS)[number]
export type SearchFilters = Partial<Record<SearchKey, string>>

export function useSearchFilters() {
  const route = useRoute()

  const filters = computed<SearchFilters>(() => {
    const out: SearchFilters = {}
    for (const k of SEARCH_KEYS) {
      const v = route.query[k]
      const s = Array.isArray(v) ? v[0] : v
      if (s) out[k] = String(s)
    }
    return out
  })

  // Lo que se envía a la API: descarta los valores que no validan contra el schema
  // (?type=foo, ?sort=x, números inválidos) para que /buscar no falle con 400.
  const apiQuery = computed<SearchFilters>(() => {
    const out: SearchFilters = {}
    for (const [k, v] of Object.entries(filters.value) as [SearchKey, string][]) {
      const value = NUMERIC_KEYS.has(k) ? Number(v) : v
      if (ListingFiltersSchema.shape[k].safeParse(value).success) out[k] = v
    }
    return out
  })

  const activeCount = computed(() => Object.keys(apiQuery.value).filter((k) => k !== 'sort').length)

  function setFilters(patch: Partial<Record<SearchKey, string | number | null | undefined>>) {
    const merged: Record<string, string | number | null | undefined> = { ...filters.value, ...patch }
    const next = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => [k, String(v)]),
    )
    const onlyText = Object.keys(patch).every((k) => k === 'search')
    return navigateTo({ path: '/buscar', query: next }, { replace: onlyText })
  }

  const clearFilters = () => navigateTo({ path: '/buscar', query: {} })

  return { filters, apiQuery, activeCount, setFilters, clearFilters }
}
