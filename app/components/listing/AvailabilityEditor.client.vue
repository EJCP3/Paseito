<script setup lang="ts">
/**
 * AvailabilityEditor — Editor de disponibilidad de una villa (solo el dueño).
 * Un DatePicker en modo rango crea/mueve rangos; el Calendar de abajo pinta
 * los rangos ya guardados y, al hacer clic en un día, v-calendar abre su
 * popover nativo con las opciones "Editar fechas" / "Eliminar".
 */
import { Calendar, DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import type { AvailabilityRange } from '~~/shared/types/listing'
import { AvailabilityStatus, AvailabilityStatusLabels } from '~~/shared/types/enums'

const props = defineProps<{ listingId: string }>()

const { ranges, loading, saveRange, deleteRange } = useAvailability(props.listingId)

const draftId = ref<string | null>(null)
const draftRange = ref<{ start: Date; end: Date } | null>(null)
const draftStatus = ref<AvailabilityStatus>(AvailabilityStatus.AVAILABLE)
const saving = ref(false)
const saveError = ref('')

const statusColor: Record<string, string> = {
  [AvailabilityStatus.AVAILABLE]: 'green',
  [AvailabilityStatus.BLOCKED]: 'gray',
  [AvailabilityStatus.BOOKED]: 'red',
}

const attributes = computed(() =>
  ranges.value.map((r: AvailabilityRange) => ({
    key: r.id,
    dates: { start: new Date(r.startDate), end: new Date(r.endDate) },
    highlight: statusColor[r.status] || 'gray',
    popover: { visibility: 'click' },
    customData: r,
  }))
)

function resetDraft() {
  draftId.value = null
  draftRange.value = null
  draftStatus.value = AvailabilityStatus.AVAILABLE
  saveError.value = ''
}

async function handleSave() {
  if (!draftRange.value) return
  saveError.value = ''
  saving.value = true
  try {
    await saveRange({
      id: draftId.value || undefined,
      startDate: draftRange.value.start,
      endDate: draftRange.value.end,
      status: draftStatus.value,
    })
    resetDraft()
  } catch {
    saveError.value = 'No se pudo guardar el rango.'
  } finally {
    saving.value = false
  }
}

function editRange(range: AvailabilityRange, hide?: () => void) {
  draftId.value = range.id
  draftRange.value = { start: new Date(range.startDate), end: new Date(range.endDate) }
  draftStatus.value = range.status
  hide?.()
}

async function removeRange(rangeId: string, hide?: () => void) {
  if (!confirm('¿Eliminar este rango de disponibilidad?')) return
  await deleteRange(rangeId)
  hide?.()
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-semibold mb-2">
        {{ draftId ? 'Editar rango seleccionado' : 'Nuevo rango de disponibilidad' }}
      </p>
      <DatePicker v-model.range="draftRange" :min-date="new Date()" expanded />

      <div class="flex flex-wrap gap-2 mt-3">
        <button
          v-for="opt in [AvailabilityStatus.AVAILABLE, AvailabilityStatus.BLOCKED]"
          :key="opt"
          type="button"
          class="pill"
          :class="{ active: draftStatus === opt }"
          @click="draftStatus = opt"
        >
          {{ AvailabilityStatusLabels[opt] }}
        </button>
      </div>

      <p v-if="saveError" class="text-xs text-red-600 mt-2">{{ saveError }}</p>

      <div class="flex gap-2 mt-3">
        <button type="button" class="btn btn-neon btn-sm" :disabled="!draftRange || saving" @click="handleSave">
          {{ saving ? 'Guardando…' : (draftId ? 'Actualizar rango' : 'Guardar rango') }}
        </button>
        <button
          v-if="draftId"
          type="button"
          class="btn btn-sm"
          style="border: 1px solid var(--color-border); background: transparent;"
          @click="resetDraft"
        >
          Cancelar
        </button>
      </div>
    </div>

    <div>
      <p class="text-sm font-semibold mb-2">Calendario de disponibilidad</p>
      <p v-if="loading" class="text-xs mb-2" style="color: var(--color-muted);">Cargando…</p>
      <Calendar :attributes="attributes as any" expanded>
        <template #day-popover="{ attributes: dayAttrs, hide }">
          <div class="p-2 space-y-3 min-w-[200px]">
            <div v-for="attr in dayAttrs" :key="attr.key" class="text-xs">
              <p class="font-semibold mb-1">{{ AvailabilityStatusLabels[attr.customData.status as AvailabilityStatus] }}</p>
              <p class="mb-2" style="color: var(--color-muted);">
                {{ new Date(attr.customData.startDate).toLocaleDateString() }} — {{ new Date(attr.customData.endDate).toLocaleDateString() }}
              </p>
              <div class="flex gap-3">
                <button type="button" class="text-xs font-semibold underline" @click="editRange(attr.customData, hide)">
                  Editar fechas
                </button>
                <button type="button" class="text-xs font-semibold underline text-red-600" @click="removeRange(attr.customData.id, hide)">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </template>
      </Calendar>
    </div>
  </div>
</template>
