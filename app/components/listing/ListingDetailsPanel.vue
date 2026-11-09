<script setup lang="ts">
/**
 * ListingDetailsPanel — Acordeón de secciones
 * Tres filas: Descripción, Características, Ubicación y vendedor
 */
import { ListingTypeLabels } from '~~/shared/types/enums'
import type { ListingFull } from '~~/shared/types/listing'

const props = defineProps<{
  listing: ListingFull
}>()

const activeAccordion = ref<string>('descripcion')

// Mapa y calendario (Leaflet / v-calendar) se montan la primera vez que se abre
// su acordeón y se quedan montados (no se descargan sus chunks hasta entonces).
const opened = reactive<Record<string, boolean>>({})

function toggleAccordion(id: string) {
  activeAccordion.value = activeAccordion.value === id ? '' : id
  if (activeAccordion.value) opened[activeAccordion.value] = true
}

// Specs para la grid de características
const specs = computed(() => {
  const s: { label: string; value: string }[] = []

  if (props.listing.type === 'APARTMENT' || props.listing.type === 'HOUSE' || props.listing.type === 'VILLA') {
    if (props.listing.areaM2) s.push({ label: 'Área', value: `${props.listing.areaM2} m²` })
    if (props.listing.bedrooms !== null && props.listing.bedrooms !== undefined) s.push({ label: 'Habitaciones', value: String(props.listing.bedrooms) })
    if (props.listing.bathrooms !== null && props.listing.bathrooms !== undefined) s.push({ label: 'Baños', value: String(props.listing.bathrooms) })
    if (props.listing.parking !== null && props.listing.parking !== undefined) s.push({ label: 'Estacionamientos', value: String(props.listing.parking) })
  }

  return s
})

const locationText = computed(() => [props.listing.sector, props.listing.city].filter(Boolean).join(', '))

const nearbyPlaces = computed(() => props.listing.nearbyPlaces ?? [])
const availability = computed(() => props.listing.availability ?? [])

const mapCenter = computed(() => {
  const { latitude, longitude } = props.listing
  if (latitude == null || longitude == null) return null
  return { lat: latitude, lng: longitude }
})

const whatsappUrl = computed(() => {
  const phone = props.listing.owner?.phone || ''
  const message = encodeURIComponent(
    `Hola, me interesa el anuncio "${props.listing.title}" en Paseito. ¿Podemos coordinar una visita?`
  )
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`
})

// Copiar el link del anuncio al portapapeles (con fallback si el navegador
// bloquea la Clipboard API, ej. contexto no seguro)
const linkCopied = ref(false)
async function copyListingLink() {
  const url = `${window.location.origin}/anuncio/${props.listing.slug}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

<template>
  <div id="listing-details-panel" class="flex flex-col gap-3">
    <!-- Descripción general -->
    <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('descripcion')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Descripción general</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'descripcion' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <p class="text-[16px] text-gray-600 leading-relaxed font-normal whitespace-pre-line">
              {{ listing.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Características y Amenidades -->
    <div v-if="specs.length" class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('caracteristicas')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Características y Amenidades</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'caracteristicas' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-for="spec in specs" :key="spec.label">
                <p class="text-[13px] text-gray-500">{{ spec.label }}</p>
                <p class="text-[16px] font-medium" style="font-family: var(--font-body);">{{ spec.value }}</p>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <span class="pill !bg-white !border-0 text-xs">
                {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
              </span>
              <span class="pill !bg-white !border-0 text-xs">
                {{ listing.currency }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alrededor de la zona (puntos de interés cercanos) -->
    <div v-if="nearbyPlaces.length" class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('alrededores')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Alrededor de la zona</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'alrededores' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <ul class="space-y-2.5 max-h-72 overflow-y-auto pr-2">
              <li v-for="place in nearbyPlaces" :key="place.id" class="flex items-center gap-2.5 text-[16px] text-gray-600 font-normal">
                <Icon :name="NEARBY_PLACE_CATEGORY_META[place.category]?.icon || 'mapPin'" class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">{{ place.name }}</span>
                <span class="flex-shrink-0 text-gray-400">— {{ place.distanceM }}m</span>
              </li>
            </ul>
            <p class="text-xs text-gray-400 mt-4">
              Datos de ubicación &copy; colaboradores de OpenStreetMap.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Disponibilidad (solo villas) -->
    <div v-if="listing.type === 'VILLA'" class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('disponibilidad')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Disponibilidad</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'disponibilidad' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <LazyAvailabilityCalendar v-if="opened.disponibilidad" :ranges="availability" />
          </div>
        </div>
      </div>
    </div>

    <!-- Mapa -->
    <div v-if="mapCenter" class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('mapa')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Mapa</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'mapa' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <LazyListingMap v-if="opened.mapa" :lat="mapCenter.lat" :lng="mapCenter.lng" :active="activeAccordion === 'mapa'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Ubicación y vendedor -->
    <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
      <div class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors" @click="toggleAccordion('ubicacion')">
        <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Ubicación y vendedor</span>
      </div>
      <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" :class="activeAccordion === 'ubicacion' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="overflow-hidden">
          <div class="px-6 pb-6">
            <p v-if="locationText" class="text-[16px] text-gray-600 leading-relaxed font-normal">
              {{ locationText }}
            </p>

            <div class="mt-3 flex items-center justify-between gap-2">
              <p class="text-[16px] text-gray-600 font-normal">
                Publicado por <span class="font-medium text-black">{{ listing.owner?.name || 'Usuario' }}</span>
              </p>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  class="btn btn-sm"
                  style="border: 1px solid var(--color-border); background: #fff; color: #171717;"
                  @click="copyListingLink"
                >
                  <Icon name="link" class="w-3.5 h-3.5 inline mr-1" />
                  {{ linkCopied ? 'Copiado' : 'Copiar enlace' }}
                </button>
                <a
                  v-if="listing.owner?.phone"
                  :href="whatsappUrl"
                  target="_blank"
                  class="btn btn-sm btn-neon"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
