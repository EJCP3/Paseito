<script setup lang="ts">
/**
 * SearchMap.client.vue — Resultados como círculos de ~300 m sobre la coordenada
 * pública (RQ-LEGAL-03). Click en un círculo: popup con enlace al anuncio.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{ listings: any[] }>()

const containerRef = ref<HTMLElement>()
let map: L.Map | null = null
let layer: L.FeatureGroup | null = null

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function draw() {
  if (!map || !layer) return
  layer.clearLayers()
  for (const l of props.listings) {
    if (typeof l.latitude !== 'number' || typeof l.longitude !== 'number') continue
    const price = new Intl.NumberFormat('es-DO', { style: 'currency', currency: l.currency || 'USD', maximumFractionDigits: 0 }).format(Number(l.price))
    L.circle([l.latitude, l.longitude], { radius: 300, color: '#A5D800', weight: 2, fillColor: '#C1FF00', fillOpacity: 0.35 })
      .bindPopup(`<a href="/anuncio/${encodeURIComponent(l.slug)}"><strong>${esc(l.title)}</strong><br>${esc(price)}</a>`)
      .addTo(layer)
  }
  const b = layer.getBounds()
  if (b.isValid()) map.fitBounds(b, { padding: [32, 32], maxZoom: 15 })
}

onMounted(() => {
  map = L.map(containerRef.value!, { scrollWheelZoom: false }).setView([18.7357, -70.1627], 8)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  layer = L.featureGroup().addTo(map)
  draw()
})

watch(() => props.listings, draw)
onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div>
    <div ref="containerRef" class="w-full h-[60vh] min-h-[360px] rounded-2xl overflow-hidden" style="border: 1px solid var(--color-border);" />
    <p class="text-xs text-gray-400 mt-1.5 px-1">Ubicaciones aproximadas (~300 m).</p>
  </div>
</template>
