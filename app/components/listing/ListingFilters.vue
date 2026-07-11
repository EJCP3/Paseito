<script setup lang="ts">
/**
 * ListingFilters — Filtros de búsqueda con pills
 * Tipo, precio, ciudad, habitaciones
 */
import { ListingType, ListingTypeLabels, ListingTypeIcons } from '~~/shared/types/enums'

const emit = defineEmits<{
  (e: 'update:filters', filters: Record<string, any>): void
}>()

const selectedType = ref<string | null>(null)
const searchQuery = ref('')
const minPrice = ref<number | undefined>()
const maxPrice = ref<number | undefined>()
const selectedCity = ref<string | null>(null)

const types = [
  { value: null, label: 'Todos', icon: '🏷️' },
  { value: ListingType.APARTMENT, label: ListingTypeLabels[ListingType.APARTMENT], icon: ListingTypeIcons[ListingType.APARTMENT] },
  { value: ListingType.HOUSE, label: ListingTypeLabels[ListingType.HOUSE], icon: ListingTypeIcons[ListingType.HOUSE] },
  { value: ListingType.VEHICLE, label: ListingTypeLabels[ListingType.VEHICLE], icon: ListingTypeIcons[ListingType.VEHICLE] },
]

// Ciudades de ejemplo
const cities = ['Santo Domingo', 'Santiago', 'Punta Cana', 'La Romana', 'Puerto Plata']

function emitFilters() {
  emit('update:filters', {
    type: selectedType.value || undefined,
    search: searchQuery.value || undefined,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    city: selectedCity.value || undefined,
  })
}

// Emitir cuando cambian los filtros
watch([selectedType, searchQuery, minPrice, maxPrice, selectedCity], emitFilters)
</script>

<template>
  <div class="space-y-4" id="listing-filters">
    <!-- Barra de búsqueda -->
    <div class="relative">
      <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style="color: var(--color-muted-light);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por título, ciudad o sector..."
        class="w-full pl-12 pr-4 py-3 rounded-full border text-sm focus:outline-none focus:ring-2 transition-all"
        style="border-color: var(--color-border); background: var(--color-surface-elevated); font-family: var(--font-body);"
        id="filter-search"
      />
    </div>

    <!-- Pills de tipo -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in types"
        :key="String(t.value)"
        class="pill"
        :class="{ active: selectedType === t.value }"
        @click="selectedType = t.value"
        :id="`filter-type-${t.value || 'all'}`"
      >
        <span>{{ t.icon }}</span>
        {{ t.label }}
      </button>
    </div>

    <!-- Filtros avanzados (colapsables en móvil) -->
    <div class="flex flex-wrap gap-3 items-center">
      <!-- Ciudad -->
      <select
        v-model="selectedCity"
        class="select select-sm select-bordered rounded-full text-sm"
        style="font-family: var(--font-body);"
        id="filter-city"
      >
        <option :value="null">Todas las ciudades</option>
        <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
      </select>

      <!-- Rango de precio -->
      <div class="flex items-center gap-2">
        <input
          v-model.number="minPrice"
          type="number"
          placeholder="Precio mín."
          class="input input-sm input-bordered rounded-full w-28 text-sm"
          id="filter-min-price"
        />
        <span class="text-xs" style="color: var(--color-muted);">—</span>
        <input
          v-model.number="maxPrice"
          type="number"
          placeholder="Precio máx."
          class="input input-sm input-bordered rounded-full w-28 text-sm"
          id="filter-max-price"
        />
      </div>
    </div>
  </div>
</template>
