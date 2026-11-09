<script setup lang="ts">
/**
 * ReportModal — Reportar un anuncio (RQ-MOD-02). Sesión opcional.
 */
import { ReportInputSchema } from '~~/shared/schemas/report.schema'
import { ReportReason } from '~~/shared/types/enums'

const props = defineProps<{ show: boolean; listingId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const LABELS: Record<string, string> = {
  SPAM: 'Spam o publicidad',
  FRAUD: 'Posible estafa o fraude',
  INAPPROPRIATE: 'Contenido inapropiado',
  MISLEADING_PRICE: 'Precio engañoso',
  OTHER: 'Otro motivo',
}

const reason = ref<string>('')
const details = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

const dialog = ref<HTMLElement | null>(null)
const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }

watch(() => props.show, async (open) => {
  if (open) {
    reason.value = ''
    details.value = ''
    error.value = ''
    sent.value = false
    window.addEventListener('keydown', onEsc)
    await nextTick()
    dialog.value?.focus()
  } else {
    window.removeEventListener('keydown', onEsc)
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))

async function submit() {
  error.value = ''
  const parsed = ReportInputSchema.safeParse({ reason: reason.value || undefined, details: details.value || undefined })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message || 'Datos inválidos'
    return
  }
  loading.value = true
  try {
    await $fetch(`/api/listings/${props.listingId}/report`, { method: 'POST', body: parsed.data })
    sent.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'No se pudo enviar el reporte. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      data-theme="light"
      class="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('close')"
    >
      <div ref="dialog" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="report-title" class="w-full max-w-md rounded-3xl bg-white p-6 text-black outline-none">
        <template v-if="!sent">
          <h2 id="report-title" class="text-xl font-bold mb-4" style="font-family: var(--font-heading);">Reportar anuncio</h2>
          <form class="flex flex-col gap-3" @submit.prevent="submit">
            <label v-for="r in Object.values(ReportReason)" :key="r" class="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input v-model="reason" type="radio" name="report-reason" :value="r" class="h-4 w-4" style="accent-color: #000;">
              {{ LABELS[r] }}
            </label>
            <textarea
              v-model="details"
              rows="3"
              maxlength="1000"
              class="w-full rounded-xl border border-gray-300 p-3 text-sm"
              :placeholder="reason === 'OTHER' ? 'Cuéntanos qué ocurre (obligatorio)' : 'Detalles (opcional)'"
            />
            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
            <div class="flex justify-end gap-2 mt-1">
              <button type="button" class="btn btn-sm btn-ghost !text-neutral-800 underline" @click="emit('close')">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-neon" :disabled="loading">{{ loading ? 'Enviando…' : 'Enviar reporte' }}</button>
            </div>
          </form>
        </template>
        <template v-else>
          <h2 id="report-title" class="text-xl font-bold mb-2" style="font-family: var(--font-heading);">Gracias</h2>
          <p class="text-sm mb-4">Recibimos tu reporte y lo revisaremos pronto.</p>
          <div class="flex justify-end">
            <button type="button" class="btn btn-sm btn-neon" @click="emit('close')">Cerrar</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
