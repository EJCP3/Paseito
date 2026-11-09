<script setup lang="ts">
/**
 * ListingMap.client.vue — Mapa de solo lectura (Leaflet + tiles OSM) para el
 * pill "Mapa" del detalle del anuncio. Sin pin arrastrable: solo muestra la
 * ubicación ya confirmada por el dueño al publicar.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  lat: number
  lng: number
  // Si el pill vive dentro de un acordeón colapsado (grid-rows-[0fr], no
  // v-if), el contenedor mide 0 de alto cuando Leaflet se inicializa y el
  // mapa queda en blanco para siempre. Cuando el acordeón se abre, avisamos
  // por acá para recalcular el tamaño.
  active?: boolean
}>()

const containerRef = ref<HTMLElement>()
let map: L.Map | null = null

// Mismo patrón que TourViewer.client.vue / LocationPicker.client.vue: esperar
// a que el contenedor tenga tamaño real antes de instanciar el mapa.
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

onMounted(async () => {
  const container = await waitForContainer()
  if (!container) return

  map = L.map(container, { scrollWheelZoom: false }).setView([props.lat, props.lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  // Ubicación aproximada (RQ-LEGAL-03): círculo de ~300 m, sin pin
  L.circle([props.lat, props.lng], {
    radius: 300,
    color: '#A5D800',
    weight: 2,
    fillColor: '#C1FF00',
    fillOpacity: 0.3,
  }).addTo(map)

  // Montado ya con el acordeón abierto (montaje diferido en la primera apertura):
  // el watch de `active` no se dispara, así que se recalcula aquí tras la transición.
  if (props.active) await refreshSize()
})

async function refreshSize() {
  await new Promise((resolve) => setTimeout(resolve, 320))
  if (!map) return
  map.invalidateSize()
  map.setView([props.lat, props.lng], 15)
}

// Al abrir el acordeón: esperamos a que termine la transición CSS (300ms)
// antes de recalcular, si no Leaflet mide el contenedor todavía colapsado.
watch(() => props.active, async (isActive) => {
  if (!isActive || !map) return
  await refreshSize()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div>
    <div ref="containerRef" class="w-full h-64 rounded-2xl overflow-hidden" style="border: 1px solid var(--color-border);" />
    <p class="text-xs text-gray-400 mt-1.5 px-1">
      Ubicación aproximada. Mapa &copy; colaboradores de OpenStreetMap.
    </p>
  </div>
</template>
