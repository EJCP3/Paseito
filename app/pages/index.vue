<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from '#app'
import BentoGalleryHero from '~/components/hero/BentoGalleryHero.vue'
import ProductSession from '~/components/ProductSession.vue'

useHead({
  title: 'Paseito — Explora tu próximo espacio',
})

const productSessionRef = ref<InstanceType<typeof ProductSession> | null>(null)
const route = useRoute()

// If returning directly to the product session, skip the hero to avoid GSAP layout thrashing
const skipHero = ref(route.hash === '#product-session')

onMounted(() => {
  if (skipHero.value) {
    window.scrollTo(0, 0)
  }
})

const handleHeroSelect = (imageUrl: string) => {
  if (productSessionRef.value) {
    productSessionRef.value.openProductByImage(imageUrl)
  }
}
</script>

<template>
  <div>
    <!-- Hero Section (GSAP Flip Gallery) -->
    <BentoGalleryHero v-if="!skipHero" @select-image="handleHeroSelect" />

    <!-- E-Commerce Immersive Storefront -->
    <ProductSession id="product-session" ref="productSessionRef" />
  </div>
</template>
