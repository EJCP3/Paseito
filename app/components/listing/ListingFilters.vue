<script setup lang="ts">
/**
 * ListingFilters — Filtros de búsqueda con pills
 * Tipo, precio, ciudad, habitaciones
 */
import { ListingType, ListingTypeLabels, ListingTypeIcons } from '~~/shared/types/enums'
import locations from '~~/shared/data/rd-locations.json'

const emit = defineEmits<{
  (e: 'update:filters', filters: Record<string, any>): void
}>()

const selectedType = ref<string | null>(null)
const searchQuery = ref('')
const minPrice = ref<number | undefined>()
const maxPrice = ref<number | undefined>()
const selectedCity = ref<string | null>(null)
const selectedSector = ref<string | null>(null)

// Sectores de la ciudad elegida (mismo vocabulario que el form de publicación)
const sectorsForCity = computed(() =>
  locations.find((l) => l.city === selectedCity.value)?.sectors ?? []
)
watch(selectedCity, () => { selectedSector.value = null })

const types = [
  { value: null, label: 'Todos', icon: 'tag' },
  { value: ListingType.APARTMENT, label: ListingTypeLabels[ListingType.APARTMENT], icon: ListingTypeIcons[ListingType.APARTMENT] },
  { value: ListingType.HOUSE, label: ListingTypeLabels[ListingType.HOUSE], icon: ListingTypeIcons[ListingType.HOUSE] },
  { value: ListingType.VEHICLE, label: ListingTypeLabels[ListingType.VEHICLE], icon: ListingTypeIcons[ListingType.VEHICLE] },
]

// Provincias reales de RD (dataset compartido con el form de publicación)
const cities = locations.map((l) => l.city)

function emitFilters() {
  emit('update:filters', {
    type: selectedType.value || undefined,
    search: searchQuery.value || undefined,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    city: selectedCity.value || undefined,
    sector: selectedSector.value || undefined,
  })
}

// Emitir cuando cambian los filtros
watch([selectedType, searchQuery, minPrice, maxPrice, selectedCity, selectedSector], emitFilters)
</script>

<template>
  <div class="space-y-4" id="listing-filters">
    <!-- Barra de búsqueda -->
    <div class="relative">
      <Icon name="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style="color: var(--color-muted-light);" />
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
        <Icon :name="t.icon" class="w-3.5 h-3.5" />
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

      <!-- Sector (dependiente de la ciudad) -->
      <select
        v-model="selectedSector"
        class="select select-sm select-bordered rounded-full text-sm"
        style="font-family: var(--font-body);"
        :disabled="!sectorsForCity.length"
        id="filter-sector"
      >
        <option :value="null">{{ sectorsForCity.length ? 'Todos los sectores' : 'Sector (elige ciudad)' }}</option>
        <option v-for="s in sectorsForCity" :key="s" :value="s">{{ s }}</option>
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
