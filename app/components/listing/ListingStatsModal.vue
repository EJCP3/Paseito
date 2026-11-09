<script setup lang="ts">
/**
 * ListingStatsModal — Estadísticas de un anuncio (RQ-ANALYTICS-02): barras diarias
 * de vistas y contactos (CSS), desglose por canal y tiempo medio en el tour.
 */
import type { EventSummary } from '~~/server/lib/analytics'

type Stats = EventSummary & { days: number }

const props = defineProps<{ show: boolean; listingId: string; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', website: 'Sitio web',
}

const days = ref(30)
const stats = ref<Stats | null>(null)
const loading = ref(false)
const error = ref('')
const dialog = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await $fetch<Stats>(`/api/listings/${props.listingId}/stats`, { query: { days: days.value } })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'No se pudieron cargar las estadísticas.'
  } finally {
    loading.value = false
  }
}

const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }

watch(() => props.show, async (open) => {
  if (open) {
    opener = document.activeElement as HTMLElement | null
    stats.value = null
    window.addEventListener('keydown', onEsc)
    load()
    await nextTick()
    dialog.value?.focus()
  } else {
    window.removeEventListener('keydown', onEsc)
    opener?.focus?.()
  }
})
watch(days, () => { if (props.show) load() })
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))

// Días en hora de República Dominicana (igual que el servidor); en-CA da YYYY-MM-DD
const drDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo' })
// Serie continua (días sin eventos = 0) para que las barras no salten de fecha
const series = computed(() => {
  const byDate = new Map((stats.value?.byDay ?? []).map((d) => [d.date, d]))
  const out: { date: string; views: number; contactClicks: number }[] = []
  for (let i = days.value - 1; i >= 0; i--) {
    const date = drDay.format(new Date(Date.now() - i * 86_400_000))
    out.push(byDate.get(date) ?? { date, views: 0, contactClicks: 0 })
  }
  return out
})
const maxDay = computed(() => Math.max(1, ...series.value.flatMap((d) => [d.views, d.contactClicks])))
const channels = computed(() =>
  Object.entries(stats.value?.byChannel ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]),
)
const pct = (n: number) => `${Math.max(n ? 4 : 0, (n / maxDay.value) * 100)}%`
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      data-theme="light"
      class="stats-overlay fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('close')"
    >
      <div
        ref="dialog"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
        class="stats-dialog w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 text-black outline-none"
      >
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <h2 id="stats-title" class="text-xl font-bold" style="font-family: var(--font-heading);">Estadísticas</h2>
            <p class="text-sm truncate" style="color: var(--color-muted);">{{ title }}</p>
          </div>
          <button type="button" class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-black/5" aria-label="Cerrar" @click="emit('close')">
            <Icon name="close" class="w-5 h-5" />
          </button>
        </div>

        <div class="flex gap-2 mb-5" role="group" aria-label="Periodo">
          <button
            v-for="d in [7, 30, 90]"
            :key="d"
            type="button"
            class="btn btn-sm"
            :class="days === d ? 'btn-neon' : ''"
            :style="days === d ? '' : 'border: 1px solid var(--color-border); background: #fff; color: #171717;'"
            :aria-pressed="days === d"
            @click="days = d"
          >{{ d }} días</button>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-else-if="loading && !stats" class="text-sm" style="color: var(--color-muted);">Cargando…</p>

        <template v-else-if="stats">
          <div class="grid grid-cols-3 gap-2 mb-5 text-center">
            <div class="rounded-2xl p-3" style="background: var(--color-surface);">
              <p class="text-2xl font-black">{{ stats.views }}</p>
              <p class="text-xs" style="color: var(--color-muted);">Vistas</p>
            </div>
            <div class="rounded-2xl p-3" style="background: var(--color-surface);">
              <p class="text-2xl font-black">{{ stats.contactClicks }}</p>
              <p class="text-xs" style="color: var(--color-muted);">Contactos</p>
            </div>
            <div class="rounded-2xl p-3" style="background: var(--color-surface);">
              <p class="text-2xl font-black">{{ stats.avgTourSeconds }}s</p>
              <p class="text-xs" style="color: var(--color-muted);">Tiempo medio en el tour</p>
            </div>
          </div>

          <h3 class="text-sm font-bold mb-2">Por día</h3>
          <div
            class="flex items-end gap-px h-32 border-b"
            style="border-color: var(--color-border);"
            role="img"
            :aria-label="`Vistas y contactos por día, últimos ${days} días`"
          >
            <div v-for="d in series" :key="d.date" class="flex-1 min-w-0 h-full flex items-end gap-px" :title="`${d.date}: ${d.views} vistas, ${d.contactClicks} contactos`">
              <span class="stats-bar flex-1 rounded-t-sm" style="background: #171717;" :style="{ height: pct(d.views) }" />
              <span class="stats-bar flex-1 rounded-t-sm" style="background: #16a34a;" :style="{ height: pct(d.contactClicks) }" />
            </div>
          </div>
          <div class="flex items-center justify-between gap-2 text-[11px] mt-1" style="color: var(--color-muted);">
            <span>{{ series[0]?.date }}</span>
            <span class="flex items-center gap-3">
              <span class="flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 rounded-sm" style="background: #171717;" />Vistas</span>
              <span class="flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 rounded-sm" style="background: #16a34a;" />Contactos</span>
            </span>
            <span>{{ series[series.length - 1]?.date }}</span>
          </div>

          <h3 class="text-sm font-bold mt-5 mb-2">Contactos por canal</h3>
          <p v-if="!channels.length" class="text-sm" style="color: var(--color-muted);">Aún no hay clics de contacto en este periodo.</p>
          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="[ch, n] in channels" :key="ch" class="flex items-center gap-3 text-sm">
              <span class="w-24 flex-shrink-0">{{ CHANNEL_LABELS[ch] || ch }}</span>
              <span class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--color-surface);">
                <span class="stats-hbar block h-full rounded-full" style="background: #16a34a;" :style="{ width: `${(n / stats.contactClicks) * 100}%` }" />
              </span>
              <span class="w-8 text-right font-semibold">{{ n }}</span>
            </li>
          </ul>
          <p class="text-xs mt-4" style="color: var(--color-muted);">
            Las visitas se cuentan una vez por visitante cada 30 min y no incluyen las tuyas. {{ stats.tourOpens }} abrieron el tour 360°.
          </p>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.stats-overlay { animation: stats-fade 0.18s ease-out; }
.stats-dialog { animation: stats-pop 0.2s ease-out; }
.stats-bar { transform-origin: bottom; animation: stats-grow 0.4s ease-out; }
@keyframes stats-fade { from { opacity: 0; } }
@keyframes stats-pop { from { opacity: 0; transform: translateY(8px); } }
@keyframes stats-grow { from { transform: scaleY(0); } }
@media (prefers-reduced-motion: reduce) {
  .stats-overlay, .stats-dialog, .stats-bar { animation: none; }
}
</style>
