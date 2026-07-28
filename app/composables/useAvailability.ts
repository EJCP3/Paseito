// Composable — useAvailability
// Fetch/mutación de rangos de disponibilidad de una villa, reusado por el
// editor (dueño) y la vista pública de solo lectura.
import type { AvailabilityRange } from '~~/shared/types/listing'
import type { AvailabilityStatus } from '~~/shared/types/enums'

export function useAvailability(listingId: string, initial?: AvailabilityRange[]) {
  const ranges = ref<AvailabilityRange[]>(initial ?? [])
  const loading = ref(false)
  const error = ref('')

  async function fetchRanges() {
    loading.value = true
    error.value = ''
    try {
      ranges.value = await $fetch<AvailabilityRange[]>(`/api/listings/${listingId}/availability`)
    } catch {
      error.value = 'No se pudo cargar la disponibilidad.'
    } finally {
      loading.value = false
    }
  }

  async function saveRange(range: { id?: string; startDate: Date | string; endDate: Date | string; status: AvailabilityStatus }) {
    const saved = await $fetch<AvailabilityRange>(`/api/listings/${listingId}/availability`, {
      method: 'PUT',
      body: range,
    })
    const idx = ranges.value.findIndex((r) => r.id === saved.id)
    if (idx !== -1) ranges.value[idx] = saved
    else ranges.value.push(saved)
    return saved
  }

  async function deleteRange(rangeId: string) {
    await $fetch(`/api/listings/${listingId}/availability/${rangeId}`, { method: 'DELETE' })
    ranges.value = ranges.value.filter((r) => r.id !== rangeId)
  }

  if (!initial) fetchRanges()

  return { ranges, loading, error, fetchRanges, saveRange, deleteRange }
}
