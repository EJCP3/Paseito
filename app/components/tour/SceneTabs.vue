<script setup lang="ts">
/**
 * SceneTabs — Riel de miniaturas de escenas
 * Scroll vertical en desktop, horizontal en móvil
 */
import type { SceneWithHotspots } from '~~/shared/types/listing'

const props = defineProps<{
  scenes: SceneWithHotspots[]
  activeSceneId: string
}>()

const emit = defineEmits<{
  (e: 'select', sceneId: string): void
}>()
</script>

<template>
  <div class="scene-tabs" id="scene-tabs">
    <h4 class="text-xs font-bold uppercase tracking-wider mb-3 px-1" style="color: var(--color-muted); font-family: var(--font-heading);">
      Escenas
    </h4>

    <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[50vh] pb-2 md:pb-0 md:pr-2 scrollbar-thin">
      <button
        v-for="scene in scenes"
        :key="scene.id"
        class="scene-tab flex-shrink-0 group cursor-pointer"
        :class="{ 'scene-tab-active': activeSceneId === scene.id }"
        @click="emit('select', scene.id)"
        :id="`scene-tab-${scene.id}`"
      >
        <!-- Thumbnail -->
        <div class="relative w-20 h-14 md:w-full md:h-16 rounded-lg overflow-hidden">
          <img
            :src="scene.previewUrl"
            :alt="scene.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <!-- Active indicator -->
          <div
            v-if="activeSceneId === scene.id"
            class="absolute inset-0 border-2 rounded-lg"
            style="border-color: var(--color-neon);"
          />
          <div v-else class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        </div>

        <!-- Label -->
        <p
          class="text-xs mt-1 text-center truncate max-w-20 md:max-w-full"
          :class="activeSceneId === scene.id ? 'font-bold text-black' : 'font-medium'"
          :style="activeSceneId !== scene.id ? 'color: var(--color-muted)' : ''"
        >
          {{ scene.name }}
        </p>
      </button>
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
