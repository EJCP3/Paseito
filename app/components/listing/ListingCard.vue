<script setup lang="ts">
/**
 * ListingCard — Tarjeta de listado individual
 * Muestra foto, tipo, título, precio, ubicación y badge 360°
 * con hover effects premium estilo Robinhood
 */
import { ListingTypeLabels, ListingTypeIcons } from '~~/shared/types/enums'
import type { Listing, Photo } from '~~/shared/types/listing'

interface ListingCardData extends Listing {
  photos?: Pick<Photo, 'url' | 'thumbUrl'>[]
  scenes?: { previewUrl: string }[]
  owner?: { name: string }
}

const props = defineProps<{
  listing: ListingCardData
}>()

// Imagen de portada: primera foto o preview de primera escena
const coverImage = computed(() => {
  if (props.listing.photos?.length) return props.listing.photos[0].thumbUrl || props.listing.photos[0].url
  if (props.listing.scenes?.length) return props.listing.scenes[0].previewUrl
  return '/images/hero/hero-1.webp' // Fallback
})

const has360 = computed(() => (props.listing.scenes?.length ?? 0) > 0)

const formattedPrice = computed(() => {
  const price = Number(props.listing.price)
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: props.listing.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price)
})

const locationText = computed(() => {
  if (props.listing.city && props.listing.sector) {
    return `${props.listing.sector}, ${props.listing.city}`
  }
  if (props.listing.city) return props.listing.city
  if (props.listing.brand && props.listing.model) {
    return `${props.listing.brand} ${props.listing.model} ${props.listing.year || ''}`
  }
  return ''
})
</script>

<template>
  <NuxtLink
    :to="`/listado/${listing.slug}`"
    class="card-paseito group block"
    :id="`listing-card-${listing.id}`"
  >
    <!-- Imagen -->
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        :src="coverImage"
        :alt="listing.title"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      <!-- Badge tipo -->
      <div class="absolute top-3 left-3 z-10">
        <span class="pill text-xs !py-1 !px-3 !bg-white/90 !border-0 shadow-sm">
          {{ ListingTypeIcons[listing.type as keyof typeof ListingTypeIcons] }}
          {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
        </span>
      </div>

      <!-- Badge 360° -->
      <div v-if="has360" class="absolute top-3 right-3 z-10">
        <span class="pill text-xs !py-1 !px-3 !border-0 shadow-sm" style="background: var(--color-neon); color: #0D0D0D;">
          360°
        </span>
      </div>

      <!-- Gradient overlay bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
    </div>

    <!-- Info -->
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h3 class="font-bold text-base truncate" style="font-family: var(--font-heading);">
            {{ listing.title }}
          </h3>
          <p v-if="locationText" class="text-sm mt-0.5 truncate" style="color: var(--color-muted);">
            {{ locationText }}
          </p>
        </div>
      </div>

      <!-- Precio -->
      <div class="mt-3 flex items-center justify-between">
        <span class="text-lg font-black" style="font-family: var(--font-heading); letter-spacing: -0.02em;">
          {{ formattedPrice }}
        </span>

        <!-- Specs rápidos -->
        <div v-if="listing.bedrooms !== null && listing.bedrooms !== undefined" class="flex items-center gap-3 text-xs" style="color: var(--color-muted);">
          <span v-if="listing.bedrooms" class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {{ listing.bedrooms }}
          </span>
          <span v-if="listing.bathrooms" class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {{ listing.bathrooms }}
          </span>
          <span v-if="listing.areaM2" class="flex items-center gap-1">
            {{ listing.areaM2 }}m²
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
