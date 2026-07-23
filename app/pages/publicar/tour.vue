<script setup lang="ts">
/**
 * Página del editor de tours 360°
 * Panorámicas 360° y fotos normales son independientes: se pueden subir
 * ambas a la vez, sin tener que elegir un modo exclusivo.
 * Subida con estados por imagen + eliminación de escenas/fotos + publicación
 * con redirección al anuncio.
 */
import type { Photo } from '~~/shared/types/listing'

useHead({ title: 'Editor de tour 360° — Paseito' })

const route = useRoute()
const router = useRouter()
const listingId = computed(() => route.query.id as string)
const store = useTourEditorStore()
const { validatePanoramaClient, uploadImage } = useUpload()

const uploadError = ref('')
// Aviso no bloqueante: la panorámica se subirá igual, solo advierte que se verá borrosa
const uploadWarning = ref('')
// Ancho mínimo recomendado para que una equirectangular no se vea pixelada en la esfera
const MIN_SHARP_WIDTH = 2048

const photos = ref<Photo[]>([])
const listingSlug = ref('')
const loadingListing = ref(true)

// Subidas en curso/fallidas, por imagen (corrige el estado "atascado en gris")
interface PendingUpload {
  key: number
  name: string
  preview: string
  status: 'uploading' | 'error'
  error?: string
  file: File
  kind: 'pano' | 'photo'
}
const pendingUploads = ref<PendingUpload[]>([])
const pendingPanoUploads = computed(() => pendingUploads.value.filter((p) => p.kind === 'pano'))
const pendingPhotoUploads = computed(() => pendingUploads.value.filter((p) => p.kind === 'photo'))
let uploadKey = 0

// Hidratar estado real del anuncio (escenas, fotos, slug) al entrar al editor
onMounted(async () => {
  try {
    const listing = await $fetch<any>(`/api/listings/${listingId.value}`)
    store.setScenes(listing.scenes || [])
    photos.value = listing.photos || []
    listingSlug.value = listing.slug || ''
  } catch {
    uploadError.value = 'No se pudo cargar el anuncio. Recarga la página.'
  } finally {
    loadingListing.value = false
  }
})

// --- Subida de panorámicas ---
async function handlePanoramaFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploadError.value = ''
  uploadWarning.value = ''

  const { valid, ratio, width } = await validatePanoramaClient(file)
  if (!valid) {
    uploadError.value = `La imagen no tiene proporción panorámica (2:1). Proporción actual: ${ratio.toFixed(2)}:1`
    return
  }

  // Baja resolución: no bloquea, solo avisa que se verá borrosa en el visor
  if (width < MIN_SHARP_WIDTH) {
    uploadWarning.value = `Tu panorámica es de baja resolución (${width}px de ancho), así que se verá borrosa en el visor 360°. Para que se vea nítida, usa una imagen de al menos 4096px de ancho.`
  }

  await uploadPanorama(file)
}

async function uploadPanorama(file: File, existing?: PendingUpload) {
  const entry: PendingUpload = existing ?? {
    key: ++uploadKey,
    name: file.name,
    preview: URL.createObjectURL(file),
    status: 'uploading',
    file,
    kind: 'pano',
  }
  if (existing) {
    existing.status = 'uploading'
    existing.error = undefined
  } else {
    pendingUploads.value.push(entry)
  }

  try {
    const uploaded = await uploadImage(file, listingId.value)
    if (!uploaded) throw new Error('upload')

    const order = store.scenes.length
    const scene = await $fetch('/api/tours/scenes', {
      method: 'POST',
      body: {
        name: `Escena ${order + 1}`,
        panoramaUrl: uploaded.url,
        previewUrl: uploaded.thumbUrl,
        order,
        initialYaw: 0,
        listingId: listingId.value,
      },
    })
    store.addScene({ ...(scene as any), hotspots: [] })
    URL.revokeObjectURL(entry.preview)
    pendingUploads.value = pendingUploads.value.filter((p) => p.key !== entry.key)
  } catch {
    const item = pendingUploads.value.find((p) => p.key === entry.key)
    if (item) {
      item.status = 'error'
      item.error = 'No se pudo subir. Reintenta.'
    }
  }
}

// --- Subida de fotos normales (modo fotos) ---
async function handlePhotoFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files || [])]
  input.value = ''
  uploadError.value = ''
  for (const file of files) uploadPhoto(file)
}

async function uploadPhoto(file: File, existing?: PendingUpload) {
  const entry: PendingUpload = existing ?? {
    key: ++uploadKey,
    name: file.name,
    preview: URL.createObjectURL(file),
    status: 'uploading',
    file,
    kind: 'photo',
  }
  if (existing) {
    existing.status = 'uploading'
    existing.error = undefined
  } else {
    pendingUploads.value.push(entry)
  }

  try {
    const uploaded = await uploadImage(file, listingId.value)
    if (!uploaded) throw new Error('upload')

    const photo = await $fetch<Photo>(`/api/listings/${listingId.value}/photos`, {
      method: 'POST',
      body: { url: uploaded.url, thumbUrl: uploaded.thumbUrl, order: photos.value.length },
    })
    photos.value.push(photo)
    URL.revokeObjectURL(entry.preview)
    pendingUploads.value = pendingUploads.value.filter((p) => p.key !== entry.key)
  } catch {
    const item = pendingUploads.value.find((p) => p.key === entry.key)
    if (item) {
      item.status = 'error'
      item.error = 'No se pudo subir. Reintenta.'
    }
  }
}

function retryUpload(entry: PendingUpload) {
  if (entry.kind === 'pano') uploadPanorama(entry.file, entry)
  else uploadPhoto(entry.file, entry)
}

function discardUpload(entry: PendingUpload) {
  URL.revokeObjectURL(entry.preview)
  pendingUploads.value = pendingUploads.value.filter((p) => p.key !== entry.key)
}

// --- Eliminación (con confirmación para evitar toques accidentales en móvil) ---
async function handleDeleteScene(sceneId: string) {
  const scene = store.scenes.find((s) => s.id === sceneId)
  if (!scene) return
  if (!confirm(`¿Eliminar la escena "${scene.name}"?`)) return
  await $fetch(`/api/tours/scenes/${sceneId}`, { method: 'DELETE' })
  store.removeScene(sceneId)
}

async function handleDeletePhoto(photo: Photo) {
  if (!confirm('¿Eliminar esta foto?')) return
  await $fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
  photos.value = photos.value.filter((p) => p.id !== photo.id)
}

async function handleRenamePhoto(photo: Photo) {
  await $fetch(`/api/photos/${photo.id}`, { method: 'PATCH', body: { name: photo.name } })
}

// --- Hotspots (sin cambios) ---
const showHotspotForm = ref(false)
const pendingYaw = ref(0)
const pendingPitch = ref(0)

function handleHotspotAdd(data: { yaw: number; pitch: number; sceneId: string }) {
  pendingYaw.value = data.yaw
  pendingPitch.value = data.pitch
  showHotspotForm.value = true
}

function handleHotspotSave(data: any) {
  showHotspotForm.value = false
}

async function handleRenameScene(sceneId: string, name: string) {
  store.renameScene(sceneId, name)
  await $fetch(`/api/tours/scenes/${sceneId}`, { method: 'PATCH', body: { name } })
}

// --- Publicar: redirige al anuncio recién creado ---
const isPublishing = ref(false)
const publishError = ref('')
const { sweep } = useGlimmSweep()

async function publishListing() {
  publishError.value = ''

  // No navegar mientras una foto/panorámica todavía se está subiendo: si no,
  // el anuncio se abre sin ese archivo (la subida sigue en curso o falló).
  if (pendingUploads.value.length) {
    publishError.value = 'Espera a que terminen de subirse las imágenes.'
    return
  }

  isPublishing.value = true
  try {
    // El anuncio ya quedó ACTIVE al crearse; aseguramos tener el slug para redirigir
    let slug = listingSlug.value
    if (!slug) {
      const listing = await $fetch<any>(`/api/listings/${listingId.value}`)
      slug = listing.slug
    }
    if (!slug) throw new Error('sin slug')

    const coverImage = photos.value[0]?.thumbUrl || photos.value[0]?.url || store.scenes[0]?.previewUrl
    sweep(async () => {
      await navigateTo(`/anuncio/${slug}`)
      await preloadImage(coverImage)
    })
  } catch {
    publishError.value = 'No se pudo publicar el anuncio. Intenta de nuevo.'
    isPublishing.value = false
  }
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
      Imágenes del recorrido
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Agrega un tour virtual 360° o fotos normales de tu propiedad
    </p>

    <!-- Cargando el anuncio -->
    <div v-if="loadingListing" class="py-16 text-center" style="color: var(--color-muted);">
      Cargando…
    </div>

    <template v-if="!loadingListing">
      <p v-if="uploadError" class="text-sm text-red-600 mb-4">{{ uploadError }}</p>

      <!-- SECCIÓN: Panorámicas 360° -->
      <section class="mb-10">
        <h2 class="text-lg font-bold mb-1" style="font-family: var(--font-heading);">Panorámicas 360°</h2>
        <p class="text-sm mb-4" style="color: var(--color-muted);">Imágenes equirectangulares (proporción 2:1) para el recorrido virtual.</p>

        <label
          class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-colors hover:border-[var(--color-neon)] cursor-pointer mb-4"
          style="border-color: var(--color-border); background: var(--color-surface);"
        >
          <Icon name="panorama" class="w-8 h-8 mb-1" stroke-width="1.5" style="color: var(--color-muted);" />
          <span class="text-sm font-semibold">Subir panorámica 360°</span>
          <span class="text-xs mt-0.5" style="color: var(--color-muted);">Imagen equirectangular (proporción 2:1)</span>
          <input type="file" class="hidden" accept="image/*" @change="handlePanoramaFile" />
        </label>
        <p v-if="uploadWarning" class="text-sm mb-4 flex items-start gap-1.5" style="color: #b45309;">
          <Icon name="alertTriangle" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ uploadWarning }}</span>
        </p>

        <!-- Subidas de panorámicas en curso / con error -->
        <div v-if="pendingPanoUploads.length" class="flex flex-wrap gap-3 mb-4">
          <div
            v-for="p in pendingPanoUploads"
            :key="p.key"
            class="relative w-28 h-20 rounded-xl overflow-hidden"
            :style="p.status === 'error' ? 'outline: 2px solid #dc2626;' : ''"
          >
            <img :src="p.preview" :alt="p.name" class="w-full h-full object-cover" :class="{ 'opacity-40': p.status === 'uploading' }" />
            <div v-if="p.status === 'uploading'" class="absolute inset-0 flex items-center justify-center">
              <Icon name="spinner" class="w-6 h-6 animate-spin text-black" />
            </div>
            <div v-else class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
              <button type="button" class="text-xs font-bold text-white underline" @click="retryUpload(p)">Reintentar</button>
              <button type="button" class="text-[10px] text-white/70 underline" @click="discardUpload(p)">Descartar</button>
            </div>
          </div>
        </div>

        <div v-if="store.scenes.length" class="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
          <!-- TourEditor es .client.vue: monta solo en cliente, sin <ClientOnly> -->
          <TourEditor
            :scenes="store.scenes"
            :active-scene-id="store.activeSceneId"
            @hotspot-add="handleHotspotAdd"
            @scene-change="store.setActiveScene"
          />

          <SceneTabs
            :scenes="store.scenes"
            :active-scene-id="store.activeSceneId"
            editable
            @select="store.setActiveScene"
            @rename="handleRenameScene"
            @delete="handleDeleteScene"
          />
        </div>

        <!-- Empty state 360 -->
        <div v-else-if="!pendingPanoUploads.length" class="text-center py-12 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
          <p class="font-bold" style="font-family: var(--font-heading);">Sin panorámicas</p>
          <p class="text-sm mt-1" style="color: var(--color-muted);">
            Sube tu primera imagen panorámica 360° para comenzar a crear el tour
          </p>
        </div>
      </section>

      <!-- SECCIÓN: Fotos normales -->
      <section>
        <h2 class="text-lg font-bold mb-1" style="font-family: var(--font-heading);">Fotos normales</h2>
        <p class="text-sm mb-4" style="color: var(--color-muted);">Fotos comunes, sin restricción de proporción. Se muestran como galería en el anuncio.</p>

        <label
          class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-colors hover:border-[var(--color-neon)] cursor-pointer mb-4"
          style="border-color: var(--color-border); background: var(--color-surface);"
        >
          <Icon name="bag" class="w-8 h-8 mb-1" stroke-width="1.5" style="color: var(--color-muted);" />
          <span class="text-sm font-semibold">Subir fotos</span>
          <span class="text-xs mt-0.5" style="color: var(--color-muted);">JPG, PNG, WebP — puedes elegir varias</span>
          <input type="file" class="hidden" accept="image/*" multiple @change="handlePhotoFiles" />
        </label>

        <!-- Subidas de fotos en curso / con error -->
        <div v-if="pendingPhotoUploads.length" class="flex flex-wrap gap-3 mb-4">
          <div
            v-for="p in pendingPhotoUploads"
            :key="p.key"
            class="relative w-28 h-20 rounded-xl overflow-hidden"
            :style="p.status === 'error' ? 'outline: 2px solid #dc2626;' : ''"
          >
            <img :src="p.preview" :alt="p.name" class="w-full h-full object-cover" :class="{ 'opacity-40': p.status === 'uploading' }" />
            <div v-if="p.status === 'uploading'" class="absolute inset-0 flex items-center justify-center">
              <Icon name="spinner" class="w-6 h-6 animate-spin text-black" />
            </div>
            <div v-else class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
              <button type="button" class="text-xs font-bold text-white underline" @click="retryUpload(p)">Reintentar</button>
              <button type="button" class="text-[10px] text-white/70 underline" @click="discardUpload(p)">Descartar</button>
            </div>
          </div>
        </div>

        <div v-if="photos.length" class="flex flex-wrap gap-3">
          <div v-for="photo in photos" :key="photo.id" class="w-40 group">
            <div class="relative w-40 h-28 rounded-xl overflow-hidden">
              <img :src="photo.thumbUrl || photo.url" alt="Foto del anuncio" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm opacity-70 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                aria-label="Eliminar foto"
                @click="handleDeletePhoto(photo)"
              >
                <Icon name="close" class="w-3.5 h-3.5" stroke-width="2.5" />
              </button>
            </div>
            <input
              v-model="photo.name"
              type="text"
              class="w-full mt-1.5 px-2.5 py-1 text-xs rounded-lg border"
              style="border-color: var(--color-border); background: var(--color-surface);"
              placeholder="Nombre (opcional)"
              @blur="handleRenamePhoto(photo)"
            />
          </div>
        </div>

        <div v-else-if="!pendingPhotoUploads.length" class="text-center py-12 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
          <p class="font-bold" style="font-family: var(--font-heading);">Sin fotos</p>
          <p class="text-sm mt-1" style="color: var(--color-muted);">
            Sube fotos normales de tu propiedad — se mostrarán como galería en el anuncio
          </p>
        </div>
      </section>
    </template>

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

    <p v-if="publishError" class="text-sm text-red-600 mt-6">{{ publishError }}</p>

    <!-- Actions -->
    <div class="flex gap-4 mt-8">
      <NuxtLink :to="`/publicar/fotos?id=${listingId}`" class="btn rounded-full flex-1" style="border: 1px solid var(--color-border); background: transparent; color: #171717;">
        Volver
      </NuxtLink>
      <button
        class="btn btn-neon flex-1"
        id="publish-listing-btn"
        :disabled="isPublishing || loadingListing || !!pendingUploads.length"
        @click="publishListing"
      >
        {{ isPublishing ? 'Publicando…' : pendingUploads.length ? 'Subiendo imágenes…' : 'Publicar anuncio' }}
      </button>
    </div>
  </div>
</template>
