<script setup lang="ts">
/**
 * ListingDetailsPanel — Panel de pills tipo acordeón
 * Tres secciones: Descripción, Características, Ubicación y vendedor
 */
import { ListingType, ListingTypeLabels } from '~~/shared/types/enums'
import type { ListingFull } from '~~/shared/types/listing'

const props = defineProps<{
  listing: ListingFull
}>()

const activeTab = ref<string>('descripcion')

const tabs = [
  { id: 'descripcion', label: 'Descripción', icon: '📝' },
  { id: 'caracteristicas', label: 'Características', icon: '📋' },
  { id: 'ubicacion', label: 'Ubicación y vendedor', icon: '📍' },
]

// Specs para la grid de características
const specs = computed(() => {
  const s: { label: string; value: string; icon: string }[] = []

  if (props.listing.type === 'APARTMENT' || props.listing.type === 'HOUSE') {
    if (props.listing.areaM2) s.push({ label: 'Área', value: `${props.listing.areaM2} m²`, icon: '📐' })
    if (props.listing.bedrooms !== null && props.listing.bedrooms !== undefined) s.push({ label: 'Habitaciones', value: String(props.listing.bedrooms), icon: '🛏️' })
    if (props.listing.bathrooms !== null && props.listing.bathrooms !== undefined) s.push({ label: 'Baños', value: String(props.listing.bathrooms), icon: '🚿' })
    if (props.listing.parking !== null && props.listing.parking !== undefined) s.push({ label: 'Estacionamientos', value: String(props.listing.parking), icon: '🅿️' })
  }

  if (props.listing.type === 'VEHICLE') {
    if (props.listing.brand) s.push({ label: 'Marca', value: props.listing.brand, icon: '🏷️' })
    if (props.listing.model) s.push({ label: 'Modelo', value: props.listing.model, icon: '🚗' })
    if (props.listing.year) s.push({ label: 'Año', value: String(props.listing.year), icon: '📅' })
    if (props.listing.mileageKm) s.push({ label: 'Kilometraje', value: `${props.listing.mileageKm.toLocaleString()} km`, icon: '🛣️' })
  }

  return s
})

const whatsappUrl = computed(() => {
  const phone = props.listing.owner?.phone || ''
  const message = encodeURIComponent(
    `¡Hola! Me interesa el listado "${props.listing.title}" en Paseito. ¿Podemos coordinar una visita?`
  )
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`
})
</script>

<template>
  <div class="details-panel" id="listing-details-panel">
    <!-- Tabs / Pills -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="pill"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
        :id="`tab-${tab.id}`"
      >
        <span>{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenido del tab activo -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <!-- Descripción -->
      <div v-if="activeTab === 'descripcion'" key="descripcion" class="prose max-w-none">
        <p class="text-sm leading-relaxed whitespace-pre-line" style="color: #404040;">
          {{ listing.description }}
        </p>
      </div>

      <!-- Características -->
      <div v-else-if="activeTab === 'caracteristicas'" key="caracteristicas">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div
            v-for="spec in specs"
            :key="spec.label"
            class="flex items-center gap-3 p-3 rounded-xl"
            style="background: var(--color-surface); border: 1px solid var(--color-border);"
          >
            <span class="text-xl">{{ spec.icon }}</span>
            <div>
              <p class="text-xs" style="color: var(--color-muted);">{{ spec.label }}</p>
              <p class="font-bold text-sm" style="font-family: var(--font-heading);">{{ spec.value }}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <span class="pill !bg-gray-100 !border-0 text-xs">
            {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
          </span>
          <span class="pill !bg-gray-100 !border-0 text-xs">
            {{ listing.currency }}
          </span>
        </div>
      </div>

      <!-- Ubicación y vendedor -->
      <div v-else-if="activeTab === 'ubicacion'" key="ubicacion" class="space-y-4">
        <div v-if="listing.city || listing.sector" class="flex items-start gap-3 p-4 rounded-xl" style="background: var(--color-surface); border: 1px solid var(--color-border);">
          <span class="text-xl">📍</span>
          <div>
            <p class="font-bold text-sm" style="font-family: var(--font-heading);">Ubicación</p>
            <p class="text-sm" style="color: var(--color-muted);">
              {{ [listing.sector, listing.city].filter(Boolean).join(', ') }}
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3 p-4 rounded-xl" style="background: var(--color-surface); border: 1px solid var(--color-border);">
          <span class="text-xl">👤</span>
          <div class="flex-1">
            <p class="font-bold text-sm" style="font-family: var(--font-heading);">Publicado por</p>
            <p class="text-sm" style="color: var(--color-muted);">{{ listing.owner?.name || 'Usuario' }}</p>
          </div>
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
    </Transition>
  </div>
</template>
