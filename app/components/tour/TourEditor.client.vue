<script setup lang="ts">
/**
 * TourEditor.client.vue — Editor de tours 360°
 * Extiende TourViewer con modo edición:
 * clic en esfera → captura {yaw, pitch} → abre HotspotForm
 */
import { Viewer } from '@photo-sphere-viewer/core'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { SceneWithHotspots } from '~~/shared/types/listing'
import { icons } from '~/assets/icons'
import { escapeHtml } from '~~/shared/utils/escapeHtml'

const props = defineProps<{
  scenes: SceneWithHotspots[]
  activeSceneId: string
}>()

const emit = defineEmits<{
  (e: 'hotspot-add', data: { yaw: number; pitch: number; sceneId: string }): void
  (e: 'scene-change', sceneId: string): void
}>()

const containerRef = ref<HTMLElement>()
let viewer: Viewer | null = null

const activeScene = computed(() =>
  props.scenes.find((s) => s.id === props.activeSceneId) || props.scenes[0]
)

onMounted(() => {
  if (!containerRef.value || !activeScene.value) return

  viewer = new Viewer({
    container: containerRef.value,
    panorama: activeScene.value.panoramaUrl,
    navbar: false,
    loadingTxt: 'Cargando editor...',
    defaultZoomLvl: 50,
    plugins: [
      [MarkersPlugin, {}],
    ],
  })

  // Renderizar hotspots existentes
  renderMarkers()

  // Escuchar clic para agregar hotspot
  viewer.addEventListener('click', (e: any) => {
    const { yaw, pitch } = e.data
    emit('hotspot-add', {
      yaw,
      pitch,
      sceneId: props.activeSceneId,
    })
  })
})

// Renderizar markers de la escena activa
function renderMarkers() {
  if (!viewer) return
  const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
  if (!markersPlugin) return

  markersPlugin.clearMarkers()

  const scene = activeScene.value
  if (!scene) return

  // Markers de photo-sphere-viewer: HTML crudo, no un template Vue — no puede
  // usar <Icon>, pero reutiliza el mismo contenido del registro central.
  const iconSvg = (name: string) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`
  const linkIcon = iconSvg('link')
  const infoIcon = iconSvg('infoCircle')

  scene.hotspots.forEach((h) => {
    markersPlugin.addMarker({
      id: h.id,
      position: { yaw: h.yaw, pitch: h.pitch },
      html: `
        <div class="editor-marker ${h.type === 'LINK' ? 'marker-link' : 'marker-info'}">
          ${h.type === 'LINK' ? linkIcon : infoIcon}
          <span class="text-[10px]">${escapeHtml(h.title || (h.type === 'LINK' ? 'Enlace' : 'Info'))}</span>
        </div>
      `,
      anchor: 'center center',
    })
  })
}

// Cambiar panorámica cuando cambia la escena activa
watch(() => props.activeSceneId, async () => {
  if (!viewer || !activeScene.value) return
  await viewer.setPanorama(activeScene.value.panoramaUrl)
  renderMarkers()
})

// Re-renderizar los markers cuando cambian los hotspots de la escena activa
// (agregar/eliminar), sin esperar a cambiar de escena ni recargar la página.
watch(() => activeScene.value?.hotspots, () => renderMarkers(), { deep: true })

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
})
</script>

<template>
  <div class="relative">
    <div
      ref="containerRef"
      class="w-full h-[60vh] overflow-hidden"
      style="border-radius: var(--radius-viewer);"
    />

    <!-- Editor hint -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div class="glass-dark rounded-full px-4 py-2 text-xs text-white font-medium flex items-center gap-1.5">
        <Icon name="target" class="w-3.5 h-3.5 flex-shrink-0" />
        Haz clic en la esfera para agregar un hotspot
      </div>
    </div>
  </div>
</template>

<style>
.editor-marker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.marker-link {
  background: rgba(185, 255, 102, 0.9);
  color: #0D0D0D;
}

.marker-info {
  background: rgba(255, 255, 255, 0.85);
  color: #0D0D0D;
  backdrop-filter: blur(8px);
}

.editor-marker:hover {
  transform: scale(1.1);
}
</style>
