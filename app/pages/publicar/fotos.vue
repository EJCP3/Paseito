<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
/**
 * Página de subida de fotos — solo la foto de portada del anuncio.
 * La portada se persiste en el servidor (Photo con order 0) y se rehidrata al
 * montar, así se muestra sin importar cuántas veces se navegue entre pasos.
 */
useHead({ title: 'Subir fotos — Paseito' })

const route = useRoute()
const router = useRouter()
const listingId = computed(() => route.query.id as string)
const { uploading, uploadImage, error: uploadErr } = useUpload()

// Portada ya guardada en el servidor (photos[0]). Fuente de verdad al volver.
const existingCover = ref<{ id: string; url: string; thumbUrl: string } | null>(null)
// Archivo nuevo elegido localmente, aún sin subir; reemplaza la portada actual.
const newCover = ref<{ file: File; preview: string } | null>(null)
const loading = ref(true)
const error = ref('')

// Qué imagen se muestra: la nueva local tiene prioridad sobre la guardada.
const previewUrl = computed(() =>
  newCover.value?.preview || existingCover.value?.url || existingCover.value?.thumbUrl || null
)

onMounted(async () => {
  try {
    const listing = await $fetch<any>(`/api/listings/${listingId.value}`)
    const cover = listing.photos?.[0]
    if (cover) existingCover.value = { id: cover.id, url: cover.url, thumbUrl: cover.thumbUrl }
  } catch {
    // No bloquea: el usuario puede subir la portada igual.
  } finally {
    loading.value = false
  }
})

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (newCover.value) URL.revokeObjectURL(newCover.value.preview)
  newCover.value = { file, preview: URL.createObjectURL(file) }
}

async function removeCover() {
  // Si hay un archivo local sin subir, solo lo descartamos.
  if (newCover.value) {
    URL.revokeObjectURL(newCover.value.preview)
    newCover.value = null
    return
  }
  // Si la portada ya estaba guardada, la borramos del servidor.
  if (existingCover.value) {
    await $fetch(`/api/photos/${existingCover.value.id}`, { method: 'DELETE' }).catch(() => {})
    existingCover.value = null
  }
}

async function handleContinue() {
  error.value = ''

  // Solo subimos si el usuario eligió un archivo nuevo; si conserva la portada
  // ya guardada no re-subimos (evita duplicados al pasar por este paso varias veces).
  if (newCover.value) {
    const result = await uploadImage(newCover.value.file, listingId.value)
    if (!result) {
      error.value = uploadErr.value || 'No se pudo subir la foto. Intenta de nuevo.'
      return
    }
    // Reemplaza la portada anterior para no acumular duplicados con order 0.
    if (existingCover.value) {
      await $fetch(`/api/photos/${existingCover.value.id}`, { method: 'DELETE' }).catch(() => {})
    }
    await $fetch(`/api/listings/${listingId.value}/photos`, {
      method: 'POST',
      body: { url: result.url, thumbUrl: result.thumbUrl, order: 0 },
    })
  }

  router.push(`/publicar/tour?id=${listingId.value}`)
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 md:py-12">
    <!-- Progress -->
    <div class="flex items-center gap-2 mb-8">
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">✓</div>
        <span class="text-sm">Datos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-neon);"/>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background: var(--color-neon); color: #0D0D0D;">2</div>
        <span class="text-sm font-semibold">Fotos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-border);"/>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">3</div>
        <span class="text-sm">Tour 360°</span>
      </div>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Foto de portada
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Sube la foto principal de tu inmueble
    </p>

    <!-- Upload area -->
    <label
      v-if="!previewUrl"
      id="photo-upload-area"
      class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:border-[var(--color-neon)]"
      style="border-color: var(--color-border); background: var(--color-surface);"
    >
      <Icon name="bag" class="w-9 h-9 mb-2" stroke-width="1.5" style="color: var(--color-muted);" />
      <span class="text-sm font-semibold">Arrastra una foto aquí o haz clic para seleccionar</span>
      <span class="text-xs mt-1" style="color: var(--color-muted);">JPG, PNG, WebP — máximo 10MB</span>
      <input type="file" class="hidden" accept="image/*" @change="handleFile" >
    </label>

    <!-- Cover preview -->
    <div v-else class="relative w-full aspect-video rounded-2xl overflow-hidden">
      <img :src="previewUrl" alt="Foto de portada" class="w-full h-full object-cover" >
      <button
        type="button"
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
        aria-label="Eliminar foto"
        @click="removeCover"
      >
        <Icon name="close" class="w-4 h-4" stroke-width="2.5" />
      </button>
    </div>

    <p v-if="error" class="text-sm text-red-600 mt-4">{{ error }}</p>

    <!-- Actions -->
    <div class="flex gap-4 mt-8">
      <NuxtLink to="/publicar" class="btn rounded-full flex-1" style="border: 1px solid var(--color-border); background: transparent; color: #171717;">
        Volver
      </NuxtLink>
      <button id="photos-continue" class="btn btn-neon flex-1" :disabled="uploading || loading" @click="handleContinue">
        {{ uploading ? 'Subiendo…' : 'Continuar → Tour 360°' }}
      </button>
    </div>
  </div>
</template>
