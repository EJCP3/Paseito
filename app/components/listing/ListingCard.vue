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

const publishedDate = computed(() =>
  new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(props.listing.createdAt))
)
</script>

<template>
  <NuxtLink
    :to="`/anuncio/${listing.slug}`"
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
          <Icon :name="ListingTypeIcons[listing.type as keyof typeof ListingTypeIcons]" class="w-3.5 h-3.5" />
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
          <p class="text-xs mt-0.5" style="color: var(--color-muted-light);">
            Publicado el {{ publishedDate }}
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
            <Icon name="bed" class="w-3.5 h-3.5" />
            {{ listing.bedrooms }}
          </span>
          <span v-if="listing.bathrooms" class="flex items-center gap-1">
            <Icon name="bath" class="w-3.5 h-3.5" />
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
