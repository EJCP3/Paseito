<script setup lang="ts">
/**
 * Página de detalle de listado — Visor 360° + info panel
 * Layout: panel info izq + visor 360 centro + miniaturas derecha
 * Responsive: colapsa a vertical en móvil
 */
import type { ListingFull, SceneWithHotspots } from '~~/shared/types/listing'
import { ListingTypeLabels, ListingTypeIcons } from '~~/shared/types/enums'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Fetch listing by slug
const { data: listing, error } = await useFetch<ListingFull>(`/api/listings/${slug.value}`)

if (error.value || !listing.value) {
  throw createError({ statusCode: 404, statusMessage: 'Listado no encontrado' })
}

useHead({
  title: `${listing.value.title} — Paseito`,
  meta: [
    { name: 'description', content: listing.value.description.slice(0, 160) },
  ],
})

const scenes = computed<SceneWithHotspots[]>(() => listing.value?.scenes || [])
const { activeSceneId, goToScene } = useTour(scenes)
const tourViewerRef = ref<any>(null)
const showDetails = ref(false)

const formattedPrice = computed(() => {
  if (!listing.value) return ''
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: listing.value.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(listing.value.price))
})

const whatsappUrl = computed(() => {
  const phone = listing.value?.owner?.phone || ''
  const message = encodeURIComponent(
    `¡Hola! Me interesa "${listing.value?.title}" en Paseito. ¿Podemos hablar?`
  )
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`
})

function handleSceneChange(sceneId: string) {
  goToScene(sceneId)
}

function handleSceneSelect(sceneId: string) {
  goToScene(sceneId)
  tourViewerRef.value?.goToScene(sceneId)
}
</script>

<template>
  <div v-if="listing" class="min-h-screen relative" id="listing-detail">
    <!-- Desktop Layout: 3 columns -->
    <div class="hidden lg:grid lg:grid-cols-[320px_1fr_160px] lg:h-[calc(100vh-4rem)]">
      <!-- Left Panel — Info -->
      <div class="p-6 flex flex-col justify-between border-r" style="border-color: var(--color-border);">
        <div>
          <!-- Category -->
          <span class="pill text-xs mb-4 inline-flex">
            {{ ListingTypeIcons[listing.type as keyof typeof ListingTypeIcons] }}
            {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
          </span>

          <!-- Title & Price -->
          <h1 class="text-2xl font-black tracking-tight leading-tight mt-3" style="font-family: var(--font-heading);">
            {{ listing.title }}
          </h1>

          <p class="text-3xl font-black mt-4" style="font-family: var(--font-heading); letter-spacing: -0.03em;">
            {{ formattedPrice }}
          </p>

          <p v-if="listing.city" class="text-sm mt-2" style="color: var(--color-muted);">
            📍 {{ [listing.sector, listing.city].filter(Boolean).join(', ') }}
          </p>

          <!-- CTA buttons -->
          <div class="mt-8 space-y-3">
            <a
              :href="whatsappUrl"
              target="_blank"
              class="btn btn-neon w-full"
              id="listing-whatsapp-btn"
            >
              💬 Contactar por WhatsApp
            </a>
          </div>
        </div>

        <!-- Bottom: Saved -->
        <button class="btn btn-ghost btn-sm rounded-full mt-6 self-start" id="listing-save-btn">
          ♡ Guardar
        </button>
      </div>

      <!-- Center — 360 Viewer -->
      <div class="relative flex items-center justify-center p-4">
        <ClientOnly>
          <TourViewerClient
            v-if="scenes.length"
            ref="tourViewerRef"
            :scenes="scenes"
            @scene-change="handleSceneChange"
          />
          <template #fallback>
            <div class="w-full h-[70vh] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
              <p style="color: var(--color-muted);">Cargando visor 360°...</p>
            </div>
          </template>
        </ClientOnly>

        <!-- No scenes fallback -->
        <div v-if="!scenes.length" class="w-full h-[70vh] rounded-2xl flex items-center justify-center" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
          <div class="text-center">
            <p class="text-4xl mb-3">🏠</p>
            <p class="font-bold" style="font-family: var(--font-heading);">Sin tour virtual</p>
            <p class="text-sm" style="color: var(--color-muted);">Este listado aún no tiene panorámicas 360°</p>
          </div>
        </div>
      </div>

      <!-- Right Panel — Scene Thumbnails -->
      <div v-if="scenes.length > 1" class="p-4 border-l" style="border-color: var(--color-border);">
        <SceneTabs
          :scenes="scenes"
          :active-scene-id="activeSceneId"
          @select="handleSceneSelect"
        />
      </div>
    </div>

    <!-- Mobile Layout: stacked -->
    <div class="lg:hidden">
      <!-- Viewer -->
      <div class="px-4 pt-4">
        <ClientOnly>
          <TourViewerClient
            v-if="scenes.length"
            ref="tourViewerRef"
            :scenes="scenes"
            @scene-change="handleSceneChange"
          />
          <template #fallback>
            <div class="w-full h-[50vh] rounded-2xl bg-gray-100 animate-pulse" />
          </template>
        </ClientOnly>
      </div>

      <!-- Scene tabs (horizontal scroll) -->
      <div v-if="scenes.length > 1" class="px-4 mt-4">
        <SceneTabs
          :scenes="scenes"
          :active-scene-id="activeSceneId"
          @select="handleSceneSelect"
        />
      </div>

      <!-- Info -->
      <div class="px-4 py-6 space-y-4">
        <span class="pill text-xs inline-flex">
          {{ ListingTypeIcons[listing.type as keyof typeof ListingTypeIcons] }}
          {{ ListingTypeLabels[listing.type as keyof typeof ListingTypeLabels] }}
        </span>

        <h1 class="text-2xl font-black tracking-tight" style="font-family: var(--font-heading);">
          {{ listing.title }}
        </h1>

        <p class="text-3xl font-black" style="font-family: var(--font-heading);">
          {{ formattedPrice }}
        </p>

        <p v-if="listing.city" class="text-sm" style="color: var(--color-muted);">
          📍 {{ [listing.sector, listing.city].filter(Boolean).join(', ') }}
        </p>

        <a :href="whatsappUrl" target="_blank" class="btn btn-neon w-full mt-4">
          💬 Contactar por WhatsApp
        </a>
      </div>

      <!-- Details toggle -->
      <div class="px-4 pb-6">
        <button
          class="btn btn-ghost w-full rounded-full"
          @click="showDetails = !showDetails"
          id="listing-details-toggle"
        >
          {{ showDetails ? 'Ocultar' : 'Detalles' }} {{ showDetails ? '▲' : '▼' }}
        </button>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[1000px]"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 max-h-[1000px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="showDetails" class="mt-4 overflow-hidden">
            <ListingDetailsPanel :listing="listing as ListingFull" />
          </div>
        </Transition>
      </div>
    </div>

    <!-- Desktop Details (bottom fixed) -->
    <div class="hidden lg:block fixed bottom-0 left-0 right-0 z-40">
      <div class="max-w-5xl mx-auto px-8">
        <button
          class="btn btn-ghost w-full rounded-t-2xl rounded-b-none py-3 glass"
          style="border: 1px solid var(--color-border); border-bottom: none;"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? 'Ocultar detalles' : 'Detalles' }} {{ showDetails ? '▲' : '▼' }}
        </button>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div v-if="showDetails" class="bg-white rounded-t-2xl shadow-2xl p-8" style="border: 1px solid var(--color-border); border-bottom: none;">
            <ListingDetailsPanel :listing="listing as ListingFull" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
