<script setup lang="ts">
/**
 * SceneTabs — Riel de miniaturas de escenas
 * Scroll vertical en desktop, horizontal en móvil
 */
import type { SceneWithHotspots } from '~~/shared/types/listing'

defineProps<{
  scenes: SceneWithHotspots[]
  activeSceneId: string
  editable?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', sceneId: string): void
  (e: 'rename', sceneId: string, name: string): void
  (e: 'delete', sceneId: string): void
}>()

const editingId = ref<string | null>(null)
const editingName = ref('')
const inputRefs = new Map<string, HTMLInputElement>()

function startEditing(scene: SceneWithHotspots) {
  editingId.value = scene.id
  editingName.value = scene.name
  nextTick(() => inputRefs.get(scene.id)?.focus())
}

function commitEditing() {
  if (!editingId.value) return
  const name = editingName.value.trim()
  if (name) emit('rename', editingId.value, name)
  editingId.value = null
}

function cancelEditing() {
  editingId.value = null
}
</script>

<template>
  <div id="scene-tabs" class="scene-tabs">
    <h4 class="text-xs font-bold uppercase tracking-wider mb-3 px-1" style="color: var(--color-muted); font-family: var(--font-heading);">
      Escenas
    </h4>

    <div class="flex flex-wrap gap-2 pb-2 scrollbar-thin">
      <div
        v-for="scene in scenes"
        :id="`scene-tab-${scene.id}`"
        :key="scene.id"
        class="scene-tab relative flex-shrink-0 group"
        :class="{ 'scene-tab-active': activeSceneId === scene.id }"
      >
        <!-- Thumbnail -->
        <button type="button" class="block cursor-pointer" @click="emit('select', scene.id)">
          <div class="relative w-20 h-14 rounded-lg overflow-hidden">
            <img
              :src="scene.previewUrl"
              :alt="scene.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            >
            <!-- Active indicator -->
            <div
              v-if="activeSceneId === scene.id"
              class="absolute inset-0 border-2 rounded-lg"
              style="border-color: var(--color-neon);"
            />
            <div v-else class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
        </button>

        <!-- Eliminar escena (siempre visible en táctil, resaltado en hover) -->
        <button
          v-if="editable"
          type="button"
          class="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm opacity-70 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
          :aria-label="`Eliminar escena ${scene.name}`"
          @click.stop="emit('delete', scene.id)"
        >
          <Icon name="close" class="w-3 h-3" stroke-width="2.5" />
        </button>

        <!-- Label / editor de nombre -->
        <div v-if="editingId === scene.id" class="mt-1" @click.stop>
          <input
            :ref="(el) => { if (el) inputRefs.set(scene.id, el as HTMLInputElement) }"
            v-model="editingName"
            type="text"
            maxlength="40"
            class="w-full text-xs text-center rounded px-1 py-0.5"
            style="border: 1px solid var(--color-neon); background: white; color: #171717;"
            @keydown.enter="commitEditing"
            @keydown.escape="cancelEditing"
            @blur="commitEditing"
          >
        </div>
        <div v-else class="mt-1 flex items-center justify-center gap-1">
          <p
            class="text-xs text-center truncate max-w-16"
            :class="activeSceneId === scene.id ? 'font-bold text-black' : 'font-medium'"
            :style="activeSceneId !== scene.id ? 'color: var(--color-muted)' : ''"
          >
            {{ scene.name }}
          </p>
          <button
            v-if="editable"
            type="button"
            class="flex-shrink-0 hover:opacity-70 transition-opacity"
            style="color: var(--color-muted);"
            aria-label="Renombrar escena"
            @click.stop="startEditing(scene)"
          >
            <Icon name="pencil" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene-tab {
  transition: all 0.2s ease;
}

.scene-tab:hover {
  transform: translateY(-2px);
}

.scene-tab-active {
  transform: translateY(-2px);
}
</style>
