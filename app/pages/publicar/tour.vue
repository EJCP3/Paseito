<script setup lang="ts">
/**
 * Página del editor de tours 360°
 * Subida de panorámicas + editor de hotspots
 */
useHead({ title: 'Editor de tour 360° — Paseito' })

const route = useRoute()
const listingId = computed(() => route.query.id as string)
const store = useTourEditorStore()

const showHotspotForm = ref(false)
const pendingYaw = ref(0)
const pendingPitch = ref(0)

function handleHotspotAdd(data: { yaw: number; pitch: number; sceneId: string }) {
  pendingYaw.value = data.yaw
  pendingPitch.value = data.pitch
  showHotspotForm.value = true
}

function handleHotspotSave(data: any) {
  // TODO: Save via API
  showHotspotForm.value = false
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 md:py-12">
    <!-- Progress -->
    <div class="flex items-center gap-2 mb-8">
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">✓</div>
        <span class="text-sm">Datos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-neon);"></div>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">✓</div>
        <span class="text-sm">Fotos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-neon);"></div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background: var(--color-neon); color: #0D0D0D;">3</div>
        <span class="text-sm font-semibold">Tour 360°</span>
      </div>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Editor de tour 360°
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Sube panorámicas y agrega hotspots de navegación e información
    </p>

    <!-- Upload panorama -->
    <div class="mb-8">
      <label
        class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:border-[var(--color-neon)]"
        style="border-color: var(--color-border); background: var(--color-surface);"
      >
        <span class="text-3xl mb-1">🌐</span>
        <span class="text-sm font-semibold">Subir panorámica 360°</span>
        <span class="text-xs mt-0.5" style="color: var(--color-muted);">Imagen equirectangular (proporción 2:1)</span>
        <input type="file" class="hidden" accept="image/*" />
      </label>
    </div>

    <!-- Editor -->
    <div v-if="store.scenes.length" class="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
      <ClientOnly>
        <TourEditorClient
          :scenes="store.scenes"
          :active-scene-id="store.activeSceneId"
          @hotspot-add="handleHotspotAdd"
          @scene-change="store.setActiveScene"
        />
      </ClientOnly>

      <SceneTabs
        :scenes="store.scenes"
        :active-scene-id="store.activeSceneId"
        @select="store.setActiveScene"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-16 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
      <p class="text-5xl mb-4">🌐</p>
      <p class="font-bold text-lg" style="font-family: var(--font-heading);">Sin panorámicas</p>
      <p class="text-sm mt-1" style="color: var(--color-muted);">
        Sube tu primera imagen panorámica 360° para comenzar a crear el tour
      </p>
    </div>

    <!-- Hotspot Form Modal -->
    <HotspotForm
      :show="showHotspotForm"
      :yaw="pendingYaw"
      :pitch="pendingPitch"
      :scene-id="store.activeSceneId"
      :scenes="store.scenes"
      @close="showHotspotForm = false"
      @save="handleHotspotSave"
    />

    <!-- Actions -->
    <div class="flex gap-4 mt-8">
      <NuxtLink :to="`/publicar/fotos?id=${listingId}`" class="btn btn-ghost rounded-full flex-1">
        ← Volver
      </NuxtLink>
      <button class="btn btn-neon flex-1" id="publish-listing-btn">
        Publicar listado 🚀
      </button>
    </div>
  </div>
</template>
