<script setup lang="ts">
/**
 * Página de subida de fotos
 */
useHead({ title: 'Subir fotos — Paseito' })

const route = useRoute()
const router = useRouter()
const listingId = computed(() => route.query.id as string)

// Placeholder — en producción se subirían las fotos
const photos = ref<{ file: File; preview: string }[]>([])

function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  Array.from(input.files).forEach((file) => {
    photos.value.push({
      file,
      preview: URL.createObjectURL(file),
    })
  })
}

function removePhoto(index: number) {
  URL.revokeObjectURL(photos.value[index].preview)
  photos.value.splice(index, 1)
}

function handleContinue() {
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
      <div class="flex-1 h-px" style="background: var(--color-neon);"></div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background: var(--color-neon); color: #0D0D0D;">2</div>
        <span class="text-sm font-semibold">Fotos</span>
      </div>
      <div class="flex-1 h-px" style="background: var(--color-border);"></div>
      <div class="flex items-center gap-2 opacity-40">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style="border-color: var(--color-border);">3</div>
        <span class="text-sm">Tour 360°</span>
      </div>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Fotos del listado
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Sube fotos normales de tu propiedad o vehículo
    </p>

    <!-- Upload area -->
    <label
      class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:border-[var(--color-neon)]"
      style="border-color: var(--color-border); background: var(--color-surface);"
      id="photo-upload-area"
    >
      <span class="text-4xl mb-2">📷</span>
      <span class="text-sm font-semibold">Arrastra fotos aquí o haz clic para seleccionar</span>
      <span class="text-xs mt-1" style="color: var(--color-muted);">JPG, PNG, WebP — máximo 10MB por foto</span>
      <input type="file" class="hidden" multiple accept="image/*" @change="handleFiles" />
    </label>

    <!-- Preview grid -->
    <div v-if="photos.length" class="grid grid-cols-3 gap-3 mt-6">
      <div v-for="(photo, index) in photos" :key="index" class="relative aspect-square rounded-xl overflow-hidden group">
        <img :src="photo.preview" :alt="`Foto ${index + 1}`" class="w-full h-full object-cover" />
        <button
          class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          @click="removePhoto(index)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-4 mt-8">
      <NuxtLink to="/publicar" class="btn btn-ghost rounded-full flex-1">
        ← Volver
      </NuxtLink>
      <button class="btn btn-neon flex-1" @click="handleContinue" id="photos-continue">
        Continuar → Tour 360°
      </button>
    </div>
  </div>
</template>
