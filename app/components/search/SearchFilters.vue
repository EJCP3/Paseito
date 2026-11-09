<script setup lang="ts">
/**
 * SearchFilters — formulario de filtros. Escribe en la URL vía useSearchFilters.
 * El texto va con debounce de 300 ms; el resto aplica al cambiar.
 */
import { ListingType, ListingTypeLabels } from '~~/shared/types/enums'
import locations from '~~/shared/data/rd-locations.json'

const { filters, activeCount, setFilters, clearFilters } = useSearchFilters()

const modes = [
  { key: 'SALE', label: 'Venta' },
  { key: 'RENT_LONG_TERM', label: 'Alquiler' },
  { key: 'RENT_DAILY', label: 'Por día' },
]
const sorts = [
  { key: 'recent', label: 'Más recientes' },
  { key: 'price_asc', label: 'Precio: menor a mayor' },
  { key: 'price_desc', label: 'Precio: mayor a menor' },
]
const cityOptions = locations.map((l) => l.city)
const sectorOptions = computed(() => locations.find((l) => l.city === filters.value.city)?.sectors ?? [])

// Texto con debounce; se resincroniza si la URL cambia desde fuera (back/forward, "Quitar filtros")
const text = ref(filters.value.search ?? '')
watch(() => filters.value.search, (v) => { if ((v ?? '') !== text.value) text.value = v ?? '' })
let t: ReturnType<typeof setTimeout> | undefined
watch(text, (v) => {
  clearTimeout(t)
  t = setTimeout(() => { if ((v || undefined) !== filters.value.search) setFilters({ search: v.trim() }) }, 300)
})
onBeforeUnmount(() => clearTimeout(t))

const onNum = (key: 'minPrice' | 'maxPrice' | 'minBedrooms' | 'minBathrooms' | 'minArea' | 'maxArea', e: Event) =>
  setFilters({ [key]: (e.target as HTMLInputElement).value })
const onCity = (e: Event) => setFilters({ city: (e.target as HTMLSelectElement).value, sector: null })

const label = 'text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1'
const field = 'w-full text-sm px-3 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:border-black'
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent>
    <div>
      <label for="f-search" :class="label">Buscar</label>
      <input id="f-search" v-model="text" type="search" placeholder="Título, ciudad, sector…" :class="field">
    </div>

    <div>
      <span :class="label">Tipo</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tp in [{ key: '', label: 'Todos' }, ...Object.values(ListingType).map((k) => ({ key: k, label: ListingTypeLabels[k] }))]"
          :key="tp.key"
          type="button"
          class="pill text-xs !py-1.5 !px-3"
          :aria-pressed="(filters.type ?? '') === tp.key"
          :style="(filters.type ?? '') === tp.key ? 'background: var(--color-neon); color: #0D0D0D;' : ''"
          @click="setFilters({ type: tp.key })"
        >{{ tp.label }}</button>
      </div>
    </div>

    <div>
      <label for="f-mode" :class="label">Modalidad</label>
      <select id="f-mode" :value="filters.mode ?? ''" :class="field" @change="setFilters({ mode: ($event.target as HTMLSelectElement).value })">
        <option value="">Cualquiera</option>
        <option v-for="m in modes" :key="m.key" :value="m.key">{{ m.label }}</option>
      </select>
    </div>

    <div>
      <label for="f-city" :class="label">Ciudad</label>
      <select id="f-city" :value="filters.city ?? ''" :class="field" @change="onCity">
        <option value="">Cualquier ciudad</option>
        <option v-for="c in cityOptions" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div>
      <label for="f-sector" :class="label">Sector</label>
      <select id="f-sector" :value="filters.sector ?? ''" :disabled="!filters.city" :class="field" @change="setFilters({ sector: ($event.target as HTMLSelectElement).value })">
        <option value="">{{ filters.city ? 'Cualquier sector' : 'Elige una ciudad primero' }}</option>
        <option v-for="s in sectorOptions" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div>
      <span :class="label">Precio</span>
      <div class="flex items-center gap-2">
        <input type="number" min="0" inputmode="numeric" placeholder="Mín." aria-label="Precio mínimo" :value="filters.minPrice" :class="field" @change="onNum('minPrice', $event)">
        <span class="text-gray-300">—</span>
        <input type="number" min="0" inputmode="numeric" placeholder="Máx." aria-label="Precio máximo" :value="filters.maxPrice" :class="field" @change="onNum('maxPrice', $event)">
      </div>
    </div>

    <div>
      <span :class="label">Área (m²)</span>
      <div class="flex items-center gap-2">
        <input type="number" min="0" inputmode="numeric" placeholder="Mín." aria-label="Área mínima" :value="filters.minArea" :class="field" @change="onNum('minArea', $event)">
        <span class="text-gray-300">—</span>
        <input type="number" min="0" inputmode="numeric" placeholder="Máx." aria-label="Área máxima" :value="filters.maxArea" :class="field" @change="onNum('maxArea', $event)">
      </div>
    </div>

    <div class="flex gap-2">
      <div class="flex-1">
        <label for="f-beds" :class="label">Habitaciones</label>
        <input id="f-beds" type="number" min="0" inputmode="numeric" placeholder="Mín." :value="filters.minBedrooms" :class="field" @change="onNum('minBedrooms', $event)">
      </div>
      <div class="flex-1">
        <label for="f-baths" :class="label">Baños</label>
        <input id="f-baths" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Mín." :value="filters.minBathrooms" :class="field" @change="onNum('minBathrooms', $event)">
      </div>
    </div>

    <div>
      <label for="f-sort" :class="label">Ordenar</label>
      <select id="f-sort" :value="filters.sort ?? 'recent'" :class="field" @change="setFilters({ sort: ($event.target as HTMLSelectElement).value })">
        <option v-for="s in sorts" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
    </div>

    <button v-if="activeCount" type="button" class="text-sm font-semibold underline text-left" @click="clearFilters()">
      Quitar filtros ({{ activeCount }})
    </button>
  </form>
</template>
