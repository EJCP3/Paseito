<script setup lang="ts">
/**
 * HotspotForm — Modal para crear/editar hotspot
 * Tipo (enlace a escena / información), destino, título, texto
 */
import { HotspotType, HotspotTypeLabels } from '~~/shared/types/enums'
import type { SceneWithHotspots } from '~~/shared/types/listing'

const props = defineProps<{
  show: boolean
  yaw: number
  pitch: number
  sceneId: string
  scenes: SceneWithHotspots[]
  editingHotspot?: {
    id?: string
    type: string
    title?: string | null
    text?: string | null
    targetSceneId?: string | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: {
    type: string
    yaw: number
    pitch: number
    title?: string
    text?: string
    targetSceneId?: string
  }): void
}>()

const type = ref<string>(props.editingHotspot?.type || HotspotType.LINK)
const title = ref(props.editingHotspot?.title || '')
const text = ref(props.editingHotspot?.text || '')
const targetSceneId = ref(props.editingHotspot?.targetSceneId || '')

// Escenas disponibles como destino (excluir la escena actual)
const availableScenes = computed(() =>
  props.scenes.filter((s) => s.id !== props.sceneId)
)

function handleSave() {
  emit('save', {
    type: type.value,
    yaw: props.yaw,
    pitch: props.pitch,
    title: title.value || undefined,
    text: text.value || undefined,
    targetSceneId: type.value === HotspotType.LINK ? targetSceneId.value || undefined : undefined,
  })
}

// Reset al abrir
watch(() => props.show, (val) => {
  if (!val) return
  const h = props.editingHotspot
  type.value = h?.type || HotspotType.LINK
  title.value = h?.title || ''
  text.value = h?.text || ''
  targetSceneId.value = h?.targetSceneId || ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4" id="hotspot-form-modal">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
          <h3 class="text-lg font-bold mb-4" style="font-family: var(--font-heading);">
            {{ editingHotspot ? 'Editar' : 'Nuevo' }} punto de interés
          </h3>

          <div class="space-y-4">
            <!-- Tipo -->
            <div>
              <label class="text-xs font-semibold block mb-2" style="color: var(--color-muted);">Tipo</label>
              <div class="flex gap-2">
                <button
                  class="pill flex-1 justify-center"
                  :class="{ active: type === HotspotType.LINK }"
                  @click="type = HotspotType.LINK"
                >
                  <Icon name="link" class="w-3.5 h-3.5" />
                  {{ HotspotTypeLabels[HotspotType.LINK] }}
                </button>
                <button
                  class="pill flex-1 justify-center"
                  :class="{ active: type === HotspotType.INFO }"
                  @click="type = HotspotType.INFO"
                >
                  <Icon name="infoCircle" class="w-3.5 h-3.5" />
                  {{ HotspotTypeLabels[HotspotType.INFO] }}
                </button>
              </div>
            </div>

            <!-- Escena destino (solo para LINK) -->
            <div v-if="type === HotspotType.LINK">
              <label class="field relative">
                <span class="field-label">Escena destino</span>
                <select v-model="targetSceneId" class="field-input" id="hotspot-target-scene">
                  <option value="">Seleccionar escena...</option>
                  <option v-for="s in availableScenes" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
                <Icon name="chevronDown" class="w-4 h-4 absolute right-4 bottom-3 pointer-events-none" style="color: var(--color-muted);" />
              </label>
            </div>

            <!-- Título -->
            <label class="field">
              <span class="field-label">
                Título {{ type === HotspotType.INFO ? '(requerido)' : '(opcional)' }}
              </span>
              <input
                v-model="title"
                type="text"
                class="field-input"
                placeholder="Ej: Sala principal, Motor V6..."
                id="hotspot-title"
              />
            </label>

            <!-- Texto (solo para INFO) -->
            <label v-if="type === HotspotType.INFO" class="field">
              <span class="field-label">Descripción</span>
              <textarea
                v-model="text"
                class="field-input resize-none"
                rows="3"
                placeholder="Describe este punto de interés..."
                id="hotspot-text"
              />
            </label>

            <!-- Coordenadas (read-only) -->
            <div class="flex gap-4 text-xs" style="color: var(--color-muted-light);">
              <span>Yaw: {{ yaw.toFixed(4) }}</span>
              <span>Pitch: {{ pitch.toFixed(4) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-6">
            <button class="btn btn-ghost rounded-full flex-1" @click="emit('close')">
              Cancelar
            </button>
            <button
              class="btn btn-neon flex-1"
              :disabled="(type === HotspotType.LINK && !targetSceneId) || (type === HotspotType.INFO && !title && !text)"
              @click="handleSave"
              id="hotspot-save-btn"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
