<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { $gsap: gsap } = useNuxtApp()

const view = ref<'grid' | 'detail'>('grid')
const showDetails = ref(false)
const selectedProduct = ref<any>(null)

const products = [
  { id: 1, name: 'Stealth Bomber Jacket', price: '$740.00', category: 'Apparel', image: 'https://assets.codepen.io/16327/portrait-image-12.jpg', description: 'Neutral shell. Statement interior. The look justifies the risk. Custom design by Golden Bear.' },
  { id: 2, name: 'Liquid Asset Bottle', price: '$45.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-image-8.jpg', description: 'Keep your assets liquid and cold. Insulated stainless steel.' },
  { id: 3, name: 'Neon Robinhoodie', price: '$80.00', category: 'Apparel', image: 'https://assets.codepen.io/16327/portrait-image-3.jpg', description: 'Vibrant and comfortable. Stand out in the market.' },
  { id: 4, name: 'Market Cap', price: '$30.00', category: 'Accessories', image: 'https://assets.codepen.io/16327/portrait-image-4.jpg', description: 'A classic dad hat with modern market sensibilities.' },
  { id: 5, name: 'Neon Waka Waka Chair', price: '$300.00', category: 'Home', image: 'https://assets.codepen.io/16327/portrait-pattern-2.jpg', description: 'Minimalist architecture meets bright neon accents.' },
  { id: 6, name: 'Stainless Steel Mug', price: '$25.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-pattern-1.jpg', description: 'For your morning coffee before the opening bell.' },
  { id: 7, name: 'Diamond Hands Pin', price: '$15.00', category: 'Accessories', image: 'https://assets.codepen.io/16327/portrait-image-12.jpg', description: 'Show your true holding power with this enamel pin.' },
  { id: 8, name: 'To The Moon Poster', price: '$40.00', category: 'Home', image: 'https://assets.codepen.io/16327/portrait-image-8.jpg', description: 'Inspirational artwork for your home office or trading floor.' },
  { id: 9, name: 'Bulls vs Bears Socks', price: '$20.00', category: 'Apparel', image: 'https://assets.codepen.io/16327/portrait-image-3.jpg', description: 'A daily reminder of market dynamics, right on your feet.' },
  { id: 10, name: 'Crypto Cold Wallet', price: '$120.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-image-4.jpg', description: 'Secure your digital assets with our sleek cold storage solution.' },
  { id: 11, name: 'Ticker Tape Scarf', price: '$55.00', category: 'Accessories', image: 'https://assets.codepen.io/16327/portrait-pattern-2.jpg', description: 'Stay warm while watching the market trends unfold.' },
  { id: 12, name: 'Day Trader Coffee Blend', price: '$22.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-pattern-1.jpg', description: 'High-octane dark roast to keep you focused during market hours.' },
  { id: 13, name: 'Crypto Cold Wallet 2', price: '$120.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-image-4.jpg', description: 'Secure your digital assets with our sleek cold storage solution.' },
  { id: 14, name: 'Ticker Tape Scarf 2', price: '$55.00', category: 'Accessories', image: 'https://assets.codepen.io/16327/portrait-pattern-2.jpg', description: 'Stay warm while watching the market trends unfold.' },
  { id: 15, name: 'Day Trader Coffee Blend 2', price: '$22.00', category: 'Essentials', image: 'https://assets.codepen.io/16327/portrait-pattern-1.jpg', description: 'High-octane dark roast to keep you focused during market hours.' }
]

const carouselRef = ref<HTMLElement | null>(null)
const showProductTopNav = ref(false)
const activeSlide = ref(0)
const activeAccordion = ref<string>('description')

const toggleAccordion = (id: string) => {
  activeAccordion.value = activeAccordion.value === id ? '' : id
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const slideIndex = Math.round(target.scrollTop / target.clientHeight)
  activeSlide.value = slideIndex
}

const scrollToSlide = (index: number) => {
  if (carouselRef.value) {
    const height = carouselRef.value.clientHeight
    carouselRef.value.scrollTo({ top: height * index, behavior: 'smooth' })
  }
}

const scrollToTop = () => {
  scrollToSlide(0)
}

const scrollToDetails = () => {
  if (carouselRef.value) {
    carouselRef.value.scrollTo({ top: carouselRef.value.scrollHeight, behavior: 'smooth' })
  }
}

const selectProduct = (prod: any) => {
  selectedProduct.value = prod
  view.value = 'detail'
  showProductTopNav.value = false
  setTimeout(() => {
    if (carouselRef.value) {
      carouselRef.value.scrollTop = 0
    }
  }, 50)
}

const openProductByImage = (imageUrl: string) => {
  const prod = products.find(p => p.image === imageUrl)
  if (prod) {
    selectProduct(prod)
  } else {
    // Fallback if image not found, select first product
    selectProduct(products[0])
  }
}

// macOS Dock Animation Logic
const dockRef = ref<HTMLElement | null>(null)
let dockIcons: NodeListOf<HTMLElement> | null = null
let lastPointerY = -9999
let autoScrollFrame: number | null = null
let currentScrollSpeed = 0

const updateDockIconsPosition = () => {
  if (!dockRef.value || !dockIcons || dockIcons.length === 0) return
  if (lastPointerY === -9999) return
  
  const min = 88; // 72px height + 16px gap
  const max = 130; // max scale size
  const bound = min * Math.PI;

  for (let i = 0; i < dockIcons.length; i++) {
    let icon = dockIcons[i];
    let iconCenterY = dockRef.value.getBoundingClientRect().top - dockRef.value.scrollTop + icon.offsetTop + icon.offsetHeight / 2;
    let distance = iconCenterY - lastPointerY;
    
    let y = 0;
    let scale = 1;
    
    if (-bound < distance && distance < bound) {
      let rad = distance / min * 0.5;
      scale = 1 + (max / min - 1) * Math.cos(rad);  
      y = 1.5 * (max - min) * Math.sin(rad);
    } else {
      y = (-bound < distance ? 1.5 : -1.5) * (max - min);
    }
    
    gsap.to(icon, { duration: 0.3, y: y, scale: scale, transformOrigin: "100% 50%" });
  }
}

const handleDockMove = (event: MouseEvent) => {
  if (!dockRef.value) return
  
  // Lazily query icons since dockRef is inside v-if
  if (!dockIcons || dockIcons.length === 0) {
    dockIcons = dockRef.value.querySelectorAll('.thumbnail-item')
  }
  if (!dockIcons || dockIcons.length === 0) return
  
  lastPointerY = event.clientY
  updateDockIconsPosition()

  // Hover Auto-Scroll logic
  const rect = dockRef.value.getBoundingClientRect()
  const relativeY = event.clientY - rect.top
  const edgeThreshold = 120 // pixels from top/bottom to trigger scroll
  
  if (relativeY < edgeThreshold) {
    currentScrollSpeed = -((edgeThreshold - relativeY) / edgeThreshold) * 15
  } else if (relativeY > rect.height - edgeThreshold) {
    currentScrollSpeed = ((relativeY - (rect.height - edgeThreshold)) / edgeThreshold) * 15
  } else {
    currentScrollSpeed = 0
  }
  
  if (currentScrollSpeed !== 0 && !autoScrollFrame) {
    const loop = () => {
      if (dockRef.value && currentScrollSpeed !== 0) {
        dockRef.value.scrollTop += currentScrollSpeed
        updateDockIconsPosition()
        autoScrollFrame = requestAnimationFrame(loop)
      } else {
        autoScrollFrame = null
      }
    }
    autoScrollFrame = requestAnimationFrame(loop)
  }
}

const handleDockLeave = () => {
  if (!dockIcons) return
  lastPointerY = -9999
  currentScrollSpeed = 0
  if (autoScrollFrame) {
    cancelAnimationFrame(autoScrollFrame)
    autoScrollFrame = null
  }
  gsap.to(dockIcons, { duration: 0.3, scale: 1, y: 0 })
}

const handleDockScroll = () => {
  updateDockIconsPosition()
}

// Pagination Dots Hover Preview Logic
const hoveredDotIndex = ref<number>(0)
const globalDotPreviewRef = ref<HTMLElement | null>(null)
let activeDotFade: any = null
let alignDotFn: any = null
let setDotX: any = null
let setDotY: any = null

const handleDotEnter = (e: MouseEvent, index: number) => {
  hoveredDotIndex.value = index
  
  // Use timeout to ensure the teleported ref has updated its internal DOM if needed
  setTimeout(() => {
    const preview = globalDotPreviewRef.value
    if (!preview) return
    
    if (!setDotX) {
      setDotX = gsap.quickTo(preview, "x", { duration: 0.4, ease: "power3" })
      setDotY = gsap.quickTo(preview, "y", { duration: 0.4, ease: "power3" })
      gsap.set(preview, { xPercent: -50, yPercent: -50 })
    }
    
    let firstEnter = true
    
    alignDotFn = (moveEvent: MouseEvent) => {
      const targetX = moveEvent.clientX + 100 // offset right
      const targetY = moveEvent.clientY
      
      if (firstEnter) {
        setDotX(targetX, targetX)
        setDotY(targetY, targetY)
        firstEnter = false
      } else {
        setDotX(targetX)
        setDotY(targetY)
      }
    }
    
    document.addEventListener("mousemove", alignDotFn)
    
    if (activeDotFade) activeDotFade.kill()
    activeDotFade = gsap.to(preview, {
      autoAlpha: 1,
      ease: "none",
      duration: 0.1
    })
    
    alignDotFn(e)
  }, 0)
}

const handleDotLeave = () => {
  const preview = globalDotPreviewRef.value
  if (!preview) return
  
  if (activeDotFade) activeDotFade.kill()
  activeDotFade = gsap.to(preview, {
    autoAlpha: 0,
    ease: "none",
    duration: 0.1
  })
  
  if (alignDotFn) {
    document.removeEventListener("mousemove", alignDotFn)
    alignDotFn = null
  }
}

// --- FILTER ISLAND LOGIC ---
const filterCategories = ['All', 'Apparel', 'Accessories', 'Essentials', 'Home']
const activeCategory = ref('All')
const filteredProducts = computed(() => {
  if (activeCategory.value === 'All') return products
  return products.filter(p => p.category === activeCategory.value)
})

const isFilterOpen = ref(false)
let filterTl: any = null

const initFilterAnimation = () => {
  if (filterTl) filterTl.revert()
  
  const expandedWidth = Math.min(window.innerWidth * 0.9, 300)
  
  filterTl = gsap.timeline({ paused: true })
    .set('.menu-overlay', { pointerEvents: 'auto' })
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

onMounted(() => {
  initFilterAnimation()
  
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
// --- END FILTER ISLAND LOGIC ---

defineExpose({
  openProductByImage
})

const backToGrid = () => {
  view.value = 'grid'
  showDetails.value = false
}
</script>

<template>
  <section class="relative w-full bg-[var(--color-surface)] min-h-screen flex" ref="sectionRef">
    
    <!-- LEFT SIDEBAR (Sticky) -->
    <div class="sticky top-0 h-screen w-[32%] flex-shrink-0 flex flex-col justify-between p-6 z-40">
      <!-- Logo (Top Left) -->
      <div class="flex items-center gap-2 cursor-pointer" @click="backToGrid">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-black">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z" fill="currentColor"/>
        </svg>
        <span class="text-[20px] font-medium tracking-tight text-black" style="font-family: var(--font-body);">
          Paseito
        </span>
      </div>

      <!-- Navigation / Detail Panel (Only one visible at a time) -->
      <div class="flex-grow flex flex-col justify-center">
        <!-- Grid View: Product List -->
        <ul v-if="view === 'grid'" class="space-y-1 text-[22px] leading-tight text-gray-500 font-normal tracking-tight" style="font-family: var(--font-body);">
          <li v-for="p in filteredProducts" :key="p.id" class="hover:text-black cursor-pointer transition-colors" @click="selectProduct(p)">
            {{ p.name }}
          </li>
          <li class="text-black font-medium mt-2 cursor-pointer">
            All Products
          </li>
        </ul>

        <!-- Detail View: Product Info -->
        <div v-if="view === 'detail' && selectedProduct" class="flex flex-col pr-8">
          <h1 class="text-[20px] font-medium leading-tight tracking-tight mb-1" style="font-family: var(--font-body);">{{ selectedProduct.name }}</h1>
          <p class="text-[17px] text-gray-500 mb-6 font-normal">{{ selectedProduct.price }}</p>

          <div class="flex gap-2 mb-4">
            <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Size 
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              1 
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          <button class="bg-[#e3e3df] text-gray-500 px-6 py-2.5 rounded-full text-[15px] font-medium w-max cursor-not-allowed">
            Select options
          </button>
        </div>
      </div>

      <!-- Cart (Bottom Left) -->
      <div class="text-[18px] font-medium" style="font-family: var(--font-body);">
        Cart (0)
      </div>
    </div>

    <!-- RIGHT CONTENT AREA -->
    <div class="w-[68%] flex-grow relative min-h-screen">
      <Transition name="fade" mode="out-in">
        
        <!-- VIEW: GRID -->
        <div v-if="view === 'grid'" class="w-full pt-6 pr-8 pb-12 h-full flex justify-start">
          <!-- CSS Grid for Products -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-[1200px] content-start">
            <div 
              v-for="p in filteredProducts" 
              :key="p.id" 
              class="bg-[#e3e3df] rounded-[32px] aspect-square flex items-center justify-center cursor-pointer relative group"
              @click="selectProduct(p)"
            >
              <img :src="p.image" :alt="p.name" class="size-50 object-contain mix-blend-multiply" />
              
              <!-- Hover Info -->
              <div class="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p class="text-black text-[22px] font-medium leading-tight tracking-tight" style="font-family: var(--font-body);">{{ p.name }}</p>
                <p class="text-gray-500 text-[17px] m">{{ p.price }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW: DETAIL -->
        <div v-else-if="view === 'detail' && selectedProduct" class="w-full flex h-screen sticky top-0 relative">
          
          <!-- Top Nav (Product ^) -->
          <div class="flex-grow flex h-full relative">
            
            <!-- Pagination Dots -->
            <div class="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
              <div 
                v-for="i in 3" :key="'dot-'+i" 
                class="w-2.5 h-2.5 rounded-full transition-colors cursor-pointer relative"
                :class="(i-1) === activeSlide ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'"
                @click="scrollToSlide(i-1)"
                @mouseenter="handleDotEnter($event, i-1)"
                @mouseleave="handleDotLeave"
              ></div>
            </div>

            <!-- Global Teleported Preview -->
            <Teleport to="body">
              <div ref="globalDotPreviewRef" class="fixed top-0 left-0 pointer-events-none opacity-0 invisible" style="z-index: 99999;">
                <img v-if="hoveredDotIndex === 0" :src="selectedProduct.image" class="w-32 h-32 object-contain bg-white rounded-2xl shadow-xl p-2" />
                <img v-else-if="hoveredDotIndex === 1" :src="selectedProduct.image" class="w-32 h-32 object-contain bg-white rounded-2xl shadow-xl p-2" style="transform: scaleX(-1)" />
                <div v-else class="w-32 h-32 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-3 justify-center">
                  <div class="h-2 w-full bg-gray-200 rounded-full"></div>
                  <div class="h-2 w-3/4 bg-gray-200 rounded-full"></div>
                  <div class="h-2 w-1/2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </Teleport>

            <!-- Center Content (Scrollable Carousel) -->
            <div ref="carouselRef" class="flex-grow h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth flex flex-col relative" @scroll="handleScroll">
              
              <!-- Slide 1: Main Image -->
              <div class="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-12 relative">
                <img :src="selectedProduct.image" :alt="selectedProduct.name" class="w-[70%] h-[70%] object-contain mix-blend-multiply" />
                <button @click="scrollToDetails" class="absolute bottom-12 text-[15px] font-medium flex items-center gap-2 hover:text-gray-500 transition-colors">
                  Details
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
              
              <!-- Slide 2: Second Image (Repeated for effect) -->
              <div class="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-12 relative">
                <img :src="selectedProduct.image" :alt="selectedProduct.name" class="w-[70%] h-[70%] object-contain mix-blend-multiply" style="transform: scaleX(-1)" />
              </div>

              <!-- Slide 3: Accordions Details -->
              <div class="w-full h-full flex-shrink-0 snap-start flex flex-col items-center justify-center p-12 relative">
                <button @click="scrollToTop" class="absolute top-12 text-[15px] font-medium flex items-center gap-2 hover:text-gray-500 transition-colors">
                  Product
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
                </button>

                <div class="w-full max-w-xl flex flex-col gap-3">
                  <!-- Description accordion -->
                  <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                    <div @click="toggleAccordion('description')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300 transition-colors">
                      <span class="text-[15px] font-medium">Description</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform duration-300" :class="activeAccordion === 'description' ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div 
                      class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                      :class="activeAccordion === 'description' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                    >
                      <div class="overflow-hidden">
                        <div class="px-6 pb-6">
                          <p class="text-[15px] text-gray-600 leading-relaxed">
                            {{ selectedProduct.description }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Product details accordion -->
                  <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                    <div @click="toggleAccordion('details')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300 transition-colors">
                      <span class="text-[15px] font-medium">Product details</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform duration-300" :class="activeAccordion === 'details' ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div 
                      class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                      :class="activeAccordion === 'details' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                    >
                      <div class="overflow-hidden">
                        <div class="px-6 pb-6">
                          <p class="text-[15px] text-gray-600 leading-relaxed">
                            Premium materials and craftsmanship. Designed for durability and comfort in all market conditions. Available in standard sizing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Shipping accordion -->
                  <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                    <div @click="toggleAccordion('shipping')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300 transition-colors">
                      <span class="text-[15px] font-medium">Shipping</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform duration-300" :class="activeAccordion === 'shipping' ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div 
                      class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                      :class="activeAccordion === 'shipping' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                    >
                      <div class="overflow-hidden">
                        <div class="px-6 pb-6">
                          <p class="text-[15px] text-gray-600 leading-relaxed">
                            Free standard shipping on all orders over $50. Express shipping options available at checkout. Returns accepted within 30 days.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Sidebar (Thumbnails) -->
            <div 
              ref="dockRef" 
              class="w-48 flex-shrink-0 h-full overflow-y-auto no-scrollbar flex flex-col gap-4 py-8 items-end z-10 pr-6 border-l border-transparent"
              @mousemove="handleDockMove"
              @mouseleave="handleDockLeave"
              @scroll="handleDockScroll"
            >
              <div 
                v-for="p in products" 
                :key="'thumb-'+p.id" 
                class="w-[72px] h-[72px] rounded-3xl cursor-pointer flex-shrink-0 p-3 thumbnail-item"
                :class="selectedProduct.id === p.id ? 'bg-[#e3e3df]' : ''"
                @click="selectProduct(p)"
              >
                <img :src="p.image" :alt="p.name" class="w-full h-full object-contain mix-blend-multiply" />
              </div>
            </div>
          </div>

        </div>
      </Transition>
    </div>
    <!-- FILTER ISLAND (Teleported) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-show="view === 'grid' && isSectionVisible">
          <!-- The island -->
          <div class="island fixed top-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center justify-between p-1 bg-white border border-gray-200 rounded-full whitespace-nowrap overflow-hidden text-black transition-colors shadow-2xl" ref="islandRef" style="width: 50px;">
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

        <!-- Overlay & Panel -->
        <div class="menu-overlay fixed inset-0 z-[900] pointer-events-none">
          <div class="menu-backdrop absolute inset-0 bg-transparent opacity-0" @click="closeFilter"></div>
          <div class="menu-panel absolute invisible top-24 left-1/2 -translate-x-1/2 bg-white border border-gray-100 shadow-2xl rounded-[24px] p-2 w-[90vw] max-w-[400px]">
            <nav class="flex flex-col">
              <a v-for="(cat, i) in filterCategories" :key="cat" @click.prevent="selectCategory(cat)" class="menu-link flex items-center justify-between p-4 rounded-xl no-underline text-gray-500 font-medium text-[16px] hover:text-black transition-colors cursor-pointer" :class="activeCategory === cat ? 'text-black bg-gray-100' : ''">
                <span style="font-family: var(--font-body);">{{ cat }}</span>
                <span class="link-num text-[12px] text-gray-400 font-mono">0{{ i+1 }}</span>
              </a>
            </nav>
          </div>
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

/* Hide scrollbar for thumbnails */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
