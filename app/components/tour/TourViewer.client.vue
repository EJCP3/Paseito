<script setup lang="ts">
/**
 * TourViewer.client.vue — Visor 360° público
 * Usa Photo Sphere Viewer con VirtualTourPlugin y MarkersPlugin
 * Renderiza solo en cliente (WebGL no existe en SSR)
 */
import { Viewer } from '@photo-sphere-viewer/core'
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'
import type { SceneWithHotspots } from '~~/shared/types/listing'
import { escapeHtml } from '~~/shared/utils/escapeHtml'

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

// Markers de los hotspots INFO de una escena, en el formato que espera el nodo
// del VirtualTourPlugin (tooltip con glassmorphism, mismo look del editor).
function infoMarkersForScene(scene: SceneWithHotspots) {
  return scene.hotspots
    .filter((h) => h.type === 'INFO')
    .map((h) => ({
      id: h.id,
      position: { yaw: h.yaw, pitch: h.pitch },
      html: `
        <div class="glass-dark rounded-xl px-3 py-2 max-w-[200px] cursor-pointer">
          ${h.title ? `<p class="font-bold text-xs text-white">${escapeHtml(h.title)}</p>` : ''}
          ${h.text ? `<p class="text-xs text-white/70 mt-0.5">${escapeHtml(h.text)}</p>` : ''}
        </div>
      `,
      anchor: 'center center',
    }))
}

// En carga completa (reload/hidratación SSR) el ref del contenedor puede estar aún
// sin asignar o medir 0px cuando corre onMounted; Photo Sphere Viewer crearía un
// canvas 0x0 (o no se crearía) y quedaría en blanco. Esperamos (hasta ~2s) a que el
// contenedor exista y tenga tamaño real antes de instanciar el visor.
function waitForContainer(frames = 120): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const check = (n: number) => {
      const el = containerRef.value
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) return resolve(el)
      if (n <= 0) return resolve(el ?? null)
      requestAnimationFrame(() => check(n - 1))
    }
    check(frames)
  })
}

onMounted(async () => {
  if (!props.scenes.length) return

  // Set initial active scene name
  activeSceneName.value = props.scenes[0]?.name || ''

  const container = await waitForContainer()
  if (!container) return // desmontado o sin contenedor

  try {
  viewer = new Viewer({
    container,
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
            // Sin transformar: con panorámicas 8K el límite de megapíxeles del plan gratuito de Cloudinary dejaría el visor en blanco.
            panorama: s.panoramaUrl,
            name: escapeHtml(s.name),
            links: s.hotspots
              .filter((h) => h.type === 'LINK' && h.targetSceneId)
              .map((h) => ({
                nodeId: h.targetSceneId!,
                position: { yaw: h.yaw, pitch: h.pitch },
              })),
            // Los INFO van como markers DEL NODO: el VirtualTourPlugin controla
            // el MarkersPlugin y reemplaza los markers al cambiar de escena, así
            // que un `markers` global se borraría. Adjuntándolos al nodo, se
            // muestran solo en su escena y sobreviven a la navegación.
            markers: infoMarkersForScene(s),
          })),
          startNodeId: props.scenes[0]?.id,
        },
      ],
      // MarkersPlugin debe estar registrado para que el VirtualTourPlugin
      // pinte los markers de cada nodo (sin config global de markers).
      [MarkersPlugin, {}],
      // Gira solo a los 2s de inactividad y se retoma tras cada pausa por
      // interacción del usuario (comportamiento por defecto del plugin).
      [AutorotatePlugin, { autostartDelay: 1000, autorotateSpeed: '1rpm' }],
    ],
  })

  // Escuchar cambios de escena
  const virtualTour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
  if (virtualTour) {
    virtualTour.addEventListener('node-changed', (e: any) => {
      const node = props.scenes.find((s) => s.id === e.node?.id)
      if (node) {
        activeSceneName.value = node.name
        emit('scene-change', node.id)
      }
    })
  }

  // Al estar listo, re-mide y re-renderiza tras el layout definitivo.
  // Esto evita el canvas en blanco cuando la página se carga completa (reload).
  viewer.addEventListener('ready', () => {
    requestAnimationFrame(() => {
      viewer?.autoSize()
      viewer?.needsUpdate()
    })
  }, { once: true })

  // Ocultar hint después de la primera interacción
  viewer.addEventListener('position-updated', () => {
    if (showHint.value) showHint.value = false
  }, { once: true })
  } catch (err) {
    console.error('[TourViewer] Error al crear el visor 360°:', err)
  }
})

// Navegar a escena programáticamente
function goToScene(sceneId: string) {
  if (!viewer) return
  const virtualTour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
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
    <!-- Viewer container (ancho y bajo, tipo landscape) -->
    <div
      ref="containerRef"
      class="w-full overflow-hidden"
      :class="isFullscreen ? 'h-full rounded-none' : 'max-w-[768px] mx-auto aspect-[16/10] rounded-2xl'"
      :style="{ borderRadius: isFullscreen ? '0' : 'var(--radius-viewer)' }"
    />

    <!-- Overlay UI -->
    <template v-if="scenes.length">
      <!-- Badge 360° (arriba izquierda) -->
      <div class="viewer-badge-360 glass-dark" style="color: var(--color-neon);">
        360°
      </div>

      <!-- Título de la escena activa (abajo izquierda) -->
      <div v-if="activeSceneName" class="absolute bottom-3 left-3 z-10">
        <span class="glass-dark rounded-full px-3 py-1.5 text-xs text-white font-semibold">
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
        <div v-if="showHint" class="viewer-hint glass-dark rounded-full text-white text-xs flex items-center gap-1.5">
          <Icon name="dragHorizontal" class="w-3.5 h-3.5" />
          Arrastra para recorrer
        </div>
      </Transition>

      <!-- Botón pantalla completa (pill con texto, arriba derecha) -->
      <button
        id="viewer-fullscreen-btn"
        class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 text-black text-sm font-semibold px-3.5 py-2 rounded-full shadow-sm hover:bg-white transition-colors cursor-pointer"
        :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
        @click="toggleFullscreen"
      >
        <Icon :name="isFullscreen ? 'collapse' : 'expand'" class="w-4 h-4" />
        <span>{{ isFullscreen ? 'Salir' : 'Pantalla completa' }}</span>
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
