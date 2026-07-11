<script setup lang="ts">
/**
 * TourViewer.client.vue — Visor 360° público
 * Usa Photo Sphere Viewer con VirtualTourPlugin y MarkersPlugin
 * Renderiza solo en cliente (WebGL no existe en SSR)
 */
import { Viewer } from '@photo-sphere-viewer/core'
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'
import type { SceneWithHotspots } from '~~/shared/types/listing'

const props = defineProps<{
  scenes: SceneWithHotspots[]
}>()

const emit = defineEmits<{
  (e: 'scene-change', sceneId: string): void
}>()

const containerRef = ref<HTMLElement>()
const isFullscreen = ref(false)
const activeSceneName = ref('')
const showHint = ref(true)
let viewer: Viewer | null = null

onMounted(() => {
  if (!containerRef.value || !props.scenes.length) return

  // Set initial active scene name
  activeSceneName.value = props.scenes[0]?.name || ''

  viewer = new Viewer({
    container: containerRef.value,
    // Primera panorámica como default (será gestionada por VirtualTourPlugin)
    navbar: false,
    loadingTxt: 'Cargando vista 360°...',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: false,
    defaultZoomLvl: 50,
    plugins: [
      [
        VirtualTourPlugin,
        {
          nodes: props.scenes.map((s) => ({
            id: s.id,
            panorama: s.panoramaUrl,
            name: s.name,
            links: s.hotspots
              .filter((h) => h.type === 'LINK' && h.targetSceneId)
              .map((h) => ({
                nodeId: h.targetSceneId!,
                position: { yaw: h.yaw, pitch: h.pitch },
              })),
          })),
          startNode: props.scenes[0]?.id,
        },
      ],
      [
        MarkersPlugin,
        {
          markers: props.scenes.flatMap((s) =>
            s.hotspots
              .filter((h) => h.type === 'INFO')
              .map((h) => ({
                id: h.id,
                position: { yaw: h.yaw, pitch: h.pitch },
                html: `
                  <div class="glass-dark rounded-xl px-3 py-2 max-w-[200px] cursor-pointer">
                    ${h.title ? `<p class="font-bold text-xs text-white">${h.title}</p>` : ''}
                    ${h.text ? `<p class="text-xs text-white/70 mt-0.5">${h.text}</p>` : ''}
                  </div>
                `,
                anchor: 'center center',
                data: { sceneId: s.id },
                visible: true,
              }))
          ),
        },
      ],
    ],
  })

  // Escuchar cambios de escena
  const virtualTour = viewer.getPlugin(VirtualTourPlugin)
  if (virtualTour) {
    virtualTour.addEventListener('node-changed', (e: any) => {
      const node = props.scenes.find((s) => s.id === e.node?.id)
      if (node) {
        activeSceneName.value = node.name
        emit('scene-change', node.id)
      }
    })
  }

  // Ocultar hint después de la primera interacción
  viewer.addEventListener('position-updated', () => {
    if (showHint.value) showHint.value = false
  }, { once: true })
})

// Navegar a escena programáticamente
function goToScene(sceneId: string) {
  if (!viewer) return
  const virtualTour = viewer.getPlugin(VirtualTourPlugin)
  if (virtualTour) {
    virtualTour.setCurrentNode(sceneId)
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!containerRef.value) return

  if (!isFullscreen.value) {
    containerRef.value.closest('.viewer-wrapper')?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
  isFullscreen.value = !isFullscreen.value
}

// Cleanup
onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
})

// Exponer métodos
defineExpose({ goToScene, toggleFullscreen })
</script>

<template>
  <div class="viewer-wrapper relative" :class="{ 'fixed inset-0 z-50': isFullscreen }">
    <!-- Viewer container -->
    <div
      ref="containerRef"
      class="w-full overflow-hidden"
      :class="isFullscreen ? 'h-full rounded-none' : 'h-[60vh] md:h-[70vh] rounded-2xl'"
      :style="{ borderRadius: isFullscreen ? '0' : 'var(--radius-viewer)' }"
    />

    <!-- Overlay UI -->
    <template v-if="scenes.length">
      <!-- Badge 360° -->
      <div class="viewer-badge-360 glass-dark" style="color: var(--color-neon);">
        360°
      </div>

      <!-- Nombre de escena activa -->
      <div v-if="activeSceneName" class="absolute top-3 left-16 z-10">
        <span class="glass-dark rounded-full px-3 py-1 text-xs text-white font-medium">
          {{ activeSceneName }}
        </span>
      </div>

      <!-- Hint de arrastre -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-500"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showHint" class="viewer-hint glass-dark rounded-full text-white text-xs">
          ↔ Arrastra para recorrer
        </div>
      </Transition>

      <!-- Botón fullscreen -->
      <button
        class="absolute top-3 right-3 z-10 glass-dark rounded-lg p-2 hover:bg-white/20 transition-colors cursor-pointer"
        @click="toggleFullscreen"
        :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
        id="viewer-fullscreen-btn"
      >
        <svg v-if="!isFullscreen" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <svg v-else class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      </button>

      <!-- Exit fullscreen bar -->
      <div v-if="isFullscreen" class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          class="glass-dark rounded-full px-4 py-2 text-sm text-white font-medium hover:bg-white/20 transition-colors"
          @click="toggleFullscreen"
        >
          Presiona ESC o clic para salir
        </button>
      </div>
    </template>
  </div>
</template>
