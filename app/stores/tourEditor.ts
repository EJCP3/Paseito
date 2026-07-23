// Pinia Store — Tour Editor
// Estado del editor de tours: escenas, hotspots, escena activa
import { defineStore } from 'pinia'
import type { SceneWithHotspots, Hotspot } from '~~/shared/types/listing'

export const useTourEditorStore = defineStore('tourEditor', () => {
  const scenes = ref<SceneWithHotspots[]>([])
  const activeSceneId = ref<string>('')
  const isSaving = ref(false)
  const pendingHotspot = ref<{ yaw: number; pitch: number } | null>(null)
  const showHotspotForm = ref(false)

  const activeScene = computed(() =>
    scenes.value.find((s) => s.id === activeSceneId.value)
  )

  function setScenes(newScenes: SceneWithHotspots[]) {
    scenes.value = newScenes
    if (newScenes.length && !activeSceneId.value) {
      activeSceneId.value = newScenes[0].id
    }
  }

  function setActiveScene(id: string) {
    activeSceneId.value = id
  }

  function addScene(scene: SceneWithHotspots) {
    scenes.value.push(scene)
  }

  function renameScene(id: string, name: string) {
    const scene = scenes.value.find((s) => s.id === id)
    if (scene) {
      scene.name = name
    }
  }

  function removeScene(id: string) {
    scenes.value = scenes.value.filter((s) => s.id !== id)
    if (activeSceneId.value === id && scenes.value.length) {
      activeSceneId.value = scenes.value[0].id
    }
  }

  function startHotspotPlacement(yaw: number, pitch: number) {
    pendingHotspot.value = { yaw, pitch }
    showHotspotForm.value = true
  }

  function addHotspot(sceneId: string, hotspot: Hotspot) {
    const scene = scenes.value.find((s) => s.id === sceneId)
    if (scene) {
      scene.hotspots.push(hotspot)
    }
  }

  function removeHotspot(sceneId: string, hotspotId: string) {
    const scene = scenes.value.find((s) => s.id === sceneId)
    if (scene) {
      scene.hotspots = scene.hotspots.filter((h) => h.id !== hotspotId)
    }
  }

  function cancelHotspotForm() {
    pendingHotspot.value = null
    showHotspotForm.value = false
  }

  async function saveHotspots(sceneId: string) {
    const scene = scenes.value.find((s) => s.id === sceneId)
    if (!scene) return

    isSaving.value = true
    try {
      await $fetch('/api/tours/hotspots', {
        method: 'PUT',
        body: {
          sceneId,
          hotspots: scene.hotspots,
        },
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    scenes,
    activeSceneId,
    activeScene,
    isSaving,
    pendingHotspot,
    showHotspotForm,
    setScenes,
    setActiveScene,
    addScene,
    renameScene,
    removeScene,
    startHotspotPlacement,
    addHotspot,
    removeHotspot,
    cancelHotspotForm,
    saveHotspots,
  }
})
