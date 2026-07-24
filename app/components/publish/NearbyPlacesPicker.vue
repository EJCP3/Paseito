<script setup lang="ts">
/**
 * NearbyPlacesPicker — Mini-mapa de ubicación + preview de puntos de interés
 * cercanos al publicar un inmueble. El dueño confirma el pin y puede
 * descartar POIs individuales antes de publicar (no editar texto, solo excluir).
 */
import type { NearbyPlaceResult } from '~~/shared/schemas/nearbyPlace.schema'

const props = defineProps<{
  city: string
  sector: string
  lat: number | null
  lng: number | null
  excludedNames: string[]
}>()

const emit = defineEmits<{
  (e: 'update:lat', v: number | null): void
  (e: 'update:lng', v: number | null): void
  (e: 'update:excludedNames', v: string[]): void
}>()

const pin = computed({
  get: () => (props.lat !== null && props.lng !== null ? { lat: props.lat, lng: props.lng } : null),
  set: (v: { lat: number; lng: number } | null) => {
    emit('update:lat', v?.lat ?? null)
    emit('update:lng', v?.lng ?? null)
  },
})

const geocodedCenter = ref<{ lat: number; lng: number } | null>(null)

// Geocodifica ciudad/sector para centrar el mapa. Se dispara con un pequeño
// debounce tras elegir, nunca en cada tecla (política de uso de Nominatim).
let geocodeTimer: ReturnType<typeof setTimeout> | null = null
watch(
  [() => props.city, () => props.sector],
  ([city, sector]) => {
    if (!city) return
    if (geocodeTimer) clearTimeout(geocodeTimer)
    geocodeTimer = setTimeout(async () => {
      try {
        const address = [sector, city, 'República Dominicana'].filter(Boolean).join(', ')
        const coords = await $fetch<{ lat: number; lng: number } | null>('/api/geocode', {
          method: 'POST',
          body: { address },
        })
        if (coords) geocodedCenter.value = coords
      } catch {
        // El mapa se queda en el centro por defecto; el dueño ajusta el pin a mano.
      }
    }, 600)
  },
  { immediate: true }
)

// --- Pegar un link de Google Maps: autocompleta el pin y busca los puntos
// de interés cercanos en un solo paso, sin arrastrar nada a mano ---
const locationPickerRef = ref<{ jumpTo: (lat: number, lng: number) => void } | null>(null)
const mapsLink = ref('')
const isResolvingLink = ref(false)
const mapsLinkError = ref('')

async function useMapsLink() {
  const url = mapsLink.value.trim()
  if (!url) return

  isResolvingLink.value = true
  mapsLinkError.value = ''
  try {
    const coords = await $fetch<{ lat: number; lng: number }>('/api/geocode-maps-link', {
      method: 'POST',
      body: { url },
    })
    locationPickerRef.value?.jumpTo(coords.lat, coords.lng)
    await searchNearby()
  } catch {
    mapsLinkError.value = 'No pudimos leer ese link. Ajusta el pin manualmente en el mapa.'
  } finally {
    isResolvingLink.value = false
  }
}

const previewPlaces = ref<NearbyPlaceResult[]>([])
const isSearching = ref(false)
const searchError = ref(false)
const hasSearched = ref(false)

async function searchNearby() {
  if (!pin.value) return
  isSearching.value = true
  searchError.value = false
  try {
    previewPlaces.value = await $fetch<NearbyPlaceResult[]>('/api/listings/nearby-places-preview', {
      method: 'POST',
      body: { lat: pin.value.lat, lng: pin.value.lng },
    })
    emit('update:excludedNames', [])
  } catch {
    searchError.value = true
  } finally {
    isSearching.value = false
    hasSearched.value = true
  }
}

function isExcluded(name: string) {
  return props.excludedNames.includes(name)
}

function toggleExcluded(name: string) {
  const next = isExcluded(name)
    ? props.excludedNames.filter((n) => n !== name)
    : [...props.excludedNames, name]
  emit('update:excludedNames', next)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Alternativa: pegar un link de Google Maps en vez de arrastrar el pin -->
    <div class="flex gap-2">
      <input
        v-model="mapsLink"
        type="text"
        class="field-input flex-1"
        placeholder="Pega un link de Google Maps (maps.app.goo.gl/...)"
        @keydown.enter.prevent="useMapsLink"
      />
      <button
        type="button"
        class="btn btn-sm flex-shrink-0"
        style="border: 1px solid var(--color-border);"
        :disabled="!mapsLink.trim() || isResolvingLink"
        @click="useMapsLink"
      >
        <Icon name="link" class="w-3.5 h-3.5 inline mr-1" />
        {{ isResolvingLink ? 'Leyendo…' : 'Usar link' }}
      </button>
    </div>
    <p v-if="mapsLinkError" class="text-xs text-red-600 px-1">{{ mapsLinkError }}</p>

    <LocationPicker ref="locationPickerRef" v-model="pin" :center="geocodedCenter" />

    <button
      type="button"
      class="btn btn-sm w-full"
      style="border: 1px solid var(--color-border);"
      :disabled="isSearching || !pin"
      @click="searchNearby"
    >
      {{ isSearching ? 'Buscando lugares cercanos...' : 'Buscar puntos de interés cercanos' }}
    </button>

    <p v-if="searchError" class="text-xs text-red-600 px-1">
      No pudimos buscar lugares cercanos ahora mismo. Puedes continuar sin ellos.
    </p>

    <div v-else-if="hasSearched" class="rounded-2xl p-4" style="background: #f4f4f1;">
      <p v-if="previewPlaces.length" class="text-sm font-semibold mb-2">Esto encontramos cerca de tu propiedad</p>
      <p v-else class="text-sm" style="color: var(--color-muted);">
        No encontramos lugares cercanos registrados en OpenStreetMap.
      </p>

      <ul v-if="previewPlaces.length" class="space-y-1.5">
        <li
          v-for="place in previewPlaces"
          :key="`${place.name}-${place.lat}-${place.lng}`"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <span class="flex items-center gap-2 min-w-0" :class="{ 'opacity-40 line-through': isExcluded(place.name) }">
            <Icon :name="NEARBY_PLACE_CATEGORY_META[place.category]?.icon || 'mapPin'" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ place.name }}</span>
            <span class="flex-shrink-0" style="color: var(--color-muted);">— {{ place.distanceM }}m</span>
          </span>
          <button
            type="button"
            class="text-xs font-medium flex-shrink-0 hover:opacity-70 transition-opacity"
            style="color: var(--color-muted);"
            @click="toggleExcluded(place.name)"
          >
            {{ isExcluded(place.name) ? 'Incluir' : 'Descartar' }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
