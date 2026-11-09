<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const { $gsap: gsap, $Flip: Flip } = useNuxtApp()

const emit = defineEmits<{ (e: 'selectImage', slug: string): void }>()

// Anuncios reales (destacados primero); si faltan, se rellenan los 8 huecos con las imágenes estáticas (sin enlace)
const STATIC = [1, 2, 3, 4, 5, 1, 2, 3].map(n => `/images/portada${n}.webp`)
const { data: heroListings } = useFetch<{ id: string; slug: string; title: string; coverUrl: string }[]>('/api/hero-listings', { default: () => [] })
const slots = computed(() => STATIC.map((src, i) => {
  const l = (heroListings.value ?? [])[i]
  return l ? { key: l.id, src: l.coverUrl, alt: l.title, slug: l.slug } : { key: `static-${i}`, src, alt: '', slug: '' }
}))

function pick(e: Event, slug: string) {
  if (!slug) return
  e.preventDefault()
  emit('selectImage', slug)
}

const galleryWrapRef = ref<HTMLElement>()
let flipCtx: any

const createTween = () => {
  const galleryElement = document.querySelector("#gallery-8") as HTMLElement
  if (!galleryElement) return
  const galleryItems = galleryElement.querySelectorAll(".gallery__item")

  if (flipCtx) flipCtx.revert()
  galleryElement.classList.remove("gallery--final")

  flipCtx = gsap.context(() => {
    // Temporarily add the final class to capture the final state
    galleryElement.classList.add("gallery--final")
    const flipState = Flip.getState(galleryItems)
    galleryElement.classList.remove("gallery--final")

    const flip = Flip.to(flipState, {
      simple: true,
      ease: "expoScale(1, 5)"
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: galleryElement,
        start: "center center",
        end: "+=100%",
        scrub: true,
        pin: galleryWrapRef.value
      }
    })
    tl.add(flip)
    return () => gsap.set(galleryItems, { clearProps: "all" })
  }, galleryWrapRef.value)
}

let resizeTimer: ReturnType<typeof setTimeout> | undefined
const onResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(createTween, 150)
}

// Si los anuncios llegan después del montaje (navegación en cliente), se recalcula el Flip con las imágenes nuevas
watch(() => (heroListings.value ?? []).map(l => l.id).join(), async () => {
  if (!flipCtx) return
  await nextTick()
  createTween()
})

onMounted(() => {
  // Add small delay to ensure DOM is ready and fonts loaded
  setTimeout(() => {
    createTween()
    window.addEventListener("resize", onResize)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize)
  clearTimeout(resizeTimer)
  if (flipCtx) flipCtx.revert()
})
</script>

<template>
  <div ref="galleryWrapRef" class="gallery-wrap">
    <div id="gallery-8" class="gallery gallery--bento gallery--switch">
      <component
        :is="s.slug ? 'a' : 'div'"
        v-for="(s, i) in slots"
        :key="s.key"
        :href="s.slug ? `/anuncio/${s.slug}` : undefined"
        class="gallery__item"
        :class="s.slug ? 'cursor-pointer' : ''"
        @click="pick($event, s.slug)"
      >
        <img :src="s.src" :alt="s.alt" width="400" height="300" :fetchpriority="i === 0 ? 'high' : undefined" :loading="i === 0 ? 'eager' : 'lazy'" decoding="async">
      </component>
    </div>
  </div>
</template>

<style scoped>
.gallery-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #0a0a0a;
}

.gallery {
  position: relative;
  width: 100%;
  height: 100%;
  flex: none;
}

.gallery__item {
  background-position: 50% 50%;
  background-size: cover;
  flex: none;
  position: relative;
}

.gallery__item img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.gallery--bento {
  display: grid;
  gap: 1vh;
  grid-template-columns: repeat(3, 32.5vw);
  grid-template-rows: repeat(4, 23vh);
  justify-content: center;
  align-content: center;
}

.gallery--final.gallery--bento {
  grid-template-columns: repeat(3, 100vw);
  grid-template-rows: repeat(4, 49.5vh);
  gap: 1vh;
}

.gallery--bento .gallery__item:nth-child(1) { grid-area: 1 / 1 / 3 / 2; }
.gallery--bento .gallery__item:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }
.gallery--bento .gallery__item:nth-child(3) { grid-area: 2 / 2 / 4 / 3; }
.gallery--bento .gallery__item:nth-child(4) { grid-area: 1 / 3 / 3 / 3; }
.gallery--bento .gallery__item:nth-child(5) { grid-area: 3 / 1 / 3 / 2; }
.gallery--bento .gallery__item:nth-child(6) { grid-area: 3 / 3 / 5 / 4; }
.gallery--bento .gallery__item:nth-child(7) { grid-area: 4 / 1 / 5 / 2; }
.gallery--bento .gallery__item:nth-child(8) { grid-area: 4 / 2 / 5 / 3; }
</style>
