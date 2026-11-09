<script setup lang="ts">
definePageMeta({ title: 'Buscar anuncios' })
useSeoMeta({
  title: 'Buscar anuncios — Paseito',
  description: 'Busca apartamentos, casas y villas en República Dominicana con recorridos 360°. Filtra por ciudad, precio, habitaciones y más.',
})

const LIMIT = 24
const { filters, apiQuery, activeCount, clearFilters } = useSearchFilters()

const { data, pending, error } = useFetch<any>('/api/listings', {
  query: computed(() => ({ ...apiQuery.value, featuredFirst: 'BADGE', page: 1, limit: LIMIT })),
  watch: [filters],
})

// Primera página = datos de useFetch (llegan hidratados desde el SSR); "Cargar más"
// acumula páginas extra, que se reinician al cambiar los filtros.
const extra = ref<any[]>([])
const page = ref(1)
const items = computed(() => [...(data.value?.data ?? []), ...extra.value])
const total = computed(() => data.value?.total ?? 0)
watch(filters, () => { extra.value = []; page.value = 1 })

const loadingMore = ref(false)
async function loadMore() {
  loadingMore.value = true
  try {
    const next: any = await $fetch('/api/listings', { query: { ...apiQuery.value, featuredFirst: 'BADGE', page: page.value + 1, limit: LIMIT } })
    extra.value = [...extra.value, ...next.data]
    page.value++
  } finally {
    loadingMore.value = false
  }
}

const view = ref<'grid' | 'map'>('grid')
const views = [{ key: 'grid', label: 'Grilla' }, { key: 'map', label: 'Mapa' }] as const
const sheetOpen = ref(false)
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
    <div class="flex items-center justify-between gap-3 mb-6">
      <div class="min-w-0">
        <NuxtLink to="/" class="text-sm underline">&larr; Paseito</NuxtLink>
        <h1 class="text-2xl lg:text-3xl font-black tracking-tight" style="font-family: var(--font-heading);">Buscar anuncios</h1>
        <p class="text-sm" style="color: var(--color-muted);" aria-live="polite">
          {{ pending ? 'Buscando…' : `${total} resultado${total === 1 ? '' : 's'}` }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button type="button" class="lg:hidden btn btn-sm" @click="sheetOpen = true">
          Filtros{{ activeCount ? ` (${activeCount})` : '' }}
        </button>
        <div role="tablist" aria-label="Vista de resultados" class="inline-flex rounded-full border border-gray-200 p-1 bg-white">
          <button
            v-for="v in views"
            :id="`tab-${v.key}`"
            :key="v.key"
            type="button"
            role="tab"
            :aria-selected="view === v.key"
            aria-controls="search-results"
            class="px-4 py-1.5 text-sm font-semibold rounded-full"
            :style="view === v.key ? 'background: var(--color-neon); color: #0D0D0D;' : ''"
            @click="view = v.key"
          >{{ v.label }}</button>
        </div>
      </div>
    </div>

    <div class="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      <!-- Escritorio: barra lateral -->
      <aside class="hidden lg:block sticky top-6 self-start" aria-label="Filtros">
        <SearchFilters />
      </aside>

      <section id="search-results" role="tabpanel" :aria-labelledby="`tab-${view}`" :aria-busy="pending">
        <div v-if="error" role="alert" class="py-16 text-center text-sm">
          No se pudo cargar la búsqueda.
        </div>

        <div v-else-if="pending && !items.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-[#e3e3df] rounded-2xl aspect-[4/3]" />
        </div>

        <EmptyState
          v-else-if="!items.length"
          title="No encontramos anuncios"
          text="Prueba con otros filtros o quítalos para ver todo."
          :action-label="activeCount ? 'Quitar filtros' : undefined"
          @action="clearFilters()"
        />

        <template v-else>
          <div v-if="view === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" :class="{ 'opacity-60 transition-opacity': pending }">
            <ListingCard v-for="l in items" :key="l.id" :listing="l" />
          </div>
          <ClientOnly v-else>
            <SearchMap :listings="items" />
          </ClientOnly>

          <div v-if="items.length < total" class="mt-8 text-center">
            <button type="button" class="btn" :disabled="loadingMore" @click="loadMore">
              {{ loadingMore ? 'Cargando…' : 'Cargar más' }}
            </button>
          </div>
        </template>
      </section>
    </div>

    <!-- Móvil: hoja inferior -->
    <div class="lg:hidden">
      <div
        class="sheet-backdrop fixed inset-0 z-[1290] bg-black/40"
        :class="sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        @click="sheetOpen = false"
      />
      <div
        class="sheet fixed inset-x-0 bottom-0 z-[1300] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
        :class="sheetOpen ? 'translate-y-0' : 'translate-y-full'"
        role="dialog"
        aria-label="Filtros"
        :aria-hidden="!sheetOpen"
        :inert="!sheetOpen"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">Filtros</h2>
          <button type="button" class="text-sm font-semibold underline" @click="sheetOpen = false">Cerrar</button>
        </div>
        <SearchFilters />
        <button type="button" class="btn btn-neon w-full mt-5" @click="sheetOpen = false">
          Ver {{ total }} resultado{{ total === 1 ? '' : 's' }}
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.sheet { transition: transform 0.3s ease; }
.sheet-backdrop { transition: opacity 0.3s ease; }
@media (prefers-reduced-motion: reduce) {
  .sheet, .sheet-backdrop { transition: none; }
}
</style>
