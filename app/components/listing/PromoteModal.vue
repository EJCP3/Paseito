<script setup lang="ts">
/**
 * PromoteModal — Promocionar un anuncio (pago manual): elige espacio y plan, solicita,
 * y recibe las instrucciones de pago con el importe y la referencia.
 */
import {
  FEATURE_PLANS, PAYMENT_INSTRUCTIONS, PLACEMENT_LABELS, PLACEMENT_HINTS, formatUsd, formatRD,
  type FeaturePlacementKey, type FeaturePlanKey,
} from '~~/shared/config/featurePricing'

const props = defineProps<{ show: boolean; listingId: string; title: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'done'): void }>()

const PLACEMENTS = Object.keys(PLACEMENT_LABELS) as FeaturePlacementKey[]
const PLANS = Object.keys(FEATURE_PLANS) as FeaturePlanKey[]

const placement = ref<FeaturePlacementKey>('BADGE')
const plan = ref<FeaturePlanKey>('7d')
const hero = ref<{ available: boolean; freeAt: string | null } | null>(null)
const error = ref('')
const loading = ref(false)
const result = ref<{ ref: string; priceCents: number } | null>(null)

const dialog = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }

function close() {
  if (result.value) emit('done')
  emit('close')
}

watch(() => props.show, async (open) => {
  if (open) {
    opener = document.activeElement as HTMLElement | null
    placement.value = 'BADGE'
    plan.value = '7d'
    error.value = ''
    result.value = null
    hero.value = null
    window.addEventListener('keydown', onEsc)
    $fetch<{ available: boolean; freeAt: string | null }>('/api/features/hero-availability').then((r) => { hero.value = r }).catch(() => {})
    await nextTick()
    dialog.value?.focus()
  } else {
    window.removeEventListener('keydown', onEsc)
    opener?.focus?.()
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))

const heroFull = computed(() => hero.value?.available === false)
watch(heroFull, (full) => { if (full && placement.value === 'HERO') placement.value = 'BADGE' })

const price = computed(() => FEATURE_PLANS[plan.value].prices[placement.value])

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const f = await $fetch<{ ref: string; priceCents: number }>('/api/features', {
      method: 'POST',
      body: { listingId: props.listingId, placement: placement.value, plan: plan.value },
    })
    result.value = f
  } catch (e: any) {
    const freeAt = e?.data?.data?.freeAt
    error.value = (e?.data?.statusMessage || 'No se pudo enviar la solicitud.') + (freeAt ? ` Se libera el ${formatRD(freeAt, true)} (hora RD).` : '')
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
      @click.self="close"
    >
      <div ref="dialog" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="promote-title" class="promote-dialog w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 text-black outline-none">
        <template v-if="!result">
          <h2 id="promote-title" class="text-xl font-bold" style="font-family: var(--font-heading);">Promocionar anuncio</h2>
          <p class="text-sm mb-4 break-words" style="color: var(--color-muted);">{{ title }}</p>

          <form class="flex flex-col gap-4" @submit.prevent="submit">
            <fieldset v-for="p in PLACEMENTS" :key="p" class="m-0 p-0 border-0" :disabled="p === 'HERO' && heroFull">
              <legend class="font-semibold text-sm">{{ PLACEMENT_LABELS[p] }}</legend>
              <p class="text-xs mb-2" style="color: var(--color-muted);">{{ PLACEMENT_HINTS[p] }}</p>
              <p v-if="p === 'HERO' && heroFull" class="text-xs text-amber-700 mb-2">
                Lleno por ahora.<template v-if="hero?.freeAt"> Se libera el {{ formatRD(hero.freeAt, true) }} (hora RD).</template>
              </p>
              <div class="grid grid-cols-2 gap-2" role="radiogroup" :aria-label="PLACEMENT_LABELS[p]">
                <button
                  v-for="pl in PLANS"
                  :key="pl"
                  type="button"
                  role="radio"
                  :aria-checked="placement === p && plan === pl"
                  :disabled="p === 'HERO' && heroFull"
                  class="promote-opt flex flex-col items-start rounded-2xl border p-3 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="placement === p && plan === pl ? 'border-black bg-neutral-100' : 'border-gray-300'"
                  @click="placement = p; plan = pl"
                >
                  <span class="font-bold">{{ formatUsd(FEATURE_PLANS[pl].prices[p]) }}</span>
                  <span class="text-xs" style="color: var(--color-muted);">{{ FEATURE_PLANS[pl].days }} días</span>
                </button>
              </div>
            </fieldset>

            <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
            <div class="flex items-center justify-between gap-2 mt-1">
              <span class="text-sm">Total: <strong>{{ formatUsd(price) }}</strong></span>
              <div class="flex gap-2">
                <button type="button" class="btn btn-sm btn-ghost !text-neutral-800 underline" @click="close">Cancelar</button>
                <button type="submit" class="btn btn-sm btn-neon" :disabled="loading">{{ loading ? 'Enviando…' : 'Solicitar' }}</button>
              </div>
            </div>
          </form>
        </template>

        <template v-else>
          <h2 id="promote-title" class="text-xl font-bold mb-2" style="font-family: var(--font-heading);">Solicitud creada</h2>
          <p class="text-sm mb-3">Tu destacado se activará cuando confirmemos el pago.</p>
          <dl class="rounded-2xl bg-neutral-100 p-4 text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-3">
            <dt style="color: var(--color-muted);">Importe</dt><dd class="font-bold">{{ formatUsd(result.priceCents) }}</dd>
            <dt style="color: var(--color-muted);">Referencia</dt><dd class="font-mono font-bold tracking-wider">{{ result.ref }}</dd>
          </dl>
          <p class="text-sm whitespace-pre-line mb-4">{{ PAYMENT_INSTRUCTIONS }}</p>
          <div class="flex justify-end">
            <button type="button" class="btn btn-sm btn-neon" @click="close">Entendido</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.promote-opt:focus-visible { outline: 2px solid #000; outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) {
  .promote-dialog { animation: promote-in 0.2s ease-out; }
  @keyframes promote-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
}
</style>
