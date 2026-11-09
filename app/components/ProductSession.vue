<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, useRoute } from '#app'
import { ListingType, ListingTypeLabels } from '~~/shared/types/enums'
import locations from '~~/shared/data/rd-locations.json'

const { $gsap: gsap, $ScrollTrigger: ScrollTrigger } = useNuxtApp()
const router = useRouter()
const route = useRoute()

// Si se vuelve de un detalle de anuncio (glimm ya cubrió la transición), las
// cards deben estar visibles de inmediato: el fade-in por scroll se ve como
// un segundo parpadeo justo cuando el sweep termina de revelar la página.
const skipIntroReveal = route.hash === '#product-session'

function coverImage(listing: any) {
  if (listing.photos?.length) return cld(listing.photos[0].thumbUrl || listing.photos[0].url, 'f_auto,q_auto,c_limit,w_600')
  if (listing.scenes?.length) return cld(listing.scenes[0].previewUrl, 'f_auto,q_auto,c_limit,w_600')
  return '/images/portada1.webp'
}

function formattedPrice(listing: any) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: listing.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(listing.price))
}

const { count: favCount } = useFavorites()
const showFavoritesModal = ref(false)
function openFavorites() {
  if (!isAuthenticated.value) return openLogin()
  showFavoritesModal.value = true
}

const { user, isAuthenticated, openLogin, goOrLogin, signOut } = useAuth()

const showAccountMenu = ref(false)
const accountMenuRef = ref<HTMLElement | null>(null)

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length > 1
    ? (parts[0]![0]! + parts[1]![0]!).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

function onDocumentClick(e: MouseEvent) {
  if (accountMenuRef.value && !accountMenuRef.value.contains(e.target as Node)) {
    showAccountMenu.value = false
  }
}

async function handleSignOut() {
  showAccountMenu.value = false
  await signOut()
}

const selectProduct = (listing: any) => {
  router.push(`/anuncio/${listing.slug}`)
}

// Las imágenes del hero son piezas de marketing estáticas, no fotos de listados reales;
// al hacer click llevamos al primer listado disponible.
const openProductByImage = (_imageUrl: string) => {
  if (listings.value.length) {
    selectProduct(listings.value[0])
  } else {
    goToSearch()
  }
}

// --- FILTER ISLAND LOGIC ---
const filterCategories = [
  { key: 'ALL', label: 'Todos' },
  ...Object.values(ListingType).map(t => ({ key: t, label: ListingTypeLabels[t] })),
]
const activeCategory = ref('ALL')
const activeCategoryLabel = computed(() => filterCategories.find(c => c.key === activeCategory.value)?.label ?? 'Todos')

// Subfiltro (ciudad/sector/precio): solo tiene sentido una vez elegido un tipo.
const filterStep = ref<'category' | 'subfilter'>('category')
const filterCity = ref<string>('')
const filterSector = ref<string>('')
const filterMinPrice = ref<number | null>(null)
const filterMaxPrice = ref<number | null>(null)

const cityOptions = locations.map((l) => l.city)
const sectorOptions = computed(() => locations.find((l) => l.city === filterCity.value)?.sectors ?? [])
watch(filterCity, () => { filterSector.value = '' })
// v-model.number.lazy deja '' al vaciar el input: se normaliza a null.
watch([filterMinPrice, filterMaxPrice], () => {
  if ((filterMinPrice.value as unknown) === '') filterMinPrice.value = null
  if ((filterMaxPrice.value as unknown) === '') filterMaxPrice.value = null
})

function resetSubFilters() {
  filterCity.value = ''
  filterSector.value = ''
  filterMinPrice.value = null
  filterMaxPrice.value = null
}

// Los filtros viajan al servidor (mismos parámetros que /buscar). El precio usa
// v-model.lazy: se aplica al confirmar, no en cada tecla.
const searchQuery = computed(() => ({
  limit: 48,
  ...(activeCategory.value !== 'ALL' && { type: activeCategory.value }),
  ...(filterCity.value && { city: filterCity.value }),
  ...(filterSector.value && { sector: filterSector.value }),
  ...(filterMinPrice.value != null && { minPrice: filterMinPrice.value }),
  ...(filterMaxPrice.value != null && { maxPrice: filterMaxPrice.value }),
}))
const hasFilters = computed(() => Object.keys(searchQuery.value).length > 1)

// key (por query) + getCachedData: al volver del detalle ProductSession se
// remonta con los filtros por defecto y reusa solo la respuesta de ESA query
// (sin filtrar), así grid e isla quedan coherentes. Solo en la carga inicial.
const { data: listingsResponse, pending: listingsPending } = useFetch('/api/listings', {
  query: searchQuery,
  key: computed(() => 'home-listings:' + JSON.stringify(searchQuery.value)),
  getCachedData: (key, nuxtApp, ctx) =>
    ctx.cause === 'initial' ? (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) : undefined,
})
const listings = computed<any[]>(() => (listingsResponse.value as any)?.data ?? [])
const filteredProducts = listings
const totalResults = computed(() => (listingsResponse.value as any)?.total ?? listings.value.length)

// Lleva los filtros activos a /buscar
const goToSearch = () => {
  const { limit: _l, ...query } = searchQuery.value
  return router.push({ path: '/buscar', query: query as Record<string, string> })
}

const reducedMotion = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isFilterOpen = ref(false)
const isMobileMenuOpen = ref(false)
let filterTl: any = null

const initFilterAnimation = () => {
  if (filterTl) filterTl.revert()
  
  filterTl = gsap.timeline({ paused: true })
    .set('.menu-overlay', { pointerEvents: 'auto' })
    .set('.menu-panel', { autoAlpha: 1 })
    .to('.island', { x: 0, clipPath: 'inset(0px 0px 0px 0px round 25px)', duration: 0.8, ease: 'back.out(2)', easeReverse: 'power2.out' }, 0)
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
// Contexto GSAP: recoge timeline del filtro + batch triggers para poder
// revertirlos en unmount (evita ScrollTriggers huérfanos que rompen el HMR).
let ctx: any = null

const initBatchAnimations = (animate = true) => {
  if (batchTriggers && batchTriggers.length) {
    batchTriggers.forEach(t => t.kill())
  }

  // Start state for cards if batch is being re-initialized
  gsap.set('.product-card', animate ? { autoAlpha: 0, y: 30 } : { autoAlpha: 1, y: 0 })

  batchTriggers = ScrollTrigger.batch('.product-card', {
    start: "top 80%",
    onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.8, ease: "sine.out", overwrite: true }),
  })
}

watch(filteredProducts, async () => {
  await nextTick()
  ScrollTrigger.refresh()
  if (batchInitialized.value) {
    if (ctx) ctx.add(() => initBatchAnimations())
    else initBatchAnimations()
  }
})

const batchInitialized = ref(false)
watch(isSectionVisible, (visible) => {
  if (visible && !batchInitialized.value) {
    batchInitialized.value = true
    if (ctx) ctx.add(() => initBatchAnimations(!skipIntroReveal))
    else initBatchAnimations(!skipIntroReveal)
  }
})

onMounted(() => {
  // Sin scope: los selectores (.island, .menu-overlay teleportado, etc.) siguen
  // siendo globales, pero el contexto igual recoge todo para revert() en unmount.
  ctx = gsap.context(() => {
    initFilterAnimation()
    // Immediately hide all cards on mount so they wait for the scroll trigger
    // (salvo al volver de un detalle: ya deben verse, sin fade-in).
    gsap.set('.product-card', skipIntroReveal ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 30 })
  })

  // Observe if ProductSession is visible on screen
  sectionObserver = new IntersectionObserver((entries) => {
    isSectionVisible.value = entries[0]!.isIntersecting
  }, { threshold: 0.1 })
  
  if (sectionRef.value) {
    sectionObserver.observe(sectionRef.value)
  }

  document.addEventListener('mousedown', onDocumentClick)
})

onBeforeUnmount(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
  }
  // Mata timeline del filtro + batch triggers para no dejar ScrollTriggers
  // huérfanos que rompan el HMR (y con él el pin del hero).
  if (ctx) ctx.revert()
  document.removeEventListener('mousedown', onDocumentClick)
})

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    filterTl.timeScale(reducedMotion ? 50 : 1).play()
  } else {
    filterTl.eventCallback('onReverseComplete', () => gsap.set('.menu-overlay', { pointerEvents: 'none' }))
    filterTl.timeScale(reducedMotion ? 50 : 1.5).reverse()
  }
}

const closeFilter = () => {
  if (isFilterOpen.value) toggleFilter()
}

const selectCategory = (cat: string) => {
  activeCategory.value = cat
  if (cat === 'ALL') {
    resetSubFilters()
    filterStep.value = 'category'
    closeFilter()
  } else {
    // No cierra: pasa al subfiltro (ciudad/sector/precio) para ese tipo.
    filterStep.value = 'subfilter'
  }
}

const backToCategories = () => {
  filterStep.value = 'category'
}

defineExpose({
  openProductByImage
})

</script>

<template>
  <section ref="sectionRef" class="relative w-full bg-[var(--color-surface)] min-h-screen">

    <!-- DESKTOP STICKY HEADER — filtro (centro) + sesión (derecha). Sticky nativo: sin JS, sin rebote. -->
    <div v-show="isSectionVisible" class="hidden lg:block sticky top-0 h-0 z-[1200] pointer-events-none">
      <!-- Fondo sobre el área de contenido para que las imágenes pasen limpio por debajo -->
      <div class="absolute top-0 right-0 h-24 pointer-events-none" style="left: 32%; background: var(--color-surface);"/>

      <!-- Filtro (centrado en el viewport) -->
      <div class="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <!-- The island -->
        <!-- Isla a ancho final fijo; se abre con transform + clip-path (sin animar width). drop-shadow en el wrapper porque clip-path recorta box-shadow. -->
        <div class="pointer-events-none" style="filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.15)); width: 300px;">
        <div class="island pointer-events-auto relative flex items-center justify-between p-1 bg-white border border-gray-200 rounded-full whitespace-nowrap overflow-hidden text-black" style="width: 300px; height: 50px; transform: translateX(-125px); clip-path: inset(0px 0px 0px 250px round 25px);">
          <div class="island-logo-cont relative w-0 h-5 pointer-events-none flex items-center">
            <span class="island-logo absolute opacity-0 font-medium ml-4 text-[14px]" style="font-family: var(--font-body);">Filter: {{ activeCategoryLabel }}</span>
          </div>
          <button id="menuToggle" class="menu-btn w-[42px] h-[42px] bg-transparent border-none cursor-pointer flex items-center justify-end flex-shrink-0" @click="toggleFilter">
            <div class="button-cont w-[42px] h-[42px] flex items-center justify-center rounded-full transition-colors hover:bg-gray-100">
              <Icon id="menuIcon" name="menuMorph" width="16" height="16" viewBox="0 0 16 16" class="overflow-visible block" />
            </div>
          </button>
        </div>
        </div>

        <!-- The Menu Panel -->
        <div class="menu-panel absolute top-16 invisible pointer-events-auto bg-white border border-gray-100 shadow-2xl rounded-[24px] p-2 w-[90vw] max-w-[400px]">
          <!-- Paso 1: tipo de anuncio -->
          <nav v-if="filterStep === 'category'" class="flex flex-col">
            <a v-for="(cat, i) in filterCategories" :key="cat.key" class="menu-link flex items-center justify-between p-4 rounded-xl no-underline text-gray-500 font-medium text-[16px] hover:text-black transition-colors cursor-pointer" :class="activeCategory === cat.key ? 'text-black bg-gray-100' : ''" @click.prevent="selectCategory(cat.key)">
              <span style="font-family: var(--font-body);">{{ cat.label }}</span>
              <span class="link-num text-[12px] text-gray-400 font-mono">0{{ i+1 }}</span>
            </a>
          </nav>

          <!-- Paso 2: subfiltro (ciudad / sector / precio) para el tipo elegido -->
          <div v-else class="p-2">
            <button type="button" class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors mb-3 px-2" @click="backToCategories">
              <Icon name="chevronDown" class="w-3.5 h-3.5 rotate-90" />
              {{ activeCategoryLabel }}
            </button>

            <div class="flex flex-col gap-3 px-2 pb-2">
              <div>
                <label class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Ciudad</label>
                <LocationCombobox v-model="filterCity" :options="cityOptions" placeholder="Cualquier ciudad" />
              </div>
              <div>
                <label class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Sector</label>
                <LocationCombobox
                  v-model="filterSector"
                  :options="sectorOptions"
                  :disabled="!filterCity"
                  :placeholder="filterCity ? 'Cualquier sector' : 'Elige una ciudad primero'"
                />
              </div>
              <div>
                <label class="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Precio</label>
                <div class="flex items-center gap-2">
                  <input v-model.number.lazy="filterMinPrice" type="number" placeholder="Mín." class="w-full text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-black" >
                  <span class="text-gray-300">—</span>
                  <input v-model.number.lazy="filterMaxPrice" type="number" placeholder="Máx." class="w-full text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-black" >
                </div>
              </div>

              <button type="button" class="btn btn-neon w-full mt-1" @click="closeFilter">
                Ver {{ totalResults }} resultado{{ totalResults === 1 ? '' : 's' }}
              </button>
              <button type="button" class="text-xs font-semibold underline text-gray-500 hover:text-black" @click="goToSearch">
                Búsqueda avanzada
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sesión / cuenta (derecha) -->
      <div class="absolute top-6 right-6 flex items-center gap-4 pointer-events-auto">
        <NuxtLink v-if="!isAuthenticated" to="#" class="text-[15px] font-medium text-gray-600 hover:text-black transition-colors" @click.prevent="openLogin()">
          Iniciar sesión
        </NuxtLink>

        <div v-else ref="accountMenuRef" class="relative">
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style="background: var(--color-neon); color: #0D0D0D;"
            @click="showAccountMenu = !showAccountMenu"
          >
            {{ initials }}
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showAccountMenu" class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/5 py-2">
              <NuxtLink to="/cuenta" class="block px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="showAccountMenu = false">
                Mis publicaciones
              </NuxtLink>
              <NuxtLink to="/cuenta" class="block px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="showAccountMenu = false">
                Editar perfil
              </NuxtLink>
              <button class="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="handleSignOut">
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>

        <button class="btn btn-sm btn-neon text-sm" @click="goOrLogin('/publicar')">
          + Publicar
        </button>
      </div>
    </div>

    <!-- LAYOUT: sidebar + contenido -->
    <div class="flex flex-col lg:flex-row">

    <!-- LEFT SIDEBAR (Sticky) -->
    <div class="hidden lg:flex sticky top-0 h-screen w-[32%] flex-shrink-0 flex-col justify-between p-6 z-40">
      <!-- Logo (Top Left) -->
      <div class="flex items-center gap-2 cursor-pointer text-black">
        <Icon name="footsteps" width="24" height="24" />
        <span class="text-[20px] font-medium tracking-tight" style="font-family: var(--font-body);">
          Paseito
        </span>
      </div>

      <!-- Navigation / Detail Panel (Only one visible at a time) -->
      <div class="flex-grow flex flex-col justify-center">
        <!-- Grid View: Product List -->
        <ul class="space-y-1 text-[22px] leading-tight text-gray-500 font-normal tracking-tight" style="font-family: var(--font-body);">
          <li v-for="p in filteredProducts" :key="p.id" class="hover:text-black cursor-pointer transition-colors" @click="selectProduct(p)">
            {{ p.title }}
          </li>
          <li class="text-black font-medium mt-2 cursor-pointer" @click="selectCategory('ALL')">
            All Products
          </li>
        </ul>
      </div>

      <!-- Cart (Bottom Left) -->
      <button
        type="button"
        class="text-[18px] font-medium text-left cursor-pointer hover:opacity-70 transition-opacity"
        style="font-family: var(--font-body);"
        @click="openFavorites"
      >
        Mi Lista ({{ favCount }})
      </button>
      <FavoritesModal :show="showFavoritesModal" @close="showFavoritesModal = false" />
    </div>

    <!-- MOBILE HEADER -->
    <div class="lg:hidden w-full flex items-center justify-between p-6 z-[1100] bg-[var(--color-surface)] sticky top-0">
      <!-- Left: Logo -->
      <div class="flex items-center gap-2 cursor-pointer text-black">
        <Icon name="footsteps" width="24" height="24" />
        <span class="text-[20px] font-medium tracking-tight" style="font-family: var(--font-body);">Paseito</span>
      </div>

      <!-- Right: Icons -->
      <div class="flex items-center gap-5">
        <Icon name="bag" width="24" height="24" stroke-width="1.5" class="text-black cursor-pointer" />
        <div class="cursor-pointer text-black" @click="isMobileMenuOpen = true">
          <Icon name="menu" width="26" height="26" stroke-width="1.5" />
        </div>
      </div>
    </div>

    <!-- RIGHT CONTENT AREA -->
    <div class="w-full lg:w-[68%] flex-grow relative min-h-screen flex flex-col">
      
      <!-- VIEW: GRID -->
      <div class="w-full pt-8 px-4 lg:pt-28 lg:pr-8 lg:px-0 lg:pl-0 pb-12 flex justify-start">
        <!-- Skeleton: solo en la carga en frío (sin cache todavía) -->
        <div v-if="listingsPending && !listings.length" class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 w-full max-w-[1200px] content-start">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-[#e3e3df] rounded-2xl lg:rounded-[32px] aspect-square" />
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredProducts.length === 0" class="w-full py-24 text-center text-gray-500">
          <p class="text-lg font-medium" style="font-family: var(--font-body);">{{ hasFilters ? 'Sin resultados con estos filtros' : 'Aún no hay publicaciones' }}</p>
          <p class="text-sm mt-1">{{ hasFilters ? 'Prueba con otros filtros.' : 'Sé el primero en publicar un anuncio.' }}</p>
        </div>

        <!-- CSS Grid for Products -->
        <div v-else class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 w-full max-w-[1200px] content-start">
          <div
            v-for="p in filteredProducts"
            :key="p.id"
            class="product-card invisible opacity-0 bg-[#e3e3df] rounded-2xl lg:rounded-[32px] aspect-square flex items-center justify-center cursor-pointer relative group"
            @click="selectProduct(p)"
          >
            <img :src="coverImage(p)" :alt="p.title" width="400" height="400" loading="lazy" decoding="async" class="w-[80%] h-[80%] object-contain mix-blend-multiply" >

            <FeaturedBadge v-if="p.featured" class="absolute top-3 left-3 lg:top-5 lg:left-5" />

            <!-- Hover Info -->
            <div class="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <p class="text-black text-[22px] font-medium leading-tight tracking-tight" style="font-family: var(--font-body);">{{ p.title }}</p>
              <p class="text-gray-500 text-[17px] m">{{ formattedPrice(p) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <!-- FILTER BACKDROP (Teleported) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-show="isSectionVisible" class="hidden lg:block menu-overlay fixed inset-0 z-[900] pointer-events-none">
          <div class="menu-backdrop absolute inset-0 bg-transparent opacity-0" :class="isFilterOpen ? 'pointer-events-auto' : 'pointer-events-none'" @click="closeFilter"/>
        </div>
      </Transition>

      <!-- MOBILE MENU OVERLAY -->
      <Transition name="fade">
        <div v-show="isMobileMenuOpen" class="fixed inset-0 z-[2000] bg-[#4a4a4a] text-white flex flex-col">
          <div class="flex items-center justify-between p-6">
            <div class="flex items-center gap-2 cursor-pointer text-white">
              <Icon name="footstepsSolid" width="24" height="24" stroke="none" class="text-white" />
            </div>
            <div class="cursor-pointer text-white" @click="isMobileMenuOpen = false">
              <Icon name="close" width="24" height="24" stroke-width="1.5" />
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-12 no-scrollbar">
            <ul class="space-y-3 text-[19px] leading-tight font-normal tracking-tight" style="font-family: var(--font-body);">
              <li v-for="p in filteredProducts" :key="p.id" class="cursor-pointer opacity-90 hover:opacity-100 transition-opacity text-white" @click="selectProduct(p); isMobileMenuOpen = false;">
                {{ p.title }}
              </li>
              <li class="font-medium mt-6 cursor-pointer text-white" @click="isMobileMenuOpen = false">
                All Products
              </li>
            </ul>

            <div class="border-t border-white/15 mt-6 pt-6 flex flex-col gap-3 text-white">
              <template v-if="!isAuthenticated">
                <button class="text-left opacity-90 hover:opacity-100 transition-opacity" @click="openLogin(); isMobileMenuOpen = false">
                  Iniciar sesión
                </button>
              </template>
              <template v-else>
                <NuxtLink to="/cuenta" class="opacity-90 hover:opacity-100 transition-opacity" @click="isMobileMenuOpen = false">
                  Mis publicaciones
                </NuxtLink>
                <NuxtLink to="/cuenta" class="opacity-90 hover:opacity-100 transition-opacity" @click="isMobileMenuOpen = false">
                  Editar perfil
                </NuxtLink>
                <button class="text-left opacity-90 hover:opacity-100 transition-opacity" @click="handleSignOut(); isMobileMenuOpen = false">
                  Cerrar sesión
                </button>
              </template>
              <button class="btn btn-sm btn-neon w-full mt-1" @click="goOrLogin('/publicar'); isMobileMenuOpen = false">
                + Publicar
              </button>
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
</style>
