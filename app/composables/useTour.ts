// Composable — useTour
// Lógica del visor 360°: escena activa, navegación, fullscreen
import type { SceneWithHotspots } from '~~/shared/types/listing'

export function useTour(scenes: Ref<SceneWithHotspots[]>) {
  const activeSceneId = ref('')
  const isFullscreen = ref(false)

  // Inicializar con la primera escena
  watch(scenes, (val) => {
    if (val.length && !activeSceneId.value) {
      activeSceneId.value = val[0].id
    }
  }, { immediate: true })

  const activeScene = computed(() =>
    scenes.value.find((s) => s.id === activeSceneId.value)
  )

  const activeSceneIndex = computed(() =>
    scenes.value.findIndex((s) => s.id === activeSceneId.value)
  )

  function goToScene(sceneId: string) {
    activeSceneId.value = sceneId
  }

  function nextScene() {
    const idx = activeSceneIndex.value
    if (idx < scenes.value.length - 1) {
      activeSceneId.value = scenes.value[idx + 1].id
    }
  }

  function prevScene() {
    const idx = activeSceneIndex.value
    if (idx > 0) {
      activeSceneId.value = scenes.value[idx - 1].id
    }
  }

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
  }

  return {
    activeSceneId,
    activeScene,
    activeSceneIndex,
    isFullscreen,
    goToScene,
    nextScene,
    prevScene,
    toggleFullscreen,
  }
}
