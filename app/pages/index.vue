<script setup lang="ts">
import { ref } from 'vue'
import BentoGalleryHero from '~/components/hero/BentoGalleryHero.vue'
import ProductSession from '~/components/ProductSession.vue'

useHead({
  title: 'Paseito — Explora tu próximo espacio',
})

const productSessionRef = ref<InstanceType<typeof ProductSession> | null>(null)

const handleHeroSelect = (imageUrl: string) => {
  if (productSessionRef.value) {
    productSessionRef.value.openProductByImage(imageUrl)
    // Smooth scroll to the product section
    const productEl = document.getElementById('product-session')
    if (productEl) {
      productEl.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
</script>

<template>
  <div>
    <!-- Hero Section (GSAP Flip Gallery) -->
    <BentoGalleryHero @selectImage="handleHeroSelect" />

    <!-- E-Commerce Immersive Storefront -->
    <ProductSession ref="productSessionRef" id="product-session" />
  </div>
</template>
