<script setup lang="ts">
/**
 * ListingGallery — Grid responsive de ListingCards
 * Con animaciones de entrada (stagger fade-in) vía GSAP
 */
import type { Listing } from '~~/shared/types/listing'

const props = defineProps<{
  listings: any[]
  loading?: boolean
}>()

const galleryRef = ref<HTMLElement>()

onMounted(() => {
  if (!galleryRef.value) return

  const { $gsap: gsap, $ScrollTrigger: ScrollTrigger } = useNuxtApp()

  const ctx = gsap.context(() => {
    const cards = galleryRef.value!.querySelectorAll('.listing-card-item')

    gsap.from(cards, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: galleryRef.value,
        start: 'top 85%',
        once: true,
      },
    })
  }, galleryRef.value)

  onBeforeUnmount(() => ctx.revert())
})
</script>

<template>
  <div ref="galleryRef">
    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="card-paseito animate-pulse">
        <div class="aspect-[4/3] bg-gray-200" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4" />
          <div class="h-3 bg-gray-200 rounded w-1/2" />
          <div class="h-5 bg-gray-200 rounded w-1/3 mt-3" />
        </div>
      </div>
    </div>

    <!-- Grid de cards -->
    <div v-else-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="listing in listings"
        :key="listing.id"
        class="listing-card-item"
      >
        <ListingCard :listing="listing" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-20">
      <Icon name="search" class="w-12 h-12 mx-auto mb-4" style="color: var(--color-muted-light);" />
      <h3 class="text-xl font-bold mb-2" style="font-family: var(--font-heading);">
        No se encontraron anuncios
      </h3>
      <p style="color: var(--color-muted);">
        Intenta ajustar los filtros de búsqueda
      </p>
    </div>
  </div>
</template>
