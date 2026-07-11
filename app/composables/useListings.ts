// Composable — useListings
// Fetch de listados con filtros y paginación
import type { ListingFilters, PaginatedResponse } from '~~/shared/types/listing'

export function useListings() {
  const filters = ref<Partial<ListingFilters>>({})
  const page = ref(1)
  const limit = ref(12)

  // Build query string from filters
  const queryParams = computed(() => {
    const params: Record<string, string> = {}
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.city) params.city = filters.value.city
    if (filters.value.sector) params.sector = filters.value.sector
    if (filters.value.minPrice !== undefined) params.minPrice = String(filters.value.minPrice)
    if (filters.value.maxPrice !== undefined) params.maxPrice = String(filters.value.maxPrice)
    if (filters.value.minBedrooms !== undefined) params.minBedrooms = String(filters.value.minBedrooms)
    if (filters.value.search) params.search = filters.value.search
    params.page = String(page.value)
    params.limit = String(limit.value)
    return params
  })

  const { data, pending, error, refresh } = useFetch('/api/listings', {
    query: queryParams,
    watch: [queryParams],
  })

  function updateFilters(newFilters: Partial<ListingFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    page.value = 1 // Reset page on filter change
  }

  function nextPage() {
    const result = data.value as PaginatedResponse<any> | null
    if (result && page.value < result.totalPages) {
      page.value++
    }
  }

  function prevPage() {
    if (page.value > 1) page.value--
  }

  return {
    listings: computed(() => (data.value as PaginatedResponse<any> | null)?.data || []),
    total: computed(() => (data.value as PaginatedResponse<any> | null)?.total || 0),
    totalPages: computed(() => (data.value as PaginatedResponse<any> | null)?.totalPages || 0),
    currentPage: page,
    loading: pending,
    error,
    filters,
    updateFilters,
    nextPage,
    prevPage,
    refresh,
  }
}
