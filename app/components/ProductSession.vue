<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from '#app'
import { products } from '~/data/products'

const { $gsap: gsap, $ScrollTrigger: ScrollTrigger } = useNuxtApp()
const router = useRouter()

const selectProduct = (prod: any) => {
  router.push(`/producto/${prod.id}`)
}

const openProductByImage = (imageUrl: string) => {
  const prod = products.find(p => p.image === imageUrl)
  if (prod) {
    selectProduct(prod)
  } else {
    selectProduct(products[0])
  }
}

// --- FILTER ISLAND LOGIC ---
const filterCategories = ['All', 'Venta', 'Alquiler', 'Vehículos']
const activeCategory = ref('All')
const filteredProducts = computed(() => {
  if (activeCategory.value === 'All') return products
  return products.filter(p => p.category === activeCategory.value)
})

const isFilterOpen = ref(false)
const isMobileMenuOpen = ref(false)
let filterTl: any = null

const initFilterAnimation = () => {
  if (filterTl) filterTl.revert()
  
  const expandedWidth = Math.min(window.innerWidth * 0.9, 300)
  
  filterTl = gsap.timeline({ paused: true })
    .set('.menu-overlay', { pointerEvents: 'auto' })
    .set('.menu-panel', { autoAlpha: 1 })
    .to('.island', { width: expandedWidth, duration: 0.8, ease: 'back.out(2)', easeReverse: 'power2.out' }, 0)
    .to('.island-logo', { opacity: 1, duration: 0.5, ease: 'back.out', easeReverse: 'power4.out' }, 0.12)
    .to('.bar-mid', { opacity: 0, duration: 0.15, ease: 'power2.in', easeReverse: true }, 0)
    .to('.bar-top', { attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.bar-bot', { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.menu-backdrop', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .from('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6, duration: 0.8, transformOrigin: 'top center', ease: 'back.out(2)', easeReverse: 'power3.out' }, 0.1)
    .from('.menu-link', { opacity: 0, y: 6, duration: 0.32, ease: 'power2.out', easeReverse: true, stagger: 0.05 }, 0.22)
}

const sectionRef = ref<HTMLElement | null>(null)
const isSectionVisible = ref(false)
let sectionObserver: IntersectionObserver | null = null

let batchTriggers: any[] = []

const initBatchAnimations = () => {
  if (batchTriggers && batchTriggers.length) {
    batchTriggers.forEach(t => t.kill())
  }
  
  // Start state for cards if batch is being re-initialized
  gsap.set('.product-card', { autoAlpha: 0, y: 30 })

  batchTriggers = ScrollTrigger.batch('.product-card', {
    start: "top 80%",
    onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.8, ease: "sine.out", overwrite: true }),
  })
}

watch(filteredProducts, async () => {
  await nextTick()
  ScrollTrigger.refresh()
  if (batchInitialized.value) {
    initBatchAnimations()
  }
})

const batchInitialized = ref(false)
watch(isSectionVisible, (visible) => {
  if (visible && !batchInitialized.value) {
    batchInitialized.value = true
    initBatchAnimations()
  }
})

onMounted(() => {
  initFilterAnimation()
  
  // Immediately hide all cards on mount so they wait for the scroll trigger
  gsap.set('.product-card', { autoAlpha: 0, y: 30 })
  
  // Observe if ProductSession is visible on screen
  sectionObserver = new IntersectionObserver((entries) => {
    isSectionVisible.value = entries[0].isIntersecting
  }, { threshold: 0.1 })
  
  if (sectionRef.value) {
    sectionObserver.observe(sectionRef.value)
  }
})

onBeforeUnmount(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
  }
})

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    filterTl.timeScale(1).play()
  } else {
    filterTl.eventCallback('onReverseComplete', () => gsap.set('.menu-overlay', { pointerEvents: 'none' }))
    filterTl.timeScale(1.5).reverse()
  }
}

const closeFilter = () => {
  if (isFilterOpen.value) toggleFilter()
}

const selectCategory = (cat: string) => {
  activeCategory.value = cat
  closeFilter()
}

defineExpose({
  openProductByImage
})

</script>

<template>
  <section class="relative w-full bg-[var(--color-surface)] min-h-screen flex flex-col lg:flex-row" ref="sectionRef">


    <!-- LEFT SIDEBAR (Sticky) -->
    <div class="hidden lg:flex sticky top-0 h-screen w-[32%] flex-shrink-0 flex-col justify-between p-6 z-40">
      <!-- Logo (Top Left) -->
      <div class="flex items-center gap-2 cursor-pointer text-black">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-footsteps"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 16.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M15 18.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M8.52 12h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /><path d="M19.52 14h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /></svg>
        <span class="text-[20px] font-medium tracking-tight" style="font-family: var(--font-body);">
          Paseito
        </span>
      </div>

      <!-- Navigation / Detail Panel (Only one visible at a time) -->
      <div class="flex-grow flex flex-col justify-center">
        <!-- Grid View: Product List -->
        <ul class="space-y-1 text-[22px] leading-tight text-gray-500 font-normal tracking-tight" style="font-family: var(--font-body);">
          <li v-for="p in filteredProducts" :key="p.id" class="hover:text-black cursor-pointer transition-colors" @click="selectProduct(p)">
            {{ p.name }}
          </li>
          <li class="text-black font-medium mt-2 cursor-pointer">
            All Products
          </li>
        </ul>
      </div>

      <!-- Cart (Bottom Left) -->
      <div class="text-[18px] font-medium" style="font-family: var(--font-body);">
        Mi Lista (0)
      </div>
    </div>

    <!-- MOBILE HEADER -->
    <div class="lg:hidden w-full flex items-center justify-between p-6 z-[1100] bg-[var(--color-surface)] sticky top-0">
      <!-- Left: Logo -->
      <div class="flex items-center gap-2 cursor-pointer text-black">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-footsteps"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 16.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M15 18.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M8.52 12h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /><path d="M19.52 14h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /></svg>
        <span class="text-[20px] font-medium tracking-tight" style="font-family: var(--font-body);">Paseito</span>
      </div>

      <!-- Right: Icons -->
      <div class="flex items-center gap-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-black cursor-pointer">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <div @click="isMobileMenuOpen = true" class="cursor-pointer text-black">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </div>
      </div>
    </div>

    <!-- RIGHT CONTENT AREA -->
    <div class="w-full lg:w-[68%] flex-grow relative min-h-screen flex flex-col">
      
      <!-- STICKY HEADER / FILTER BUTTON -->
      <div class="sticky top-0 w-full z-[1200] pointer-events-none">
        <div class="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center" v-show="isSectionVisible">
          
          <!-- The island -->
          <div class="island pointer-events-auto relative flex items-center justify-between p-1 bg-white border border-gray-200 rounded-full whitespace-nowrap overflow-hidden text-black transition-colors shadow-2xl" ref="islandRef" style="width: 50px; height: 50px;">
            <div class="island-logo-cont relative w-0 h-5 pointer-events-none flex items-center">
              <span class="island-logo absolute opacity-0 font-medium ml-4 text-[14px]" style="font-family: var(--font-body);">Filter: {{ activeCategory }}</span>
            </div>
            <button @click="toggleFilter" class="menu-btn w-[42px] h-[42px] bg-transparent border-none cursor-pointer flex items-center justify-end flex-shrink-0" id="menuToggle">
              <div class="button-cont w-[42px] h-[42px] flex items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                <svg id="menuIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" class="overflow-visible block">
                  <line class="bar bar-top" x1="2" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line class="bar bar-mid" x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line class="bar bar-bot" x1="2" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </div>
            </button>
          </div>

          <!-- The Menu Panel -->
          <div class="menu-panel absolute top-16 invisible pointer-events-auto bg-white border border-gray-100 shadow-2xl rounded-[24px] p-2 w-[90vw] max-w-[400px]">
            <nav class="flex flex-col">
              <a v-for="(cat, i) in filterCategories" :key="cat" @click.prevent="selectCategory(cat)" class="menu-link flex items-center justify-between p-4 rounded-xl no-underline text-gray-500 font-medium text-[16px] hover:text-black transition-colors cursor-pointer" :class="activeCategory === cat ? 'text-black bg-gray-100' : ''">
                <span style="font-family: var(--font-body);">{{ cat }}</span>
                <span class="link-num text-[12px] text-gray-400 font-mono">0{{ i+1 }}</span>
              </a>
            </nav>
          </div>

        </div>
      </div>

      <!-- VIEW: GRID -->
      <div class="w-full pt-8 px-4 lg:pt-28 lg:pr-8 lg:px-0 lg:pl-0 pb-12 flex justify-start">
        <!-- CSS Grid for Products -->
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 w-full max-w-[1200px] content-start">
          <div 
            v-for="p in filteredProducts" 
            :key="p.id" 
            class="product-card invisible opacity-0 bg-[#e3e3df] rounded-2xl lg:rounded-[32px] aspect-square flex items-center justify-center cursor-pointer relative group"
            @click="selectProduct(p)"
          >
            <img :src="p.image" :alt="p.name" class="w-[80%] h-[80%] object-contain mix-blend-multiply" />
            
            <!-- Hover Info -->
            <div class="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <p class="text-black text-[22px] font-medium leading-tight tracking-tight" style="font-family: var(--font-body);">{{ p.name }}</p>
              <p class="text-gray-500 text-[17px] m">{{ p.price }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- FILTER BACKDROP (Teleported) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-show="isSectionVisible" class="hidden lg:block menu-overlay fixed inset-0 z-[900] pointer-events-none">
          <div class="menu-backdrop absolute inset-0 bg-transparent opacity-0" :class="isFilterOpen ? 'pointer-events-auto' : 'pointer-events-none'" @click="closeFilter"></div>
        </div>
      </Transition>

      <!-- MOBILE MENU OVERLAY -->
      <Transition name="fade">
        <div v-show="isMobileMenuOpen" class="fixed inset-0 z-[2000] bg-[#4a4a4a] text-white flex flex-col">
          <div class="flex items-center justify-between p-6">
            <div class="flex items-center gap-2 cursor-pointer text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-white">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z" fill="currentColor"/>
              </svg>
            </div>
            <div @click="isMobileMenuOpen = false" class="cursor-pointer text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-12 no-scrollbar">
            <ul class="space-y-3 text-[19px] leading-tight font-normal tracking-tight" style="font-family: var(--font-body);">
              <li v-for="p in filteredProducts" :key="p.id" class="cursor-pointer opacity-90 hover:opacity-100 transition-opacity text-white" @click="selectProduct(p); isMobileMenuOpen = false;">
                {{ p.name }}
              </li>
              <li class="font-medium mt-6 cursor-pointer text-white" @click="isMobileMenuOpen = false">
                All Products
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* Nuxt page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
