<script setup lang="ts">
/**
 * Página de detalle de un anuncio — mismo lenguaje visual que el home
 * (sidebar sticky, logo, room-rail flotante) pero con datos reales y el
 * visor 360° real (Photo Sphere Viewer + tours), sin datos de prueba.
 */
import type { ListingFull, SceneWithHotspots } from '~~/shared/types/listing'
import { ListingTypeLabels } from '~~/shared/types/enums'
import { listingJsonLd, serializeJsonLd } from '~~/shared/utils/jsonLd'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const { data: listing, error } = await useFetch<ListingFull>(`/api/listings/${slug.value}`)

if (error.value || !listing.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
}

const appUrl = String(useRuntimeConfig().public.appUrl).replace(/\/+$/, '')
const canonical = `${appUrl}/anuncio/${listing.value.slug}`
const seoDesc = listing.value.description.replace(/\s+/g, ' ').trim().slice(0, 155)
const seoImage = cld(listing.value.photos?.[0]?.url || listing.value.scenes?.[0]?.previewUrl, 'w_1200,h_630,c_fill,f_jpg,q_auto')
const seoTitle = `${listing.value.title} — Paseito`

useSeoMeta({
  title: seoTitle,
  description: seoDesc,
  ogTitle: seoTitle,
  ogDescription: seoDesc,
  ogImage: seoImage || undefined,
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary_large_image',
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{ type: 'application/ld+json', innerHTML: serializeJsonLd(listingJsonLd(listing.value, appUrl)) }],
})

const scenes = computed<SceneWithHotspots[]>(() => listing.value?.scenes || [])
const { activeSceneId, goToScene } = useTour(scenes)
const tourViewerRef = ref<any>(null)
const showDetails = ref(false)

// Galería de fotos normales — independiente del tour 360°, un anuncio puede
// tener ambos a la vez (ver publicar/tour.vue). viewingPhoto decide cuál
// ocupa el visor principal cuando hay de los dos tipos.
const photos = computed(() => listing.value?.photos || [])
const activePhotoId = ref(photos.value[0]?.id || '')
const activePhoto = computed(() =>
  photos.value.find((p) => p.id === activePhotoId.value) || photos.value[0]
)
const viewingPhoto = ref(!scenes.value.length && photos.value.length > 0)

function selectPhoto(photoId: string) {
  activePhotoId.value = photoId
  viewingPhoto.value = true
  showDetails.value = false
}

const { count: favCount, isFavorite, toggle: toggleFavorite } = useFavorites()
const saved = computed(() => !!listing.value && isFavorite(listing.value.id))
function toggleSave() {
  if (listing.value) toggleFavorite(listing.value)
}

const { isAuthenticated, openLogin, user: authUser } = useAuth()
const showReport = ref(false)
const canReport = computed(() => !!listing.value && listing.value.status === 'ACTIVE' && listing.value.owner?.id !== authUser.value?.id)
const showFavoritesModal = ref(false)
function openFavorites() {
  if (!isAuthenticated.value) return openLogin()
  showFavoritesModal.value = true
}

const formattedPrice = computed(() => {
  if (!listing.value) return ''
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: listing.value.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(listing.value.price))
})

const locationText = computed(() => {
  if (!listing.value) return ''
  return [listing.value.sector, listing.value.city].filter(Boolean).join(', ')
})

const publishedDate = computed(() => {
  if (!listing.value) return ''
  return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(listing.value.createdAt))
})

const whatsappUrl = computed(() => {
  const phone = listing.value?.owner?.phone || ''
  const message = encodeURIComponent(
    `¡Hola! Me interesa "${listing.value?.title}" en Paseito. ¿Podemos hablar?`
  )
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`
})

// Redes/contactos que el dueño eligió mostrar (reemplaza el botón fijo de WhatsApp)
const contactMeta: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', website: 'Sitio web',
}
function contactHref(c: { type: string; value: string }) {
  if (c.type === 'whatsapp') {
    const message = encodeURIComponent(`¡Hola! Me interesa "${listing.value?.title}" en Paseito. ¿Podemos hablar?`)
    return `https://wa.me/${c.value.replace(/\D/g, '')}?text=${message}`
  }
  return /^https?:\/\//.test(c.value) ? c.value : `https://${c.value}`
}
const contactLinks = computed(() =>
  (listing.value?.contacts || []).map((c) => ({
    ...c,
    href: contactHref(c),
    label: contactMeta[c.type] || c.type,
  }))
)

function handleSceneChange(sceneId: string) {
  goToScene(sceneId)
}

function selectScene(sceneId: string) {
  goToScene(sceneId)
  // El visor puede no haber montado todavía (ClientOnly + WebGL async)
  if (tourViewerRef.value && typeof tourViewerRef.value.goToScene === 'function') {
    tourViewerRef.value.goToScene(sceneId)
  }
  viewingPhoto.value = false
  showDetails.value = false
}

const { sweep } = useGlimmSweep()
onMounted(prefetchGlimm)

function backToHome() {
  sweep(async () => {
    await router.push('/#product-session')
    await nextTick()
    // Doble rAF: deja que el layout/GSAP de la página nueva ya se haya
    // pintado antes de empezar a descubrir la franja.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  })
}
</script>

<template>
  <section v-if="listing" class="relative w-full bg-[var(--color-surface)] min-h-screen flex flex-col lg:flex-row">

    <!-- LEFT SIDEBAR (Sticky) -->
    <div class="hidden lg:flex sticky top-0 h-screen w-[32%] flex-shrink-0 flex-col justify-between p-6 z-40">
      <div class="flex items-center gap-2 cursor-pointer text-black" @click="backToHome">
<Icon name="footsteps" width="24" height="24" class="-rotate-90" />
        <span class="text-[20px] font-medium tracking-tight text-black" style="font-family: var(--font-body);">
          Volver a Paseito
        </span>
      </div>

      <div class="flex-grow flex flex-col justify-center">
        <div class="flex flex-col pr-8">
          <span class="pill text-xs mb-4 inline-flex w-fit">
            {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
          </span>

          <h1 class="text-[20px] font-medium leading-tight tracking-tight mb-1" style="font-family: var(--font-body);">{{ listing.title }}</h1>
          <p class="text-[17px] text-gray-500 mb-1 font-normal">{{ formattedPrice }}</p>
          <p v-if="locationText" class="text-sm mb-1" style="color: var(--color-muted);">{{ locationText }}</p>
          <p class="text-xs mb-4" style="color: var(--color-muted-light);">Publicado el {{ publishedDate }}</p>

          <div v-if="listing.owner" class="mb-6">
            <SellerInlineProfile :owner="listing.owner" />
          </div>

          <div class="flex flex-col items-start gap-2">
            <!-- Redes elegidas por el dueño; si no hay, WhatsApp del perfil como respaldo.
                 Todos sólidos y legibles (nunca ghost/transparente). -->
            <template v-if="contactLinks.length">
              <a
                v-for="c in contactLinks"
                :key="c.type"
                :href="c.href"
                target="_blank"
                rel="noopener"
                class="btn btn-sm rounded-full"
                :class="c.type === 'whatsapp' ? 'btn-neon' : ''"
                :style="c.type !== 'whatsapp' ? 'background: #171717; color: #ffffff; border: none;' : ''"
              >
                {{ c.label }}
              </a>
            </template>
            <a v-else-if="listing.owner?.phone" id="listing-whatsapp-btn" :href="whatsappUrl" target="_blank" class="btn btn-neon btn-sm">
              Contactar por WhatsApp
            </a>
            <button
              id="listing-save-btn"
              class="btn btn-sm rounded-full"
              :class="saved ? 'btn-info' : 'btn-neutral'"
              @click="toggleSave"
            >
              <Icon :name="saved ? 'heartFilled' : 'heart'" class="w-3.5 h-3.5 inline" />
              {{ saved ? 'Guardado' : 'Guardar' }}
            </button>
            <button v-if="canReport" type="button" class="text-xs underline py-1" style="color: var(--color-muted);" @click="showReport = true">
              Reportar anuncio
            </button>
          </div>
        </div>
      </div>

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
    <div class="lg:hidden w-full flex items-center justify-between p-4 px-6 z-[1100] bg-[var(--color-surface)] sticky top-0">
      <div class="flex items-center gap-2 cursor-pointer text-black" @click="backToHome">
<Icon name="footsteps" width="24" height="24" class="-rotate-90" />
        <span class="text-[20px] font-medium tracking-tight text-black" style="font-family: var(--font-body);">Paseito</span>
      </div>
      <button
        id="listing-save-btn-mobile"
        class="btn btn-sm btn-square rounded-full"
        :class="saved ? 'btn-neon' : 'btn-ghost text-black'"
        :aria-label="saved ? 'Quitar de Mi Lista' : 'Guardar'"
        :aria-pressed="saved"
        @click="toggleSave"
      >
        <Icon :name="saved ? 'heartFilled' : 'heart'" class="w-4 h-4" />
      </button>
    </div>

    <!-- RIGHT CONTENT AREA -->
    <div class="w-full lg:w-[68%] flex-grow relative min-h-screen">
      <!-- lg:pr-52 deja espacio al rail flotante de "otros anuncios" (w-40 + gap) -->
      <div class="w-full flex flex-col min-h-screen lg:h-screen lg:sticky top-0 relative py-8 lg:py-12 px-4 lg:pl-[120px] lg:pr-52 justify-start lg:justify-center">
        <div class="flex-1 flex flex-col justify-center items-center max-w-3xl w-full mx-auto">

          <!-- 360 Viewer (oculto cuando se muestran los Detalles) -->
          <!-- TourViewer es .client.vue: ya monta solo en cliente. NO envolver en
               <ClientOnly> (queda pegado en el fallback y nunca monta). -->
          <div v-show="!showDetails" class="w-full">
            <!-- Condiciones independientes (no v-else-if): un v-else sobre el
                 componente .client rompe su montaje en hidratación. -->
            <LazyTourViewer
              v-if="scenes.length && !viewingPhoto"
              ref="tourViewerRef"
              :scenes="scenes"
              @scene-change="handleSceneChange"
            />

            <!-- Galería de fotos normales (independiente del tour: puede coexistir) -->
            <div v-if="(viewingPhoto || !scenes.length) && photos.length" class="w-full max-w-[768px] mx-auto">
              <img
                :src="cld(activePhoto?.url, 'f_auto,q_auto,c_limit,w_1600')"
                :srcset="[800, 1200, 1600].map(w => `${cld(activePhoto?.url, `f_auto,q_auto,c_limit,w_${w}`)} ${w}w`).join(', ')"
                sizes="(min-width: 1024px) 768px, 100vw"
                :alt="listing.title"
                width="1600"
                height="1000"
                fetchpriority="high"
                class="w-full aspect-[16/10] object-cover rounded-2xl"
                :style="{ borderRadius: 'var(--radius-viewer)' }"
              >
            </div>

            <!-- Sin tour ni fotos -->
            <div v-if="!scenes.length && !photos.length" class="w-full aspect-[16/10] max-h-[65vh] rounded-[32px] flex items-center justify-center" style="background: var(--color-surface-elevated); border: 2px dashed var(--color-border);">
              <div class="text-center px-6">
                <Icon name="home" width="40" height="40" stroke-width="1.5" class="mx-auto mb-3" style="color: var(--color-muted);" />
                <p class="font-bold" style="font-family: var(--font-heading);">Sin tour virtual</p>
                <p class="text-sm mt-1" style="color: var(--color-muted);">Este anuncio aún no tiene panorámicas 360°</p>
              </div>
            </div>
          </div>

          <!-- Detalles (reemplaza al visor) -->
          <div v-show="showDetails" class="w-full max-w-xl mt-6 lg:mt-0">
            <ListingDetailsPanel :listing="listing as ListingFull" />
          </div>

          <!-- Room Rail (escenas + Detalles) -->
          <div class="flex flex-row lg:flex-col gap-3 lg:gap-4 static lg:absolute lg:left-8 lg:top-1/2 lg:-translate-y-1/2 z-20 w-full lg:w-auto overflow-x-auto lg:overflow-visible no-scrollbar pt-6 pb-2 lg:pt-0 lg:pb-0 items-center lg:items-stretch">
            <div
              v-for="scene in scenes" :key="scene.id"
              class="w-[64px] lg:w-[76px] flex flex-col items-center gap-1 cursor-pointer rounded-2xl lg:rounded-[20px] p-1.5 lg:p-2 transition-all flex-shrink-0"
              :class="activeSceneId === scene.id && !viewingPhoto && !showDetails ? 'bg-white shadow-md scale-105' : 'bg-[var(--color-surface-elevated)] hover:bg-white/60'"
              @click="selectScene(scene.id)"
            >
              <img :src="cld(scene.previewUrl, 'f_auto,q_auto,c_limit,w_160')" :alt="scene.name" width="60" height="60" loading="lazy" class="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] object-cover rounded-xl lg:rounded-[14px] block" >
              <span class="text-[10px] lg:text-[11px] font-bold text-center leading-tight mt-1 truncate w-full" :class="activeSceneId === scene.id && !viewingPhoto && !showDetails ? 'text-black' : 'text-gray-600'">{{ scene.name }}</span>
            </div>

            <!-- Miniaturas de fotos (coexisten con las de escenas si hay ambas) -->
            <template v-if="photos.length">
              <div
                v-for="(photo, i) in photos" :key="photo.id"
                class="w-[64px] lg:w-[76px] flex flex-col items-center gap-1 cursor-pointer rounded-2xl lg:rounded-[20px] p-1.5 lg:p-2 transition-all flex-shrink-0"
                :class="activePhotoId === photo.id && viewingPhoto && !showDetails ? 'bg-white shadow-md scale-105' : 'bg-[var(--color-surface-elevated)] hover:bg-white/60'"
                @click="selectPhoto(photo.id)"
              >
                <img :src="cld(photo.thumbUrl || photo.url, 'f_auto,q_auto,c_limit,w_160')" :alt="`Foto ${i + 1}`" width="60" height="60" loading="lazy" class="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] object-cover rounded-xl lg:rounded-[14px] block" >
                <span class="text-[10px] lg:text-[11px] font-bold text-center leading-tight mt-1 truncate w-full" :class="activePhotoId === photo.id && viewingPhoto && !showDetails ? 'text-black' : 'text-gray-600'">{{ photo.name || `Foto ${i + 1}` }}</span>
              </div>
            </template>

            <!-- Detalles thumbnail -->
            <div
              class="w-[64px] lg:w-[76px] flex flex-col items-center gap-1 cursor-pointer rounded-2xl lg:rounded-[20px] p-1.5 lg:p-2 transition-all flex-shrink-0 lg:mt-2"
              :class="showDetails ? 'bg-white shadow-md scale-105' : 'bg-[var(--color-surface-elevated)] hover:bg-white/60'"
              @click="showDetails = !showDetails"
            >
              <div class="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-xl lg:rounded-[14px] flex items-center justify-center" style="background: var(--color-surface-elevated); color: var(--color-muted);">
                <Icon name="filterLines" width="20" height="20" class="lg:w-6 lg:h-6" />
              </div>
              <span class="text-[10px] lg:text-[11px] font-bold text-center leading-tight mt-1" :class="showDetails ? 'text-black' : 'text-gray-600'">Detalles</span>
            </div>
          </div>

          <!-- MOBILE INFO (Debajo del visor) -->
          <div class="flex lg:hidden flex-col w-full mt-8 mb-6 max-w-xl text-left px-2">
            <span class="pill text-xs mb-3 inline-flex w-fit">
              {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
            </span>
            <h1 class="text-[24px] font-medium leading-tight tracking-tight mb-2" style="font-family: var(--font-body);">{{ listing.title }}</h1>
            <p class="text-[18px] text-gray-500 mb-1 font-normal">{{ formattedPrice }}</p>
            <p v-if="locationText" class="text-sm mb-4" style="color: var(--color-muted);">{{ locationText }}</p>

            <template v-if="contactLinks.length">
              <div class="flex flex-col gap-2">
                <a
                  v-for="c in contactLinks"
                  :key="c.type"
                  :href="c.href"
                  target="_blank"
                  rel="noopener"
                  class="btn w-full rounded-full"
                  :class="c.type === 'whatsapp' ? 'btn-neon' : ''"
                  :style="c.type !== 'whatsapp' ? 'background: #171717; color: #ffffff; border: none;' : ''"
                >
                  {{ c.label }}
                </a>
              </div>
            </template>
            <a v-else-if="listing.owner?.phone" :href="whatsappUrl" target="_blank" class="btn btn-neon w-full">
              Contactar por WhatsApp
            </a>
            <button v-if="canReport" type="button" class="text-xs underline py-3 self-start" style="color: var(--color-muted);" @click="showReport = true">
              Reportar anuncio
            </button>
          </div>

          <!-- Otros anuncios, montado una sola vez: móvil = carrusel al final;
               desktop = dock vertical flotante a la derecha (ancla: contenedor relative padre). -->
          <div class="w-full mb-6 px-2 lg:mb-0 lg:px-0 lg:absolute lg:right-4 lg:top-0 lg:h-full lg:w-40 lg:overflow-y-auto no-scrollbar z-10">
            <ClientOnly>
              <RelatedListingsRail :exclude-id="listing.id" class="h-full" />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
    <ReportModal v-if="canReport" :show="showReport" :listing-id="listing.id" @close="showReport = false" />
  </section>
</template>
