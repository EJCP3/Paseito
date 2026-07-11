<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const { $gsap: gsap, $ScrollTrigger: ScrollTrigger, $Flip: Flip } = useNuxtApp()

const emit = defineEmits(['selectImage'])

const galleryWrapRef = ref<HTMLElement>()
let flipCtx: any

const createTween = () => {
  let galleryElement = document.querySelector("#gallery-8") as HTMLElement
  if (!galleryElement) return
  let galleryItems = galleryElement.querySelectorAll(".gallery__item")

  flipCtx && flipCtx.revert()
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

onMounted(() => {
  // Add small delay to ensure DOM is ready and fonts loaded
  setTimeout(() => {
    createTween()
    window.addEventListener("resize", createTween)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", createTween)
  if (flipCtx) flipCtx.revert()
})
</script>

<template>
  <div class="gallery-wrap" ref="galleryWrapRef">
    <div class="gallery gallery--bento gallery--switch" id="gallery-8">
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-pattern-1.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-pattern-1.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-image-12.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-image-12.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-image-8.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-image-8.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-pattern-2.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-pattern-2.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-image-4.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-image-4.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-image-3.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-image-3.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-pattern-3.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-pattern-3.jpg" alt="" />
      </div>
      <div class="gallery__item cursor-pointer" @click="$emit('selectImage', 'https://assets.codepen.io/16327/portrait-image-1.jpg')">
        <img src="https://assets.codepen.io/16327/portrait-image-1.jpg" alt="" />
      </div>
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
