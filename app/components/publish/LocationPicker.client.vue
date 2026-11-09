<script setup lang="ts">
/**
 * LocationPicker.client.vue — Mini-mapa con pin arrastrable (Leaflet + tiles OSM)
 * El dueño confirma la ubicación exacta del inmueble antes de guardarla.
 * Renderiza solo en cliente (Leaflet necesita `window`/DOM real).
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  modelValue: { lat: number; lng: number } | null
  center?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { lat: number; lng: number }): void
}>()

// Santo Domingo — centro por defecto si aún no hay ciudad/sector elegidos
const DEFAULT_CENTER = { lat: 18.4861, lng: -69.9312 }

const containerRef = ref<HTMLElement>()
let map: L.Map | null = null
let marker: L.Marker | null = null
// Solo re-centramos por geocoding mientras el dueño no haya tocado el pin a
// mano (drag o click) — a partir de ahí, su elección manda siempre.
let hasUserInteracted = !!props.modelValue

// Igual que en TourViewer.client.vue: en carga completa el ref del contenedor
// puede estar aún sin medir tamaño real cuando corre onMounted. Esperamos a
// que exista y tenga dimensiones antes de instanciar el mapa.
function waitForContainer(frames = 120): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const check = (n: number) => {
      const el = containerRef.value
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) return resolve(el)
      if (n <= 0) return resolve(el ?? null)
      requestAnimationFrame(() => check(n - 1))
    }
    check(frames)
  })
}

function setPin(lat: number, lng: number) {
  marker?.setLatLng([lat, lng])
  emit('update:modelValue', { lat, lng })
}

onMounted(async () => {
  const container = await waitForContainer()
  if (!container) return // desmontado antes de estar listo

  const start = props.modelValue ?? props.center ?? DEFAULT_CENTER

  map = L.map(container).setView([start.lat, start.lng], props.modelValue ? 16 : 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  marker = L.marker([start.lat, start.lng], { draggable: true }).addTo(map)
  marker.on('dragend', () => {
    hasUserInteracted = true
    const pos = marker!.getLatLng()
    emit('update:modelValue', { lat: pos.lat, lng: pos.lng })
  })

  map.on('click', (e: L.LeafletMouseEvent) => {
    hasUserInteracted = true
    setPin(e.latlng.lat, e.latlng.lng)
  })

  // Si no había una ubicación previa, confirmamos el centro inicial como punto de partida
  if (!props.modelValue) {
    emit('update:modelValue', { lat: start.lat, lng: start.lng })
  }
})

// Cuando el geocoding resuelve un centro nuevo (ciudad/sector recién elegidos)
// y el dueño todavía no ha tocado el pin a mano, recentramos el mapa.
watch(() => props.center, (center) => {
  if (!center || !map || hasUserInteracted) return
  map.setView([center.lat, center.lng], 15)
  setPin(center.lat, center.lng)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// Salto explícito a una coordenada (ej. resuelta desde un link de Google
// Maps pegado por el dueño) — a diferencia del watcher de `center`, esto
// siempre recentra el mapa aunque el dueño ya haya tocado el pin antes,
// porque es una acción deliberada, no un re-centrado automático de fondo.
function jumpTo(lat: number, lng: number) {
  hasUserInteracted = true
  map?.setView([lat, lng], 16)
  setPin(lat, lng)
}

defineExpose({ jumpTo })
</script>

<template>
  <div>
    <div ref="containerRef" class="w-full h-64 rounded-2xl overflow-hidden" style="border: 1px solid var(--color-border);" />
    <p class="text-xs mt-1.5 px-1" style="color: var(--color-muted);">
      Arrastra el pin (o toca el mapa) para confirmar la ubicación exacta de tu propiedad. Mapa &copy; colaboradores de OpenStreetMap.
    </p>
  </div>
</template>
